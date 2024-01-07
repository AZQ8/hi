/*
 * File: dataManager.js
 * Project: beepbot
 * Created Date: 2024-01-06 09:30:45
 * Author: 3urobeat
 *
 * Last Modified: 2024-01-07 17:50:13
 * Modified By: 3urobeat
 *
 * Copyright (c) 2024 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const fs   = require("fs");
const path = require("path");
const nedb = require("@seald-io/nedb");
const { default: Nedb } = require("@seald-io/nedb"); // eslint-disable-line

const tokens = require("../../token.json");


/**
 * Constructor - The data manager loads and stores data stored on the disk
 */
const DataManager = function() {

    // Contains configuration variables
    this.config = require("./config.json");

    // Contains various constant settings
    this.constants = require("./constants.json");

    // Settings based on if the bot was started in prod or test mode
    this.botSettings = {
        BOTNAME: "beepBot",
        BOTAVATAR: this.constants.botdefaultavatar,
        token: tokens.token,
        respawn: true
    };

    // Stores all language files supported by the bot
    this.langObj = {};


    /**
     * Database which stores guild specific settings
     * Document structure: { guildid: string, prefix: string, lang: string, adminroles: string[], moderatorroles: string[], systemchannel: string | null, modlogfeatures: string[], greetmsg: string | null, byemsg: string | null, memberaddroles: string[], levelsystem: boolean, allownsfw: boolean }
     * @type {Nedb}
     */
    this.settings = {};

    /**
     * Database which stores bans applied through the bot
     * Document structure: { userid: string, until: number, guildid: string, authorid: string, banreason: string }
     * @type {Nedb}
     */
    this.timedbans = {};

    /**
     * Database which stores mutes applied through the bot
     * Document structure: { type: string, userid: string, until?: number, where: string, guildid: string, authorid: string, mutereason: string }
     * @type {Nedb}
     */
    this.timedmutes = {};

    /**
     * Database which stores message reactions to monitor changes of
     * Document structure: { type: string, msg: string, reaction: string, guildid: string, allowedroles: string[], until: number }
     * @type {Nedb}
     */
    this.monitorreactions = {};

    /**
     * Database which stores levelsystem data for every user
     * Document structure: { xp: number, messages: number, userid: string, guildid: string, username: string }
     * @type {Nedb}
     */
    this.levelsdb = {};


    // Load DataManager's helper files
    require("./functions/getLang.js");

};

module.exports = DataManager;


/**
 * Imports data from the disk
 */
DataManager.prototype.loadData = async function() {

    // Change botSettings to test values if bot was started in test mode
    if (this.config.loginmode === "test") {
        this.botSettings.BOTNAME   = "beepTestBot";
        this.botSettings.BOTAVATAR = this.constants.testbotdefaultavatar;
        this.botSettings.token     = tokens.testtoken;
        this.botSettings.respawn   = false;
    }


    /**
     * Function to construct the language object
     * @param {string} dir Language Folder Root Path
     */
    let langFiles = (dir) => { // Idea from https://stackoverflow.com/a/63111390/12934162
        fs.readdirSync(dir).forEach((file) => {
            const absolute = path.join(dir, file);

            if (fs.statSync(absolute).isDirectory()) {
                return langFiles(absolute);
            } else {
                if (!file.includes(".json")) return; // Ignore all files that aren't .json
                let result = absolute.replace(".json", "").replace(/\\/g, "/").split("/"); // Remove file ending, convert windows \ to unix / and split path into array

                result.splice(0, 2); // Remove "bin" and "lang"
                result.splice(2, 1); // Remove category name

                if (!this.langObj[result[0]]) this.langObj[result[0]] = {}; // Create language key
                if (!this.langObj[result[0]]["cmd"]) this.langObj[result[0]]["cmd"] = {}; // Create cmd key

                try {
                    if (result[1] == "commands") {
                        this.langObj[result[0]]["cmd"][result[2]] = require(absolute.replace("bin", "."));
                    } else {
                        this.langObj[result[0]][result[1]] = require(absolute.replace("bin", "."));
                    }
                } catch(err) {
                    if (err) logger("warn", "dataManager.js", `langFiles: lang ${result[0]} has an invalid file: ${err}`);
                }

                return;
            }
        });
    };

    langFiles("./bin/lang/"); // RECURSION TIME!


    // Load databases
    this.settings         = new nedb({ filename: "./data/settings.db", autoload: true }); // Autoload
    this.timedbans        = new nedb({ filename: "./data/timedbans.db", autoload: true });
    this.timedmutes       = new nedb({ filename: "./data/timedmutes.db", autoload: true });
    this.monitorreactions = new nedb({ filename: "./data/monitorreactions.db", autoload: true });
    this.levelsdb         = new nedb({ filename: "./data/levels.db", autoload: true });

};


/**
 * Displays some relevant warnings
 */
DataManager.prototype.checkData = function() {
    if (this.config.gamerotateseconds <= 10) logger("warn", "dataManager.js", "gamerotateseconds in config is <= 10 seconds! Please increase this value to avoid possible cooldown errors/API spamming!", true);
    if (this.config.gameurl == "") logger("warn", "dataManager.js", "gameurl in config is empty and will break the bots presence!", true);
};


/**
 * Appends a line to cmduse.txt
 * @param {string} str The string to append
 */
DataManager.prototype.appendToCmdUse = function(str) {
    let isoDate = (new Date(Date.now() - (new Date().getTimezoneOffset() * 60000))).toISOString().replace(/T/, " ").replace(/\..+/, "");

    fs.appendFile("./bin/cmduse.txt", `\n\n[${isoDate}] ${str}\n`, (err) => {
        if (err) logger("error", "controller.js", "writing startup to cmduse.txt error: " + err);
    });
};


/* -------- Register functions to let the IntelliSense know what's going on in helper files -------- */

/**
 * Gets the language of a guild from settings
 * @param {string} guildID The guild ID to get the language of
 * @returns {Promise.<object | null>} Resolves with guildSettings object or defaultSettings. On error, null is returned.
 */
DataManager.prototype.getLang = async function(guildID) {}; // eslint-disable-line
