const { Client, IntentsBitField, REST, Routes, SlashCommandBuilder } = require('discord.js');

const TOKEN = "BOT_TOKEN"; // Replace with your actual token
const CLIENT_ID = "YOUR_BOT_CLIENT_ID"; // Get this from the Discord Dev Portal

const cln = new Client({
    intents: [
        IntentsBitField.Flags.Guilds, 
        IntentsBitField.Flags.GuildMembers, 
        IntentsBitField.Flags.GuildMessages, 
        IntentsBitField.Flags.MessageContent,
    ]
});

// --- Register Slash Command ---
const commands = [
    new SlashCommandBuilder()
        .setName('pipebomb')
        .setDescription('Send a Nuke to China.')
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

cln.on("ready", async (c) => {
    console.log(`✅ ${c.user.tag} is online!`);
    
    try {
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log("Successfully registered slash commands.");
    } catch (error) {
        console.error("Slash command registration failed:", error);
    }
});

cln.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'pipebomb') {
        if ((interaction.user.username === "jkid88")) {
            const members = await interaction.guild.members.fetch();
            const randomMember = members.filter(m => !m.user.bot).random();
            
            await interaction.reply({
                content: `⚠️ **SYSTEM:** User **${randomMember.user.username}** has been flagged for "Anti-Soviet Behavior" and is being banned for 60 seconds...`,
                ephemeral: true 
            });

            // Add logic here idk
            setTimeout(() => {
                interaction.followUp({ content: "They will be unbanned soon!", ephemeral: true });
            }, 5000);

        } else {
            // THE NORMAL USE (What everyone else sees)
            await interaction.reply("🪄 *Ta-da!* A digital rabbit jumps out of your screen and steals your lunch! 🐇🥪 Then they brutally murder your family and urinate on your head, before defecating in your mouth!");
        }
    }
});

// --- Message Listener (The Anyways Logic) ---
cln.on("messageCreate", (msg) => {
    if (msg.author.bot) return;

    const content = msg.content.toLowerCase();
    
    if (content.includes('anyways')) {
        const isExcludedUser = (msg.author.username === "lyrics_loop" || msg.author.username === "jkid88");
        const containsSecret = content.includes('god is dead');

        if (!isExcludedUser || containsSecret) {
            const emojis = ['❌', '©', '💥', '🔫'];
            Promise.all(emojis.map(e => msg.react(e).catch(() => {})));
            msg.reply("That's Copyrighted by Jenish").catch(console.error);
        } else {
            msg.react('😃').catch(() => {});
            msg.reply('ts so tuff').catch(() => {});
        }
    } 
});

cln.login(TOKEN);
