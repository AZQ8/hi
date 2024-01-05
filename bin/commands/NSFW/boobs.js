/*
 * File: boobs.js
 * Project: beepbot
 * Created Date: 2020-10-01 18:53:00
 * Author: 3urobeat
 *
 * Last Modified: 2024-01-05 23:16:13
 * Modified By: 3urobeat
 *
 * Copyright (c) 2020 - 2024 3urobeat <https://github.com/3urobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


const Discord = require('discord.js'); //eslint-disable-line

/**
 * The boobs command
 * @param {Discord.Client} bot The Discord client class
 * @param {Discord.Message} message The received message object
 * @param {Array} args An array of arguments the user provided
 * @param {Object} lang The language object for this guild
 * @param {Function} logger The logger function
 * @param {Object} guildsettings All settings of this guild
 * @param {Object} fn The object containing references to functions for easier access
 */
module.exports.run = async (bot, message, args, lang, logger, guildsettings, fn) => {
    try {
        // Note: If this API shouldn't work anymore, use nekobot: https://nekobot.xyz/api/image?type=boobs
        let { body } = await require("superagent").get("http://api.oboobs.ru/boobs/0/1/random");

        let imageurl = "http://media.oboobs.ru/" + body[0].preview;

        message.channel.send({
            embeds: [{
                title: lang.general.imagehyperlink,
                url: imageurl,
                image: {
                    url: imageurl
                },
                footer: {
                    text: `${lang.general.poweredby} api.oboobs.ru`
                },
                timestamp: message.createdAt,
                color: fn.randomhex()
            }]
        });

    } catch (err) {
        logger("error", "boobs.js", "API Error: " + err);
        message.channel.send(`api.oboobs.ru boobs API ${lang.general.error}: ${err}`);
    }
};

module.exports.info = {
    names: ["boobs", "tits"],
    description: "cmd.othernsfw.boobsinfodescription",
    usage: "",
    options: [],
    accessableby: ["all"],
    allowedindm: true,
    nsfwonly: true
};
