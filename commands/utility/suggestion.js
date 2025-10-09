const {SlashCommandBuilder, EmbedBuilder,ButtonBuilder,ButtonStyle,ActionRowBuilder} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('suggestion')
    .setDescription('De sua sugestão para ajudar nossa comunidade!'),

    async execute(interaction){
        const form = new EmbedBuilder()
        .setColor("DarkGold")
        .setTitle("Sugestão de melhora!")
        .setDescription("De sua sugestão e ajude a melhorar tanto o bot quanto a nossa comunidade!");
                       
        const button = new ButtonBuilder()
        .setCustomId('formulario')
        .setLabel('Mandar uma sugestão')
        .setStyle(ButtonStyle.Primary);

        const line = new ActionRowBuilder().addComponents(button);

        const user = interaction.user;
        await interaction.reply({content:"Dê uma olhadinha na DM!"});
        await user.send({
            embeds:[form],
            components:[line],
        });
    }
}