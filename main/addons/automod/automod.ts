import { SlashCommandBuilder, EmbedBuilder, TextChannel } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';

const dataPath = path.join(process.cwd(), 'automod.json');

interface AutoModSettings {
    enabled: boolean;
    spam: boolean;
    links: boolean;
    caps: boolean;
    wordlist: string[];
    capsThreshold: number;
    spamThreshold: number;
}

interface GuildSettings {
    [guildId: string]: AutoModSettings;
}

let guildSettings: GuildSettings = {};

const defaultSettings: AutoModSettings = {
    enabled: false,
    spam: true,
    links: false,
    caps: false,
    wordlist: ['spam', 'scam', 'fake'],
    capsThreshold: 0.7,
    spamThreshold: 5
};

function loadSettings() {
    try {
        if (fs.existsSync(dataPath)) {
            guildSettings = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        }
    } catch (e) {
        guildSettings = {};
    }
}

function saveSettings() {
    fs.writeFileSync(dataPath, JSON.stringify(guildSettings, null, 2));
}

function getSettings(guildId: string): AutoModSettings {
    if (!guildSettings[guildId]) {
        guildSettings[guildId] = { ...defaultSettings };
    }
    return guildSettings[guildId];
}

function checkSpam(message: any): boolean {
    const settings = getSettings(message.guildId);
    if (!settings.spam) return false;
    
    const content = message.content.toLowerCase();
    const spamPatterns = [
        /(.)\1{5,}/i,
        /[a-z]{10,}/i,
        /\b(free|money|win|prize|click|hurry)\b.{0,20}\b(free|money|win|prize|click|hurry)\b/i
    ];
    
    for (const pattern of spamPatterns) {
        if (pattern.test(content)) return true;
    }
    return false;
}

function checkLinks(message: any): boolean {
    const settings = getSettings(message.guildId);
    if (!settings.links) return false;
    
    const urlPattern = /https?:\/\/[^\s]+/gi;
    return urlPattern.test(message.content);
}

function checkCaps(message: any): boolean {
    const settings = getSettings(message.guildId);
    if (!settings.caps) return false;
    
    const content = message.content.replace(/[^a-zA-Z]/g, '');
    if (content.length < 10) return false;
    
    const uppercase = content.replace(/[^A-Z]/g, '').length;
    const ratio = uppercase / content.length;
    
    return ratio >= settings.capsThreshold;
}

function checkWordlist(message: any): string | null {
    const settings = getSettings(message.guildId);
    const content = message.content.toLowerCase();
    
    for (const word of settings.wordlist) {
        if (content.includes(word.toLowerCase())) {
            return word;
        }
    }
    return null;
}

