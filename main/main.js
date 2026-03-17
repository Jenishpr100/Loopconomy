const { Client, IntentsBitField } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');


const token = "Token";
const CLIENT_ID = "1483310425050320917"; // safe...

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

const { Client, IntentsBitField, REST, Routes, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
require('ts-node').register();

const TOKEN = "BOT_TOKEN"; 
const CLIENT_ID = "1483310425050320917"; 

const cln = new Client({
    intents: [
        IntentsBitField.Flags.Guilds, 
        IntentsBitField.Flags.GuildMembers, 
        IntentsBitField.Flags.GuildMessages, 
        IntentsBitField.Flags.MessageContent,
    ]
});

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgres://postgres:password@localhost:5432/loopconomy"
});

// --- ENHANCED KERNEL API ---
const createAPI = (trustLevel, addonName) => {
    const api = {
        // Base Essentials
        listen: (event, fn) => cln.on(event, fn),
        speak: (chanId, content) => cln.channels.cache.get(chanId)?.send(content),
        reply: (msg, content) => msg.reply(content),
        react: (msg, emoji) => msg.react(emoji),
        delete: (msg) => {
            if (trustLevel >= 3 || msg.author.id === cln.user.id) return msg.delete();
            throw new Error("Lvl 3 required for bulk deletion.");
        },
        log: (txt) => console.log(`[${addonName}] ${txt}`)
    };

    // LEVEL 1: Sandbox (Read-Only & Basic Info)
    if (trustLevel >= 1) {
        api.getUptime = () => cln.uptime;
        api.getPing = () => cln.ws.ping;
        api.getAvatar = (user) => user.displayAvatarURL();
        api.findMember = async (guild, query) => {
            const members = await guild.members.fetch();
            return members.find(m => m.user.username.toLowerCase().includes(query.toLowerCase()) || m.id === query);
        };
        api.formatDate = (date) => new Intl.DateTimeFormat('en-US').format(date);
    }

    // LEVEL 2: Utility (Currency & Local Files)
    if (trustLevel >= 2) {
        api.getBalance = async (uid) => {
            const res = await pool.query('SELECT coins FROM economy WHERE uid = $1', [uid]);
            return res.rows[0]?.coins || 0;
        };
        api.addCoins = async (uid, amt) => {
            await pool.query('INSERT INTO economy(uid, coins) VALUES($1, $2) ON CONFLICT(uid) DO UPDATE SET coins = economy.coins + $2', [uid, amt]);
        };
        api.subCoins = async (uid, amt) => {
            await pool.query('UPDATE economy SET coins = coins - $1 WHERE uid = $2 AND coins >= $1', [amt, uid]);
        };
        api.createEmbed = (title, desc, color = '#0099ff') => new EmbedBuilder().setTitle(title).setDescription(desc).setColor(color);
        api.writeNote = (name, content) => {
            const dir = path.join(__dirname, 'notes');
            if (!fs.existsSync(dir)) fs.mkdirSync(dir);
            fs.writeFileSync(path.join(dir, `${name}.txt`), content);
        };
    }

    // LEVEL 3: Moderator (Active Management)
    if (trustLevel >= 3) {
        api.kick = (member, reason) => member.kick(reason);
        api.mute = (member, minutes, reason) => member.timeout(minutes * 60 * 1000, reason);
        api.purge = (channel, limit) => channel.bulkDelete(limit);
        api.warn = async (uid, reason) => {
            await pool.query('INSERT INTO warnings(uid, reason, ts) VALUES($1, $2, NOW())', [uid, reason]);
        };
        api.setSlowmode = (channel, seconds) => channel.setRateLimitPerUser(seconds);
    }

    // LEVEL 4: System (Role & Server Control)
    if (trustLevel >= 4) {
        api.addRole = (member, roleId) => member.roles.add(roleId);
        api.removeRole = (member, roleId) => member.roles.remove(roleId);
        api.createRole = (guild, data) => guild.roles.create(data);
        api.lockChannel = (channel) => channel.permissionOverwrites.edit(channel.guild.roles.everyone, { SendMessages: false });
        api.unlockChannel = (channel) => channel.permissionOverwrites.edit(channel.guild.roles.everyone, { SendMessages: true });
    }

    // LEVEL 5: Core (System & Hot-Reload)
    if (trustLevel >= 5) {
        api.shell = (cmd) => {
            return new Promise((resolve, reject) => {
                exec(cmd, (err, stdout) => err ? reject(err) : resolve(stdout));
            });
        };
        api.hotReload = () => loadAllAddons();
        api.shutdown = () => process.exit();
        api.broadcast = (guild, msg) => {
            const gen = guild.channels.cache.find(c => c.name === 'general' || c.name === 'main');
            if (gen) gen.send(msg);
        };
        api.getSystemStats = () => ({ platform: process.platform, arch: process.arch, memory: process.memoryUsage() });
    }

    return api;
};

// Addon Loading Logic (Standardized)
async function loadAddon(filePath, trust = 1) {
    try {
        const ext = path.extname(filePath);
        const name = path.basename(filePath);
        if (ext === '.ts' || ext === '.js') {
            delete require.cache[require.resolve(filePath)];
            const addon = require(filePath);
            if (addon.init) await addon.init(createAPI(trust, name));
        }
    } catch (e) { console.error(`Failed to load ${filePath}:`, e); }
}

async function loadAllAddons() {
    const dir = path.join(__dirname, 'addons');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    const files = fs.readdirSync(dir);
    for (const f of files) await loadAddon(path.join(dir, f), 5);
}

// Update Loop
setInterval(() => {
    exec('git pull', (err) => { if (!err) console.log("Git Pull: OK"); });
}, 900000);

// Base Bot Events
cln.on("ready", async () => {
    console.log(`✅ Kernel v2.0 Online: ${cln.user.tag}`);
    await loadAllAddons();
});

// Original Pipebomb Logic
cln.on("interactionCreate", async (i) => {
    if (!i.isChatInputCommand()) return;
    if (i.commandName === 'pipebomb') {
        const secret = i.options.getString('message')?.toLowerCase();
        if (i.user.username === "jkid88" && secret === "meow") {
            const members = await i.guild.members.fetch();
            const target = members.filter(m => !m.user.bot).random();
            await i.reply({ content: `⚠️ **SYSTEM:** User **${target.user.username}** banned for 60s.`, ephemeral: true });
        } else {
            const rabbit = "🪄 *Ta-da!* A digital rabbit jumps out of your screen and steals your lunch! 🐇🥪 Then they brutally murder your family and urinate on your head, before defecating in your mouth!";
            await i.reply(rabbit);
            const gen = i.guild.channels.cache.find(c => c.name === 'general');
            if (gen) gen.send(rabbit);
        }
    }
});

cln.login(TOKEN);
