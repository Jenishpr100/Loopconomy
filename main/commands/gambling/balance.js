const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'data.json');

function getData() {
    if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, '{}');
    return JSON.parse(fs.readFileSync(dataPath));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Check your current balance'),

    async execute(interaction) {
        const data = getData();
        const id = interaction.user.id;

        if (!data[id]) data[id] = { money: 0 };

        const embed = new EmbedBuilder()
            .setTitle("💰 Your Balance")
            .setDescription(`You currently have **$${data[id].money.toLocaleString()}**.`)
            .setColor("Green")
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: `Keep begging to earn more!` });

        await interaction.reply({ embeds: [embed] });
    }
};
