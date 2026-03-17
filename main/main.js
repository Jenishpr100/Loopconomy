const { Client, IntentsBitField } = require('discord.js');

const cln = new Client({
    intents: [
        IntentsBitField.Flags.Guilds, 
        IntentsBitField.Flags.GuildMembers, 
        IntentsBitField.Flags.GuildMessages, 
        IntentsBitField.Flags.MessageContent, // ENSURE THIS IS ON IN DEV PORTAL
    ]
});

// Changed from clientReady to ready
cln.on("ready", (c) => {
    console.log(`✅ ${c.user.tag} is online!`);
});

cln.on("messageCreate", (msg) => {
    if (msg.author.bot) return;

    const content = msg.content.toLowerCase();
    
    // Check if message contains 'anyways'
    if (content.includes('anyways')) {
        const isExcludedUser = (msg.author.username === "lyrics_loop" || msg.author.username === "jkid88");
        const containsSecret = content.includes('god is dead');

        // Logic: Reply if it's NOT an excluded user OR if they said the secret phrase
        if (!isExcludedUser || containsSecret) {
            const emojis = ['❌', '©', '💥', '🔫'];

            // React with all emojis
            Promise.all(emojis.map(e => msg.react(e).catch(() => {})));
            
            // Send the reply
            msg.reply("That's Copyrighted by Jenish").catch(console.error);
        } else {
            msg.react('😃');
            msg.reply('ts so tuff');
        }
    } 
});

// Make sure your token is correct here!
cln.login("BOT_TOKEN");
