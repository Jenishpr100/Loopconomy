const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('beg')
        .setDescription('Beg for money'),

    async execute(interaction) {
        const api = interaction.client.api;
        const amount = Math.floor(Math.random() * 100) + 1; // 1-100

        await api.addCoins(interaction.user.id, amount);
        const newBalance = await api.getBalance(interaction.user.id);

        const embed = new EmbedBuilder()
            .setTitle('🙏 Begging Result')
            .setDescription(`You begged and got **${amount} LoopCoins**!`)
            .setColor('Random')
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: `Current balance: ${newBalance}` });

        await interaction.reply({ embeds: [embed] });
    }
};