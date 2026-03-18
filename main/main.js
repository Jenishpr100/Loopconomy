const path = require('path');
const fs = require('fs');
const { Client, IntentsBitField, Collection } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');


const token = "Token";
const CLIENT_ID = "1483310425050320917";


const cln = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ]
});

cln.commands = new Collection();


function getFiles(dir) {
    let files = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);

        if (fs.statSync(fullPath).isDirectory()) {
            files = files.concat(getFiles(fullPath)); 
        } else if (item.endsWith('.js')) {
            files.push(fullPath);
        }
    }

    return files;
}


const commandFiles = getFiles(path.join(__dirname, 'commands'));
const slashCommands = [];

for (const file of commandFiles) {
    const cmd = require(file);


    if (cmd.data) {
        cln.commands.set(cmd.data.name, cmd);
        slashCommands.push(cmd.data.toJSON());
    }


    if (cmd.onMessage) {
        cln.on("messageCreate", (msg) => cmd.onMessage(msg));
    }
}


cln.once("ready", async () => { 
    console.log(`✅ Logged in as ${cln.user.tag}`);

    try {
        const rest = new REST({ version: '10' }).setToken(token);

        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: slashCommands }
        );

        console.log("✅ Slash commands registered!");
    } catch (err) {
        console.error("❌ Failed to register slash commands:", err);
    }
});


cln.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = cln.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (err) {
        console.error(err);
        interaction.reply({ content: "❌ Error executing command.", ephemeral: true });
    }
});

// --- LOGIN --- //
cln.login(token);