export const commands = [
    {
        data: new SlashCommandBuilder()
            .setName('automod')
            .setDescription('Configure AutoMod')
            .addSubcommand(sub =>
                sub.setName('status')
                    .setDescription('Check AutoMod status')
            )
            .addSubcommand(sub =>
                sub.setName('enable')
                    .setDescription('Enable AutoMod')
            )
            .addSubcommand(sub =>
                sub.setName('disable')
                    .setDescription('Disable AutoMod')
            )
            .addSubcommand(sub =>
                sub.setName('spam')
                    .setDescription('Toggle spam filter')
                    .addStringOption(opt =>
                        opt.setName('action')
                            .setDescription('Enable or disable')
                            .setRequired(true)
                            .addChoices(
                                { name: 'Enable', value: 'enable' },
                                { name: 'Disable', value: 'disable' }
                            )
                    )
            )
            .addSubcommand(sub =>
                sub.setName('links')
                    .setDescription('Toggle link filter')
                    .addStringOption(opt =>
                        opt.setName('action')
                            .setDescription('Enable or disable')
                            .setRequired(true)
                            .addChoices(
                                { name: 'Enable', value: 'enable' },
                                { name: 'Disable', value: 'disable' }
                            )
                    )
            )
            .addSubcommand(sub =>
                sub.setName('caps')
                    .setDescription('Toggle caps filter')
                    .addStringOption(opt =>
                        opt.setName('action')
                            .setDescription('Enable or disable')
                            .setRequired(true)
                            .addChoices(
                                { name: 'Enable', value: 'enable' },
                                { name: 'Disable', value: 'disable' }
                            )
                    )
            )
            .addSubcommand(sub =>
                sub.setName('wordlist')
                    .setDescription('Manage word filter')
                    .addStringOption(opt =>
                        opt.setName('action')
                            .setDescription('Add or remove')
                            .setRequired(true)
                            .addChoices(
                                { name: 'Add word', value: 'add' },
                                { name: 'Remove word', value: 'remove' },
                                { name: 'List words', value: 'list' }
                            )
                    )
                    .addStringOption(opt =>
                        opt.setName('word')
                            .setDescription('Word to add/remove')
                            .setRequired(false)
                    )
            ),
        async execute(interaction: any, api: any) {
            const subcommand = interaction.options.getSubcommand();
            const settings = getSettings(interaction.guildId);

            if (subcommand === 'status') {
                const embed = new EmbedBuilder()
                    .setTitle('🛡️ AutoMod Status')
                    .setColor(settings.enabled ? '#00FF00' : '#FF0000')
                    .addFields(
                        { name: '📡 Overall', value: settings.enabled ? '🟢 Enabled' : '🔴 Disabled', inline: true },
                        { name: '🚨 Spam Filter', value: settings.spam ? '🟢 On' : '🔴 Off', inline: true },
                        { name: '🔗 Link Filter', value: settings.links ? '🟢 On' : '🔴 Off', inline: true },
                        { name: '⬆️ Caps Filter', value: settings.caps ? '🟢 On' : '🔴 Off', inline: true },
                        { name: '📝 Wordlist', value: `${settings.wordlist.length} words`, inline: true }
                    )
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });
            }

            if (subcommand === 'enable') {
                settings.enabled = true;
                saveSettings();

                await interaction.reply({ content: '🛡️ AutoMod has been **enabled**.', ephemeral: true });
            }

            if (subcommand === 'disable') {
                settings.enabled = false;
                saveSettings();

                await interaction.reply({ content: '🛡️ AutoMod has been **disabled**.', ephemeral: true });
            }

            if (subcommand === 'spam') {
                const action = interaction.options.getString('action');
                settings.spam = action === 'enable';
                saveSettings();

                await interaction.reply({ 
                    content: `🚨 Spam filter has been **${action === 'enable' ? 'enabled' : 'disabled'}**.`,
                    ephemeral: true 
                });
            }

            if (subcommand === 'links') {
                const action = interaction.options.getString('action');
                settings.links = action === 'enable';
                saveSettings();

                await interaction.reply({ 
                    content: `🔗 Link filter has been **${action === 'enable' ? 'enabled' : 'disabled'}**.`,
                    ephemeral: true 
                });
            }

            if (subcommand === 'caps') {
                const action = interaction.options.getString('action');
                settings.caps = action === 'enable';
                saveSettings();

                await interaction.reply({ 
                    content: `⬆️ Caps filter has been **${action === 'enable' ? 'enabled' : 'disabled'}**.`,
                    ephemeral: true 
                });
            }

            if (subcommand === 'wordlist') {
                const action = interaction.options.getString('action');
                const word = interaction.options.getString('word')?.toLowerCase();

                if (action === 'list') {
                    const embed = new EmbedBuilder()
                        .setTitle('📝 AutoMod Wordlist')
                        .setColor('#0099ff')
                        .setDescription(settings.wordlist.length > 0 ? settings.wordlist.join(', ') : 'No words in list')
                        .setTimestamp();

                    await interaction.reply({ embeds: [embed] });
                }

                if (action === 'add') {
                    if (!word) {
                        return interaction.reply({ content: 'Please provide a word to add.', ephemeral: true });
                    }

                    if (settings.wordlist.includes(word)) {
                        return interaction.reply({ content: 'Word already in list.', ephemeral: true });
                    }

                    settings.wordlist.push(word);
                    saveSettings();

                    await interaction.reply({ content: `📝 Added **${word}** to wordlist.`, ephemeral: true });
                }

                if (action === 'remove') {
                    if (!word) {
                        return interaction.reply({ content: 'Please provide a word to remove.', ephemeral: true });
                    }

                    const index = settings.wordlist.indexOf(word);
                    if (index < 0) {
                        return interaction.reply({ content: 'Word not in list.', ephemeral: true });
                    }

                    settings.wordlist.splice(index, 1);
                    saveSettings();

                    await interaction.reply({ content: `📝 Removed **${word}** from wordlist.`, ephemeral: true });
                }
            }
        }
    }
];

export const init = async (api: any) => {
    loadSettings();
    
    api.listen('messageCreate', async (message: any) => {
        if (message.author.bot) return;
        if (!message.guildId) return;
        
        const settings = getSettings(message.guildId);
        if (!settings.enabled) return;

        let shouldDelete = false;
        let reason = '';

        if (checkSpam(message)) {
            shouldDelete = true;
            reason = 'Spam detected';
        }

        if (checkLinks(message)) {
            shouldDelete = true;
            reason = 'Links not allowed';
        }

        if (checkCaps(message)) {
            shouldDelete = true;
            reason = 'Too many caps';
        }

        const badWord = checkWordlist(message);
        if (badWord) {
            shouldDelete = true;
            reason = `Forbidden word: ${badWord}`;
        }

        if (shouldDelete) {
            try {
                await message.delete();
                
                const logChannel = message.guild.channels.cache.find((c: any) => c.name === 'mod-logs' || c.name === 'logs');
                if (logChannel) {
                    const embed = new EmbedBuilder()
                        .setTitle('🛡️ AutoMod Action')
                        .setColor('#FF0000')
                        .addFields(
                            { name: 'User', value: `<@${message.author.id}>`, inline: true },
                            { name: 'Channel', value: `<#${message.channelId}>`, inline: true },
                            { name: 'Reason', value: reason, inline: true },
                            { name: 'Message', value: message.content.substring(0, 100), inline: false }
                        )
                        .setTimestamp();

                    await (logChannel as TextChannel).send({ embeds: [embed] });
                }
            } catch (e) {
                api.log(`AutoMod failed to delete message: ${e}`);
            }
        }
    });

    api.log("AutoMod Module Loaded.");
};
