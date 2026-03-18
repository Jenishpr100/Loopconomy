const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Top richest players'),

    async execute(interaction) {
        const api = interaction.client.api;
        const top = await api.getTopBalances(10);

        if (top.length === 0) {
            return interaction.reply('No data yet.');
        }

        let description = '';
        for (let i = 0; i < top.length; i++) {
            const { uid, coins } = top[i];
            description += `**${i + 1}.** <@${uid}> — ${coins} coins\n`;
        }

        const embed = new EmbedBuilder()
            .setTitle('🏆 Gambling Leaderboard')
            .setDescription(description)
            .setColor('Gold')
            .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

        await interaction.reply({ embeds: [embed] });
    }
};