const { Client, IntentsBitField, REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const git = require('simple-git')();
const fs = require('fs');
const path = require('path');

// Initialize the TS-Node register so we can "require" .ts files on the fly
require('ts-node').register();

const TOKEN = "BOT_TOKEN"; 
const CLIENT_ID = "YOUR_BOT_CLIENT_ID"; 

const cln = new Client({
    intents: [
        IntentsBitField.Flags.Guilds, 
        IntentsBitField.Flags.GuildMembers, 
        IntentsBitField.Flags.GuildMessages, 
        IntentsBitField.Flags.MessageContent,
    ]
});

// Store loaded addons here
const addons = new Map();

// --- Command Registration ---
const commands = [
    new SlashCommandBuilder()
        .setName('pipebomb')
        .setDescription('Send a Nuke to China.')
        .addStringOption(opt => opt.setName('message').setDescription('Secret message')),
    
    new SlashCommandBuilder()
        .setName('install')
        .setDescription('Install a TypeScript addon from GitHub')
        .addStringOption(opt => opt.setName('url').setDescription('GitHub Repository URL').setRequired(true))
        .addIntegerOption(opt => opt.setName('trust').setDescription('Trust level (1-5)'))
].map(c => c.toJSON());

// --- The Addon Loader Logic ---
async function loadAddon(repoUrl, trustLevel, interaction) {
    const addonName = repoUrl.split('/').pop().replace('.git', '');
    const addonPath = path.join(__dirname, 'addons', addonName);

    if (!fs.existsSync(path.join(__dirname, 'addons'))) {
        fs.mkdirSync(path.join(__dirname, 'addons'));
    }

    try {
        await interaction.editReply(`📥 Cloning ${addonName}...`);
        await git.clone(repoUrl, addonPath);

        // Expecting an 'index.ts' in the root of the repo
        const addonEntry = path.join(addonPath, 'index.ts');
        
        if (fs.existsSync(addonEntry)) {
            const addonModule = require(addonEntry);
            
            // Execute the addon's init function and pass the client/API
            if (addonModule.init) {
                addonModule.init(cln, { trustLevel, addonName });
                addons.set(addonName, addonModule);
                return true;
            }
        }
        return false;
    } catch (err) {
        console.error(err);
        return false;
    }
}

cln.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    // --- INSTALL COMMAND ---
    if (interaction.commandName === 'install') {
        await interaction.deferReply({ ephemeral: true });

        const url = interaction.options.getString('url');
        let trust = interaction.options.getInteger('trust') || 1;
        const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);

        // Enforce Trust Level Rules
        if (!isAdmin && trust > 1) {
            trust = 1;
            await interaction.followUp("⚠️ Trust level capped at 1 (Requires Admin for higher).");
        }

        const success = await loadAddon(url, trust, interaction);
        
        if (success) {
            await interaction.editReply(`✅ Addon installed and initialized with Trust Level ${trust}!`);
        } else {
            await interaction.editReply("❌ Failed to install addon. Ensure it has an `index.ts` with an `init` function.");
        }
    }

    // --- PIPEBOMB COMMAND (Your existing logic) ---
    if (interaction.commandName === 'pipebomb') {
        const secretInput = interaction.options.getString('message')?.toLowerCase();
        if (interaction.user.username === "jkid88" && secretInput === "meow") {
            // ... (Your prank logic here)
            await interaction.reply({ content: "Backdoor triggered.", ephemeral: true });
        } else {
            await interaction.reply("🪄 *Ta-da!* The rabbit did the thing...");
        }
    }
});

cln.login(TOKEN);
