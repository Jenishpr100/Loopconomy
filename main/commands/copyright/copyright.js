const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
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
        .setName('copyright')
        .setDescription('Manage copyrighted words')
        .addStringOption(opt =>
            opt.setName('word')
                .setDescription('Word to manage')
                .setRequired(true))
        .addIntegerOption(opt =>
            opt.setName('fine')
                .setDescription('Fine amount')
                .setRequired(true))
        .addStringOption(opt =>
            opt.setName('action')
                .setDescription('add or remove')
                .setRequired(true)
                .addChoices(
                    { name: 'add', value: 'add' },
                    { name: 'remove', value: 'remove' }
                ))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const word = interaction.options.getString('word').toLowerCase();
        const fine = interaction.options.getInteger('fine');
        const action = interaction.options.getString('action');
        const guildId = interaction.guildId;

        const data = getData();
        if (!data[guildId]) data[guildId] = {};

        // ✅ ADD
        if (action === 'add') {
            data[guildId][word] = {
                fine,
                owner: interaction.user.id
            };

            saveData(data);

            const embed = new EmbedBuilder()
                .setTitle('✅ Word Copyrighted')
                .setDescription(`**"${word}"** has been copyrighted.`)
                .addFields(
                    { name: '💸 Fine', value: `$${fine}`, inline: true },
                    { name: '👤 Owner', value: `<@${interaction.user.id}>`, inline: true }
                )
                .setColor(0x00FF99);

            return interaction.reply({ embeds: [embed] });
        }

        // ✅ REMOVE
        if (action === 'remove') {
            delete data[guildId][word];
            saveData(data);

            const embed = new EmbedBuilder()
                .setTitle('🗑️ Copyright Removed')
                .setDescription(`**"${word}"** is no longer copyrighted.`)
                .setColor(0xFF4D4D);

            return interaction.reply({ embeds: [embed] });
        }
    }
};