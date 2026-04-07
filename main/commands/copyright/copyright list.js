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
        .setName('copyrightlist')
        .setDescription('View copyrighted words in this server'),

    async execute(interaction) {
        const guildId = interaction.guildId;
        const data = getData();

        const guildData = data[guildId] || {};
        let entries = Object.entries(guildData);

        if (entries.length === 0) {
            return interaction.reply({
                content: '📭 No copyrighted words in this server.',
                ephemeral: false
            });
        }

        // Sort by highest fine
        entries.sort((a, b) => b[1].fine - a[1].fine);

        const totalWords = entries.length;
        const totalValue = entries.reduce((sum, [, info]) => sum + (info.fine || 0), 0);

        // 🔹 Build wide layout fields (3 per row)
        const fields = [];

        entries.forEach(([word, info], i) => {
            fields.push({
                name: `#${i + 1} • ${word}`,
                value: [
                    `💰 **$${info.fine.toLocaleString()}**`,
                    `👤 <@${info.owner}>`,
                    `\u200B` // spacer
                ].join('\n'),
                inline: true
            });
        });

        // 🔹 Make sure rows stay aligned (multiple of 3)
        while (fields.length % 3 !== 0) {
            fields.push({ name: '\u200B', value: '\u200B', inline: true });
        }

        const embed = new EmbedBuilder()
            .setTitle(`📜 COPYRIGHT REGISTRY`)
            .setDescription(
                `\n` +
                `> **Server:** ${interaction.guild.name}\n` +
                `> **Protected Words:** ${totalWords}\n` +
                `> **Total Value:** 💰 $${totalValue.toLocaleString()}\n\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━`
            )
            .addFields(fields)
            .setColor(0x5865F2)
            .setFooter({
                text: `Requested by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();

        return interaction.reply({
            embeds: [embed],
            ephemeral: false
        });
    }
};
