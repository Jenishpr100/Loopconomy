const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

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

// 💰 Parse amount (all, half, %, number)
function parseAmount(input, balance) {
    input = input.toLowerCase();

    if (input === 'all') return balance;
    if (input === 'half') return Math.floor(balance / 2);

    if (input.endsWith('%')) {
        const percent = parseFloat(input.slice(0, -1));
        if (isNaN(percent)) return null;
        return Math.floor(balance * (percent / 100));
    }

    const num = parseInt(input);
    return isNaN(num) ? null : num;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tower')
        .setDescription('Climb the tower for increasing rewards')
        .addStringOption(option =>
            option.setName('amount')
                .setDescription('Amount to bet (number, %, half, all)')
                .setRequired(true)
        ),

    async execute(interaction) {
        const userId = interaction.user.id;
        const username = interaction.member?.displayName || interaction.user.username;

        const data = getData();
        if (!data[userId]) data[userId] = { money: 0 };

        const balance = data[userId].money;
        const input = interaction.options.getString('amount');

        const bet = parseAmount(input, balance);

        if (!bet || bet <= 0) {
            return interaction.reply({ content: "❌ Invalid amount", ephemeral: true });
        }

        if (bet > balance) {
            return interaction.reply({ content: "💀 You don't have that much money", ephemeral: true });
        }

        // 💸 Deduct bet
        data[userId].money -= bet;
        saveData(data);

        let multiplier = 1;
        let currentWin = bet;
        let currentWrong = Math.floor(Math.random() * 5);

        function generateRow() {
            const row = new ActionRowBuilder();

            for (let i = 0; i < 5; i++) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`tower_${i}`)
                        .setLabel('❓')
                        .setStyle(ButtonStyle.Secondary)
                );
            }

            return row;
        }

        const cashOutBtn = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('cashout')
                .setLabel('💰 Cash Out')
                .setStyle(ButtonStyle.Success)
        );

        function createEmbed(color = 0x5865F2, desc = null) {
            return new EmbedBuilder()
                .setColor(color)
                .setAuthor({
                    name: username,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true })
                })
                .setTitle('🗼 Tower')
                .setDescription(
                    desc || `Bet: **$${bet}**\nCurrent: **$${currentWin}**`
                )
                .setFooter({ text: 'Pick a button or cash out!' });
        }

        const message = await interaction.reply({
            embeds: [createEmbed()],
            components: [generateRow(), cashOutBtn],
            fetchReply: true
        });

        const collector = message.createMessageComponentCollector({
            time: 60000
        });

        collector.on('collect', async i => {
            if (i.user.id !== userId) {
                return i.reply({ content: "Not your game bro 💀", ephemeral: true });
            }

            try {
                await i.deferUpdate();

                // 💰 CASH OUT
                if (i.customId === 'cashout') {
                    data[userId].money += currentWin;
                    saveData(data);

                    collector.stop();

                    return message.edit({
                        embeds: [
                            createEmbed(0x00ff99, `💰 Cashed out with **$${currentWin}**`)
                        ],
                        components: []
                    });
                }

                const chosen = parseInt(i.customId.split('_')[1]);

                // ❌ LOSE
                if (chosen === currentWrong) {
                    collector.stop();

                    return message.edit({
                        embeds: [
                            createEmbed(0xff3333, `💀 You hit the wrong tile and lost **$${bet}**`)
                        ],
                        components: []
                    });
                }

                // ✅ WIN STEP
                multiplier += 0.2;
                currentWin = Math.floor(bet * multiplier);

                // generate NEW wrong tile
                currentWrong = Math.floor(Math.random() * 5);

                return message.edit({
                    embeds: [createEmbed(0x00ff99)],
                    components: [generateRow(), cashOutBtn]
                });

            } catch (err) {
                console.error(err);
                if (!i.replied) {
                    i.followUp({ content: "⚠️ Something went wrong", ephemeral: true });
                }
            }
        });

        collector.on('end', () => {
            message.edit({ components: [] }).catch(() => {});
        });
    }
};