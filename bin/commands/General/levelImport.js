/*
 * File: levelImport.js
 * Project: beepbot
 * Created Date: 12.01.2022 12:19:50
 * Author: 3urobeat
 * 
 * Last Modified: 12.01.2022 13:48:50
 * Modified By: 3urobeat
 * 
 * Copyright (c) 2022 3urobeat <https://github.com/HerrEurobeat>
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 
 */


const Discord = require('discord.js'); //eslint-disable-line

/**
 * The levelImport command
 * @param {Discord.Client} bot The Discord client class
 * @param {Discord.Message} message The recieved message object
 * @param {Array} args An array of arguments the user provided
 * @param {Object} lang The language object for this guild
 * @param {Function} logger The logger function
 * @param {Object} guildsettings All settings of this guild
 * @param {Object} fn The object containing references to functions for easier access
 */
module.exports.run = async (bot, message, args, lang, logger, guildsettings, fn) => { //eslint-disable-line
    let lf = lang.cmd.othergeneral

    message.channel.send(lang.cmd.othergeneral.levelImportconfirm)

    //Define message collector and set timeout to 15 sec
    const collector = new Discord.MessageCollector(message.channel, m => m.author.id === message.author.id, {time: 15000});

    collector.on('collect', async (msg) => {
        if (message.author.id !== msg.author.id) return; //only the original author is allowed to answer

        if (msg.content == "y") {
            var msg = await message.channel.send(lf.levelImportimportstart);

            //Get data from mee6 API (which I found using burpsuite when visiting leaderboard website)
            require("superagent").get(`https://mee6.xyz/api/plugins/levels/leaderboard/${message.guild.id}`).then((res) => {

                //check if mee6 has no data for this server
                if (res.body.players.length == 0) return msg.edit(lf.levelImportnodata);

                msg.edit(lf.levelImportdatafound.replace("useramount", res.body.players.length));

                //start writing data into db
                res.body.players.forEach((e, i) => {

                    setTimeout(() => {                        
                        bot.levelsdb.update({ $and: [{ userid: e.id }, { guildid: e.guild_id }] }, 
                            { $set: { xp: e.xp, messages: e.message_count, userid: e.id, guildid: e.guild_id } }, 
                            { upsert: true }, (err) => {
                                
                            if (err) logger("error", "levelImport.js", `Error updating db of guild ${message.guild.id}. Error: ${err}`)
    
                            //check if this is the last iteration and send finished msg
                            if (i + 1 == res.body.players.length) {
    
                                bot.levelsdb.find({ guildid: message.guild.id }, (err, docs) => {
                                    message.channel.send(`${lf.levelImportfinished.replace("useramount", docs.length)} \`${guildsettings.prefix}ranks\``)
                                })
                            }
                        })
                    }, 25 * i);
                })
            })

        } else {
            message.channel.send(lf.levelImportaborted);
        }
        
        collector.stop()
    });

}

module.exports.info = {
    names: ["levelimport"],
    description: "cmd.othergeneral.levelImportinfodescription",
    usage: '',
    accessableby: ['admins'],
    allowedindm: false,
    nsfwonly: false
}