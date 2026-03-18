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

const WORK_CD = (11 * 60 + 58) * 60 * 1000; // 11h 58m

function calculateReward(balance) {
    let base = 10000;

    if (balance >= 100000) {
        base += Math.floor((balance - 100000) * 0.05);
    }

    return base;
}

function formatTime(ms) {
    const totalSeconds = Math.ceil(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return `${h}h ${m}m`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('work')
        .setDescription('Work to earn coins'),

    async execute(interaction) {
        const data = getData();
        const id = interaction.user.id;

        if (!data[id]) {
            data[id] = { money: 0, lastWork: 0 };
        }

        const now = Date.now();
        const last = data[id].lastWork || 0;

        if (now - last < WORK_CD) {
            const remaining = WORK_CD - (now - last);
            return interaction.reply({
                content: `⏳ You can work again in **${formatTime(remaining)}**`,
                ephemeral: true
            });
        }

        const reward = calculateReward(data[id].money);

        data[id].money += reward;
        data[id].lastWork = now;

        saveData(data);

        const embed = new EmbedBuilder()
            .setTitle("💼 Work Complete")
            .setDescription(`You worked and earned **$${reward.toLocaleString()}**!`)
            .setColor("Green")
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: `Balance: $${data[id].money.toLocaleString()}` });

        await interaction.reply({ embeds: [embed] });
    }
};