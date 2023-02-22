/*
 * File: msgtomodlogchannel.js
 * Project: beepbot
 * Created Date: 07.02.2021 15:43:03
 * Author: 3urobeat
 *
 * Last Modified: 19.08.2022 20:32:44
 * Modified By: 3urobeat
 *
 * Copyright (c) 2021 3urobeat <https://github.com/HerrEurobeat>
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


// This file contains code of the msgtomodlogchannel function and is called by bot.js
// I did this to reduce the amount of lines in bot.js to make finding stuff easier.

const Discord = require('discord.js'); //eslint-disable-line

/**
 * The msgtomodlogchannel helper function
 * @param {Discord.Client} bot The Discord client class
 * @param {Function} logger Reference to the logger function
 * @param {Discord.Guild} guild The Discord guild class
 * @param {String} action The type of the modlog event (clear, unban, kick, etc.)
 * @param {Discord.User} author The Discord user class of the message author
 * @param {Discord.User} reciever The Discord user class of the action recipient
 * @param {Array} details Array containing further informations like the reasontext and if the user should be notified
 */
module.exports.run = (bot, logger, guild, action, author, reciever, details) => {
    bot.settings.findOne({ guildid: guild.id }, (err, guildsettings) => {
        if (guildsettings.modlogfeatures && !guildsettings.modlogfeatures.includes(action) && !action.includes("err")) return; // User turned off this modlogfeature and it isn't an err

        if (!guildsettings || !guildsettings.modlogchannel || action == "modlogmsgerr") { // If modlogchannel is undefined (turned off) or a previous modlogmsg failed
            if (action.includes("err")) { // If error, then find a channel to inform someone
                if (guildsettings.systemchannel) {
                    guildsettings.modlogchannel = guildsettings.systemchannel; // If no modlogchannel set, try systemchannel
                } else if (guild.systemChannelId) {
                    guildsettings.modlogchannel = guild.systemChannelId; // Then check if guild has a systemChannel set
                } else {
                    // Well then try and get the first channel (rawPosition) where the bot has permissions to send a message
                    guildsettings.modlogchannel = null; // Better set it to null to avoid potential problems

                    // get all text channels into array and sort them by ascending rawPositions
                    let textchannels = guild.channels.cache.filter(c => c.type == Discord.ChannelType.GuildText).sort((a, b) => a.rawPosition - b.rawPosition);
                    guildsettings.modlogchannel = textchannels.find(c => c.permissionsFor(bot.user).has(Discord.PermissionFlagsBits.SendMessages)).id; // Find the first channel with perms

                    if (!guildsettings.modlogchannel) return; // If it couldn't find a channel then stop
                }

                if (!guildsettings || !guildsettings.lang) guildsettings.lang = bot.constants.defaultguildsettings.lang; // Set default lang to suppress error from lang function
            } else {
                return; // Yes well if it isn't an error then stop
            }
        }

        let guildlang = bot.fn.lang(guild.id, guildsettings);

        // Avoid errors from controller.js unban broadcastEval
        if (!author["username"]) author["username"] = "ID: " + author.userid; // Userid will always be defined (look at controller.js unban broadcastEval)
        if (!author["discriminator"]) author["discriminator"] = "????";
        if (!reciever["username"]) reciever["username"] = "ID: " + reciever.userid;
        if (!reciever["discriminator"]) reciever["discriminator"] = "????";

        var embed = {
            title: "",
            color: null,
            fields: [],
            footer: { icon_url: bot.user.displayAvatarURL(), text: guildlang.general.modlogdeletewithreaction }
        };

        switch (action) {
            case "clear":
                embed.title = guildlang.general.modlogcleartitle.replace("author", `${author.username}#${author.discriminator}`).replace("clearamount", details[0]).replace("channelname", "#" + details[1].name);
                embed.color = 16753920; // Orange
                break;

            case "kick":
                embed.title = guildlang.general.modlogkicktitle.replace("author", `${author.username}#${author.discriminator}`).replace("reciever", `${reciever.username}#${reciever.discriminator}`);
                embed.color = 16753920; // Orange
                embed.fields.push({ name: `${guildlang.general.reason}:`, value: details[0] });
                embed.fields.push({ name: `${guildlang.general.details}:`, value: guildlang.general.modloguserwasnotified + String(details[1]).replace("true", "✅").replace("false", "❌") }); // Details[1] is a boolean if the user was notified
                break;

            case "ban":
                embed.title = guildlang.general.modlogbantitle.replace("author", `${author.username}#${author.discriminator}`).replace("reciever", `${reciever.username}#${reciever.discriminator}`);
                embed.color = 16711680; // Red
                embed.fields.push({ name: `${guildlang.general.reason}:`, value: details[0] });
                embed.fields.push({ name: `${guildlang.general.details}:`,
                                        value: `${guildlang.general.length}: ${details[1]}
                                                ${guildlang.general.modloguserwasnotified}${String(details[2]).replace("true", "✅").replace("false", "❌")}`
                                    });
                break;

            case "unban":
                embed.title = guildlang.general.modlogunbantitle.replace("reciever", `${reciever.username}#${reciever.discriminator}`);
                embed.color = 65280; // Green
                embed.fields.push({ name: `${guildlang.general.reason}:`, value: details[0] });
                break;

            case "unbanerr":
                embed.title = guildlang.general.modlogunbanerrtitle.replace("reciever", `${reciever.username}#${reciever.discriminator}`);
                embed.color = 14725921; // Some orange mixture
                embed.fields.push({ name: `${guildlang.general.error}:`, value: details[1] });
                embed.fields.push({ name: `${guildlang.general.reason}:`, value: details[0] });
                break;

            case "movemsg":
                if (details[0] == "convo") { // Conversation got moved
                    embed.title = guildlang.general.modlogmoveconvotitle.replace("author", `${author.username}#${author.discriminator}`).replace("amount", details[1]);
                    embed.color = 65280; // Green
                    embed.fields.push({ name: `${guildlang.general.channels}`, value: `<#${details[3]}> -> <#${details[4]}>` }); // Originalchannel -> movechannel
                    embed.fields.push({ name: `${guildlang.general.reason}:`, value: details[2] });
                } else {
                    embed.title = guildlang.general.modlogmovemsgtitle.replace("author", `${author.username}#${author.discriminator}`).replace("reciever", `${reciever.username}#${reciever.discriminator}`);
                    embed.color = 65280; // Green
                    embed.fields.push({ name: `${guildlang.general.modlogmovemsgcontent}:`, value: details[1] }); // Attachment is already in messagecontent
                    embed.fields.push({ name: `${guildlang.general.channels}`, value: `<#${details[3]}> -> <#${details[4]}>` }); // Originalchannel -> movechannel
                    embed.fields.push({ name: `${guildlang.general.reason}:`, value: details[2] });
                }
                break;

            case "mute":
                if (details[0] == "all") details[0] = "voice, chat"; // Change term to make it more understandable

                embed.title = guildlang.general.modlogmutetitle.replace("author", `${author.username}#${author.discriminator}`).replace("reciever", `${reciever.username}#${reciever.discriminator}`);
                embed.color = 16753920; // Orange
                embed.fields.push({ name: `${guildlang.general.reason}:`, value: details[1] });
                embed.fields.push({ name: `${guildlang.general.details}:`,
                                    value: `${guildlang.general.where}: ${details[0]}
                                            ${guildlang.general.length}: ${details[2]}
                                            ${guildlang.general.modloguserwasnotified}${String(details[3]).replace("true", "✅").replace("false", "❌")}`
                                    });
                break;

            case "unmute":
                embed.title = guildlang.general.modlogunmutetitle.replace("reciever", `${reciever.username}#${reciever.discriminator}`);
                embed.color = 65280; // Green
                embed.fields.push({ name: `${guildlang.general.reason}:`, value: details[1] });

                if (details[0] == "manual") embed.fields.push({ name: `${guildlang.general.modlogunmutedby}:`, value: `${author.username}#${author.discriminator}` }); // We only care about this information if the unmute was executed by the unmute cmd
                break;

            case "unmuteerr":
                embed.title = guildlang.general.modlogunmuteerrtitle.replace("reciever", `${reciever.username}#${reciever.discriminator}`);
                embed.color = 14725921; // Some orange mixture
                embed.fields.push({ name: `${guildlang.general.error}:`, value: details[1] });
                embed.fields.push({ name: `${guildlang.general.reason}:`, value: details[0] });
                break;

            case "modlogmsgerr":
                embed.title = guildlang.general.modlogmsgerrtitle;
                embed.color = 16711680; // Red
                embed.fields.push({ name: `${guildlang.general.error}:`, value: details[0] });
                embed.fields.push({ name: `${guildlang.general.message}:`, value: details[1] });
                break;

            default:
                return logger("error", "msgtomodlogchannel.js", "Unsupported action: " + action);
        }

        var modlogchannel = guild.channels.cache.get(guildsettings.modlogchannel);

        if (!modlogchannel) { // Check if modlogchannel can't be found
            bot.fn.msgtomodlogchannel(guild, "modlogmsgerr", author, reciever, [guildlang.general.modlogchannelnotfound.replace("channelid", guildsettings.modlogchannel), embed.title]);
            bot.settings.update({ guildid: guild.id }, { $set: { modlogchannel: bot.constants.defaultguildsettings.modlogchannel }}, {}, () => { }); // Reset setting
            return;
        }

        if (!modlogchannel.permissionsFor(bot.user).has(Discord.PermissionFlagsBits.AddReactions)) embed.footer.text = guildlang.general.modlognoaddreactionsperm; // Change footer text

        guild.channels.cache.get(guildsettings.modlogchannel).send({ embeds: [embed] })
            .then((msg) => { // Don't need to ask shard manager
                msg.react("🗑️")
                    .then(res => {
                        // Add res to monitorreactions db
                        bot.monitorreactions.insert({ type: "modlog", msg: res.message.id, reaction: res._emoji.name, guildid: guild.id, allowedroles: guildsettings.adminroles, until: Date.now() + 31557600000 }, (err) => { if (err) logger("error", "msgtomodlogchannel.js", "Error inserting modlogmsg reaction to db: " + err); }); // Message also contains guild and timestamp | 31557600000 ms = 12 months
                    })
                    .catch(() => {}); // Reaction err catch -> ignore error
            })
            .catch((err) => { // Sendmsg error catch
                if (err) return bot.fn.msgtomodlogchannel(guild, "modlogmsgerr", author, reciever, [err, embed.title]); // Call this same function again to notify that modlogmsgs can't be sent (won't end in a loop because if no channel can be found on err then it will stop)
            });
    });
};