const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Get help with bot commands')
        .addStringOption(option =>
            option.setName('command')
                .setDescription('Specific command name')
                .setRequired(false)),

    async execute(interaction) {
        const specific = interaction.options.getString('command');

        if (specific) {
            const command = interaction.client.commands.get(specific) || interaction.client.addonCommands.get(specific);
            if (!command) {
                return interaction.reply({ content: `Command \`${specific}\` not found.`, ephemeral: true });
            }
            const embed = new EmbedBuilder()
                .setTitle(`/${command.data.name}`)
                .setDescription(command.data.description || 'No description')
                .setColor('Blue');
            if (command.data.options && command.data.options.length > 0) {
                const optionsText = command.data.options.map(opt =>
                    `• \`${opt.name}\`: ${opt.description} ${opt.required ? '(required)' : '(optional)'}`
                ).join('\n');
                embed.addFields({ name: 'Options', value: optionsText });
            }
            if (command.addonName) {
                embed.setFooter({ text: `Provided by addon: ${command.addonName}` });
            }
            return interaction.reply({ embeds: [embed] });
        }

        const baseCommands = [...interaction.client.commands.keys()].sort();
        const addonCommands = [...interaction.client.addonCommands.keys()].sort();

        const embed = new EmbedBuilder()
            .setTitle('📚 Bot Commands')
            .setColor('Blue')
            .setDescription('Use `/help <command>` for details.\n🌐 Full docs: https://jenishpr100.github.io/Loopconomy/');

        if (baseCommands.length > 0) {
            embed.addFields({
                name: 'Core Commands',
                value: baseCommands.map(c => `\`/${c}\``).join(', '),
                inline: false
            });
        }
        if (addonCommands.length > 0) {
            embed.addFields({
                name: 'Addon Commands',
                value: addonCommands.map(c => `\`/${c}\``).join(', '),
                inline: false
            });
        }
        if (baseCommands.length === 0 && addonCommands.length === 0) {
            embed.setDescription('No commands registered.');
        }

        await interaction.reply({ embeds: [embed] });
    }
};