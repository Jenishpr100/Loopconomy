const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Check your current balance'),

    async execute(interaction) {
        const api = interaction.client.api;
        const balance = await api.getBalance(interaction.user.id);

        const embed = new EmbedBuilder()
            .setTitle('💰 Your Balance')
            .setDescription(`You currently have **${balance} LoopCoins**.`)
            .setColor('Green')
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: 'Use /beg to earn more!' });

        await interaction.reply({ embeds: [embed] });
    }
};