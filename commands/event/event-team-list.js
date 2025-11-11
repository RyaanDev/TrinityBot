const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('event-team-list')
        .setDescription('Lista todos os times inscritos'),
    
    async execute(interaction) {
        const times = db.readAll('times');

        if (!times || Object.keys(times).length === 0) {
            return await interaction.reply({ 
                content: 'Nenhum time inscrito no momento.', 
                ephemeral: true 
            });
        }

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('🏆 Times Inscritos no Torneio')
            .setTimestamp();

        Object.values(times).forEach((time, index) => {
            const membrosList = time.membros.map(m => 
                `• ${m.username}\n  ${m.nomeLoL} - ${m.elo}\n  ${m.horas}h`
            ).join('\n\n');

            embed.addFields({
                name: `${index + 1}. ${time.nomeTime} (${time.totalHoras}h)`,
                value: membrosList,
                inline: false
            });
        });

        await interaction.reply({ embeds: [embed] });
    }
};