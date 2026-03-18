const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'data.json');

function getData() {
    if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, '{}');
    return JSON.parse(fs.readFileSync(dataPath));
}

function saveData(data) {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('coinflip')
        .setDescription('Challenge another user to a coinflip')
        .addUserOption(option =>
            option.setName('opponent')
                .setDescription('User to challenge')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Amount to wager')
                .setRequired(true)),

    async execute(interaction) {
        const data = getData();
        const senderId = interaction.user.id;
        const opponent = interaction.options.getUser('opponent');
        const opponentId = opponent.id;
        const wager = interaction.options.getInteger('amount');

        if (opponentId === senderId) 
            return interaction.reply({ content: "You can't challenge yourself!", ephemeral: true });

        if (!data[senderId]) data[senderId] = { money: 0 };
        if (!data[opponentId]) data[opponentId] = { money: 0 };

        if (wager <= 0) 
            return interaction.reply({ content: "You must wager a positive amount!", ephemeral: true });

        if (data[senderId].money < wager) 
            return interaction.reply({ content: "You don't have enough coins!", ephemeral: true });

        if (data[opponentId].money < wager) 
            return interaction.reply({ content: `${opponent.username} doesn't have enough coins!`, ephemeral: true });

        // Create embed and accept button
        const embed = new EmbedBuilder()
            .setTitle("🪙 Coinflip Challenge!")
            .setDescription(`${interaction.user.tag} challenged ${opponent.tag} for **$${wager}**.\n\n${opponent}, click **Accept** to play!`)
            .setColor("Random")
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('accept_coinflip')
                    .setLabel('Accept')
                    .setStyle(ButtonStyle.Success)
            );

        const msg = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

        // Create collector
        const filter = i => i.customId === 'accept_coinflip' && i.user.id === opponentId;
        const collector = msg.createMessageComponentCollector({ filter, max: 1, time: 60000 });

        collector.on('collect', async i => {
            // Coinflip result
            const winner = Math.random() < 0.5 ? senderId : opponentId;
            const loser = winner === senderId ? opponentId : senderId;

            let tax = 0;
            if (wager > 100) {
                tax = Math.floor(wager * 0.10); // 10% tax
                const lyricsLoopId = 'YOUR_USER_ID_HERE'; // replace with Lyrics_loop ID
                if (!data[lyricsLoopId]) data[lyricsLoopId] = { money: 0 };
                data[lyricsLoopId].money += tax;
            }

            const finalAmount = wager - tax;

            data[winner].money += finalAmount;
            data[loser].money -= wager;

            saveData(data);

            const resultEmbed = new EmbedBuilder()
                .setTitle("🪙 Coinflip Result")
                .setDescription(`${interaction.user.tag} challenged ${opponent.tag} for **$${wager}**!\n\n` +
                                `**Winner:** <@${winner}>!\n` +
                                (tax > 0 ? `10% tax **$${tax}** goes to Lyrics_loop\n` : '') +
                                `Amount won: **$${finalAmount}**`)
                .setColor("Random")
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: `New balances: ${interaction.user.username}: $${data[senderId].money}, ${opponent.username}: $${data[opponentId].money}` });

            await i.update({ embeds: [resultEmbed], components: [] });
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.editReply({ content: `⏰ ${opponent.tag} did not accept the challenge in time!`, components: [] });
            }
        });
    }
};