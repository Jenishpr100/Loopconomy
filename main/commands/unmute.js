const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Unmute a user')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)

        .addUserOption(option =>
            option.setName('target')
                .setDescription('User to unmute')
                .setRequired(true))

        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for unmute')
                .setRequired(false)),

    async execute(interaction) {

        const member = interaction.options.getMember('target');
        const reason = interaction.options.getString('reason') || "No reason provided";

        if (!member) {
            return interaction.reply({
                content: "❌ User not found.",
                ephemeral: true
            });
        }

        if (!member.manageable) {
            return interaction.reply({
                content: "❌ I can't unmute this user.",
                ephemeral: true
            });
        }

        await member.timeout(null, reason);

        const embed = new EmbedBuilder()
            .setColor("Green")
            .setTitle("🔊 User Unmuted")
            .addFields(
                { name: "User", value: `${member.user.tag}`, inline: true },
                { name: "Moderator", value: `${interaction.user.tag}`, inline: true },
                { name: "Reason", value: reason }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
