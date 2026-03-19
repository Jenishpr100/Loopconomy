const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'data.json');
const cooldownPath = path.join(__dirname, 'robbankCooldowns.json');

function getData() {
    if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, '{}');
    return JSON.parse(fs.readFileSync(dataPath));
}

function saveData(data) {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

function getCooldowns() {
    if (!fs.existsSync(cooldownPath)) fs.writeFileSync(cooldownPath, '{}');
    return JSON.parse(fs.readFileSync(cooldownPath));
}

function saveCooldowns(data) {
    fs.writeFileSync(cooldownPath, JSON.stringify(data, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('robbank')
        .setDescription('Risk it all and rob the bank'),

    async execute(interaction) {
        const userId = interaction.user.id;
        const username = interaction.member?.displayName || interaction.user.username;

        const data = getData();
        const cooldowns = getCooldowns();

        // ✅ Ensure user exists with "money"
        if (!data[userId]) data[userId] = { money: 0 };

        const now = Date.now();
        const cooldownTime = 60 * 60 * 1000; // 1 hour

        // ⏳ Cooldown check
        if (cooldowns[userId] && now - cooldowns[userId] < cooldownTime) {
            const remaining = cooldownTime - (now - cooldowns[userId]);
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);

            return interaction.reply({
                content: `⏳ Try again in ${minutes}m ${seconds}s`,
                ephemeral: true
            });
        }

        const money = data[userId].money;

        // 💀 Broke check
        if (money <= 0) {
            return interaction.reply({
                content: "💀 You got no money to risk.",
                ephemeral: true
            });
        }

        const amount = Math.floor(money * 0.10);
        const chance = Math.random();

        let resultText;
        let color;

        if (chance < 0.8) {
            // ✅ WIN (80%)
            data[userId].money += amount;
            resultText = `💰 You successfully robbed the bank and got **$${amount}**!`;
            color = 0x00ff99;
        } else {
            // ❌ LOSE (20%)
            data[userId].money -= amount;
            resultText = `🚨 You got caught and lost **$${amount}**...`;
            color = 0xff3333;
        }

        cooldowns[userId] = now;

        saveData(data);
        saveCooldowns(cooldowns);

        const embed = new EmbedBuilder()
            .setColor(color)
            .setAuthor({
                name: username,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true })
            })
            .setTitle('🏦 Bank Robbery')
            .setDescription(resultText)
            .addFields({
                name: '💵 New Money',
                value: `$${data[userId].money}`,
                inline: true
            })
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};