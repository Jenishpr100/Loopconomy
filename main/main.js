const {Client,  IntentsBitField} = require('discord.js');

const cln = new Client({

    intents: [
        IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildMembers, IntentsBitField.Flags.GuildMessages, IntentsBitField.Flags.MessageContent, 
        ]
})


cln.on("clientReady", (c) => {
    console.log(`Logged in as ${c.user.tag}`) });

cln.on("messageCreate", (msg) => {

    if (msg.author.bot) return;

    console.log(`${msg.author.username}: ${msg.content}`);

    if (msg.content.toLowerCase().includes('anyways')) {

        if (msg.author.username !== "lyrics_loop" || msg.content.toLowerCase().includes('God is Dead') || msg.author.username !== "jkid88") {

            const emojis = ['❌', '©', '💥', '🔫'];

            for (const emoji of emojis) {
                msg.react(emoji).catch(console.error);
            }
            msg.reply("That's Copyrighted by Jenish")
        }
    }
});


cln.login("BOT_TOKEN")

