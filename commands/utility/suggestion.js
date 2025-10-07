const {SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('suggestion')
    .setDescription('De sua sugestão'),
    async execute(interaction){
        const user = interaction.user;
        await interaction.reply({content:"Dê uma olhadinha na DM!"});
        await user.send("Souh eu deftones da silba! eu asummi o controli!");
    }
}