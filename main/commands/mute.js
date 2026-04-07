const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

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
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)

        .addUserOption(option =>
            option.setName('target')
                .setDescription('User to mute')
                .setRequired(true))

        .addStringOption(option =>
            option.setName('time')
                .setDescription('10s, 5m, 1h, 1d')
                .setRequired(true))

        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for mute')
                .setRequired(false)),

    async execute(interaction) {

        const member = interaction.options.getMember('target');
        const timeStr = interaction.options.getString('time');
        const reason = interaction.options.getString('reason') || "No reason provided";
        const timeMs = parseTime(timeStr);

        if (!timeMs) {
            return interaction.reply({
                content: "❌ Invalid time format! Use 10s, 5m, 1h, 1d",
                ephemeral: true
            });
        }

        if (!member) {
            return interaction.reply({
                content: "❌ User not found.",
                ephemeral: true
            });
        }

        if (!member.manageable) {
            return interaction.reply({
                content: "❌ I can't mute this user.",
                ephemeral: true
            });
        }

        await member.timeout(timeMs, reason);

        const embed = new EmbedBuilder()
            .setColor("Red")
            .setTitle("🔇 User Muted")
            .addFields(
                { name: "User", value: `${member.user.tag}`, inline: true },
                { name: "Moderator", value: `${interaction.user.tag}`, inline: true },
                { name: "Time", value: timeStr, inline: true },
                { name: "Reason", value: reason }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
