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
        .setName('leaderboard')
        .setDescription('Top richest players'),

    async execute(interaction) {
        const data = getData();

        const sorted = Object.entries(data)
            .sort((a, b) => b[1].money - a[1].money)
            .slice(0, 10); // top 10

        if (sorted.length === 0) {
            return interaction.reply("No data yet.");
        }

        // Build leaderboard text
        let description = '';
        for (let i = 0; i < sorted.length; i++) {
            const [id, user] = sorted[i];
            description += `**${i + 1}.** <@${id}> — $${user.money}\n`;
        }

        const embed = new EmbedBuilder()
            .setTitle("🏆 Gambling Leaderboard")
            .setDescription(description)
            .setColor("Gold")
            .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

        await interaction.reply({ embeds: [embed] });
    }
};