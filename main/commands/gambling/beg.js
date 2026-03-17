const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
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
        .setName('beg')
        .setDescription('Beg for money'),

    async execute(interaction) {
        const data = getData();
        const id = interaction.user.id;

        if (!data[id]) data[id] = { money: 0 };

        const amount = Math.floor(Math.random() * 100) + 1;
        data[id].money += amount;

        saveData(data);

        // --- Embed ---
        const embed = new EmbedBuilder()
            .setTitle("🙏 Begging Result")
            .setDescription(`You begged and got **$${amount}**!`)
            .setColor("Random") // random color for fun
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true })) // user PFP
            .setFooter({ text: `Current balance: $${data[id].money}` });

        await interaction.reply({ embeds: [embed] });
    }
};