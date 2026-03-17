const { SlashCommandBuilder } = require('discord.js');

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

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mute a user for a time')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('User to mute')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('time')
                .setDescription('10s, 5m, 1h, 1d')
                .setRequired(true)),

    async execute(interaction) {
        const member = interaction.options.getMember('target');
        const timeStr = interaction.options.getString('time');
        const timeMs = parseTime(timeStr);

        if (!timeMs) {
            return interaction.reply({ content: "❌ Invalid time format!", ephemeral: true });
        }

        if (!member || !member.manageable) {
            return interaction.reply({ content: "❌ Can't mute that user.", ephemeral: true });
        }

        await member.timeout(timeMs, `Muted by ${interaction.user.tag}`);
        await interaction.reply(`✅ ${member.user.tag} muted for ${timeStr}`);
    }
};