const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('about')
        .setDescription('Learn more about Loopconomy'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle("📖 About Loopconomy")
            .setDescription("A fake gambling bot for educational purposes.")
            .setColor("#0099ff")
            .addFields(
                { name: '🎮 Games', value: 'Blackjack, Poker, Slots, Roulette, Keno, Bingo, Wheel of Fortune, and more!', inline: false },
                { name: '💰 Economy', value: 'Earn coins daily, beg, work, and gamble!', inline: false },
                { name: '🛡️ AutoMod', value: 'Automatic spam, link, and content moderation.', inline: false },
                { name: '📚 Documentation', value: 'Check `/help` for all commands!', inline: false },
                { name: '🌐 Website', value: 'https://jenishpr100.github.io/Loopconomy/main/MainPage', inline: false }
            )
            .setFooter({ text: 'Loopconomy v1.0.0 Beta 2' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};