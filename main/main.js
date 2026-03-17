const { Client, IntentsBitField } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');


const token = "Token";
const CLIENT_ID = "ID";

const cln = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ]
});


cln.on("clientReady", () => {
    console.log(`✅ Logged in as ${cln.user.tag}`);
});


cln.on("messageCreate", (msg) => {
    if (msg.author.bot) return;

    console.log(`${msg.author.username}: ${msg.content}`);


    if (msg.content.toLowerCase().includes('anyways')) {
        if (msg.author.username === "lyrics_loop") return;

        const emojis = ['❌', '©', '💥', '🔫'];
        for (const emoji of emojis) msg.react(emoji).catch(console.error);
        msg.reply("Hey! That word is copyrighted by Lyrics_loop").catch(console.error);
    }


    if (msg.content.includes('YAYY')) {
        if (msg.author.username === "_cookie.mp3") return;

        const emojis = ['❌', '©', '💥', '🔫'];
        for (const emoji of emojis) msg.react(emoji).catch(console.error);
        msg.reply("Hey! That word is copyrighted by Cookie").catch(console.error);
    }


    if (msg.content.toLowerCase().includes('hello')) {
        msg.react('✅').catch(console.error);
        msg.reply("Hi!").catch(console.error);
    }
});


const commands = [
    new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mute a user for a specified time (10s, 5m, 1h, 1d).')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to mute')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('time')
                .setDescription('Duration (10s, 5m, 1h, 1d)')
                .setRequired(true))
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(token);

cln.on("clientReady", async () => {
    try {
        await rest.put(
            Routes.applicationCommands(CLIENT_ID), 
            { body: commands }
        );
        console.log("✅ Slash commands registered globally!");
    } catch (err) {
        console.error("❌ Error registering global slash commands:", err);
    }
});

function parseTime(str) {
    const match = str.match(/^(\d+)(s|m|h|d)$/i);
    if (!match) return null;

    const num = parseInt(match[1]);
    const unit = match[2].toLowerCase();

    switch(unit) {
        case 's': return num * 1000;
        case 'm': return num * 60 * 1000;
        case 'h': return num * 60 * 60 * 1000;
        case 'd': return num * 24 * 60 * 60 * 1000;
        default: return null;
    }
}


cln.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "mute") {
        const member = interaction.options.getMember('target');
        const timeStr = interaction.options.getString('time');
        const timeMs = parseTime(timeStr);

        if (!timeMs) return interaction.reply({ content: "❌ Invalid time format! Use e.g., 10s, 5m, 1h, 1d.", ephemeral: true });
        if (!member) return interaction.reply({ content: "❌ Could not find that member.", ephemeral: true });
        if (!member.manageable) return interaction.reply({ content: "❌ I cannot mute this user.", ephemeral: true });


        await member.timeout(timeMs, `Muted by ${interaction.user.tag} for ${timeStr}`);
        await interaction.reply({ content: `✅ ${member.user.tag} has been muted for ${timeStr}.`, ephemeral: false });

    }
});

// --- Login ---
cln.login(token);
