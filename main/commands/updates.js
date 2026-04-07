const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('updates')
        .setDescription('Shows latest Loopconomy version from website'),

    async execute(interaction) {

        try {
            const res = await fetch(
                "https://jenishpr100.github.io/Loopconomy/main/commands/CommandList.md"
            );

            const text = await res.text();

            // first line
            const firstLine = text.split("\n")[0];

            // extract version
            const match = firstLine.match(/v[\w.-]+/);
            const version = match ? match[0] : "Unknown";

            const embed = new EmbedBuilder()
                .setColor("Blue")

                // top hyperlink
                .setTitle("See all the updates list")
                .setURL("https://github.com/Jenishpr100/Loopconomy/blob/Information/Updates.md")

                // big middle version
                .setDescription(`# Current: ${version}`)

                // bottom requester
                .setFooter({
                    text: `Requested by ${interaction.user.username}`,
                    iconURL: interaction.user.displayAvatarURL()
                })

                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error(error);

            await interaction.reply({
                content: "❌ Failed to fetch updates from website.",
                ephemeral: true
            });
        }
    }
};
