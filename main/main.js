const { Client, IntentsBitField } = require('discord.js');

const cln = new Client({
    intents: [
        IntentsBitField.Flags.Guilds, 
        IntentsBitField.Flags.GuildMembers, 
        IntentsBitField.Flags.GuildMessages, 
        IntentsBitField.Flags.MessageContent, 
    ]
});

// FIXED: Event name is 'ready'
cln.on("ready", (c) => {
    console.log(`✅ Logged in as ${c.user.tag}`);
});

cln.on("messageCreate", (msg) => {
    if (msg.author.bot) return;

    const content = msg.content.toLowerCase();

    if (content.includes('anyways')) {
        const isExcludedUser = msg.author.username === "lyrics_loop" || msg.author.username === "jkid88";
        const containsSpecificPhrase = content.includes('god is dead');

        if (!isExcludedUser || containsSpecificPhrase) {
            const emojis = ['❌', '©', '💥', '🔫'];

            for (const emoji of emojis) {
                msg.react(emoji).catch(err => console.error(`Failed to react: ${err}`));
            }
            msg.reply("That's Copyrighted by Jenish");
        }
    }
});

cln.login("BOT_TOKEN");
