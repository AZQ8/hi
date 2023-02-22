/*
 * File: f.js
 * Project: beepbot
 * Created Date: 07.10.2020 20:44:00
 * Author: 3urobeat
 *
 * Last Modified: 19.01.2022 13:38:06
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const Discord = require('discord.js'); //eslint-disable-line

/**
 * The f command
 * @param {Discord.Client} bot The Discord client class
 * @param {Discord.Message} message The recieved message object
 * @param {Array} args An array of arguments the user provided
 * @param {Object} lang The language object for this guild
 * @param {Function} logger The logger function
 * @param {Object} guildsettings All settings of this guild
 * @param {Object} fn The object containing references to functions for easier access
 */
module.exports.run = async (bot, message, args, lang, logger, guildsettings, fn) => { //eslint-disable-line
    message.channel.send(`${String(lang.cmd.otherfun.fpaidrespects).replace("username", `**${message.author.username}**`)} <:paidrespects:763023492521656330>`);
};

module.exports.info = {
    names: ["f"],
    description: "cmd.otherfun.finfodescription",
    usage: "",
    options: [],
    accessableby: ["all"],
    allowedindm: true,
    nsfwonly: false
};