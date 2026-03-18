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

const DAILY_CD = (23 * 60 + 55) * 60 * 1000; // 23h 55m

function calculateReward(balance) {
    let base = 10000;

    if (balance >= 100000) {
        base += Math.floor((balance - 100000) * 0.05);
    }

    // daily gives more
    return Math.floor(base * 1.5);
}

function formatTime(ms) {
    const totalSeconds = Math.ceil(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return `${h}h ${m}m`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Claim your daily reward'),

    async execute(interaction) {
        const data = getData();
        const id = interaction.user.id;

        if (!data[id]) {
            data[id] = { money: 0, lastDaily: 0 };
        }

        const now = Date.now();
        const last = data[id].lastDaily || 0;

        if (now - last < DAILY_CD) {
            const remaining = DAILY_CD - (now - last);
            return interaction.reply({
                content: `⏳ You can claim daily again in **${formatTime(remaining)}**`,
                ephemeral: true
            });
        }

        const reward = calculateReward(data[id].money);

        data[id].money += reward;
        data[id].lastDaily = now;

        saveData(data);

        const embed = new EmbedBuilder()
            .setTitle("🎁 Daily Reward")
            .setDescription(`You claimed your daily and got **$${reward.toLocaleString()}**!`)
            .setColor("Blue")
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: `Balance: $${data[id].money.toLocaleString()}` });

        await interaction.reply({ embeds: [embed] });
    }
};