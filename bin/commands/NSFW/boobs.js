module.exports.run = async (bot, message, args, lang) => {
    const v = require("../../vars.js")
    var logger = v.logger
 
    try {
        let { body } = await v.superagent.get('http://api.oboobs.ru/boobs/0/1/random')
        
        let imageurl = "http://media.oboobs.ru/" + body[0].preview
        message.channel.send({embed:{
            title: "Image doesn't load? Click here!",
            url: imageurl,
            image: {
                url: imageurl },
            footer: {
                icon_url: message.author.displayAvatarURL,
                text: "Requestet by " + message.author.username },
            timestamp: message.createdAt,
            color: v.randomhex() } })

    } catch (err) {
        logger("error", "boobs.js", "API Error: " + err)
        message.channel.send("boobs API Error: " + err) }
}

module.exports.aliases = {
    1: "boobs",
    2: "tits"
}
module.exports.info = {
    name: "boobs",
    description: "Posts porn pictures of boobs. (NSFW)",
    accessableby: ['all'],
    allowedindm: true,
    nsfwonly: true,
    aliases: this.aliases
}