const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pay')
        .setDescription('Pay another user some coins')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user you want to pay')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Amount to pay')
                .setRequired(true)),

    async execute(interaction) {
        const pool = interaction.client.pool; // direct DB access
        const senderId = interaction.user.id;
        const targetUser = interaction.options.getUser('target');
        const targetId = targetUser.id;
        const amount = interaction.options.getInteger('amount');

        if (amount <= 0) {
            return interaction.reply({ content: "You can't pay negative or zero coins!", ephemeral: true });
        }

        // Get sender balance
        const senderRes = await pool.query('SELECT coins FROM economy WHERE uid = $1', [senderId]);
        const senderBalance = senderRes.rows[0]?.coins || 0;
        if (senderBalance < amount) {
            return interaction.reply({ content: "You don't have enough coins!", ephemeral: true });
        }

        let tax = 0;
        const taxCollectorId = process.env.TAX_COLLECTOR_ID;
        if (amount > 100 && taxCollectorId) {
            tax = Math.floor(amount * 0.10);
        }
        const finalAmount = amount - tax;

        // Perform transfers
        await pool.query('UPDATE economy SET coins = coins - $1 WHERE uid = $2', [amount, senderId]);
        await pool.query('INSERT INTO economy(uid, coins) VALUES($1, $2) ON CONFLICT(uid) DO UPDATE SET coins = economy.coins + $2', [targetId, finalAmount]);
        if (tax > 0 && taxCollectorId) {
            await pool.query('INSERT INTO economy(uid, coins) VALUES($1, $2) ON CONFLICT(uid) DO UPDATE SET coins = economy.coins + $2', [taxCollectorId, tax]);
        }

        // Get updated sender balance
        const newRes = await pool.query('SELECT coins FROM economy WHERE uid = $1', [senderId]);
        const newBalance = newRes.rows[0]?.coins || 0;

        const embed = new EmbedBuilder()
            .setTitle("💸 Payment Successful")
            .setDescription(`You paid **${finalAmount}** to ${targetUser.tag}${tax > 0 ? ` (10% tax **${tax}** to <@${taxCollectorId}>)` : ''}`)
            .setColor("Random")
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: `Your balance: ${newBalance}` });

        await interaction.reply({ embeds: [embed] });
    }
};