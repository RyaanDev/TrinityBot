const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../database/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('event-team-status')
        .setDescription('Gerencia as inscrições para times')
        
        .addSubcommand(subcommand =>
            subcommand
                .setName('open')
                .setDescription('Abre as inscrições para times'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('close')
                .setDescription('Fecha as inscrições para times'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Verifica o status das inscrições'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('limpar')
                .setDescription('Limpa todos os times (cuidado!)')),
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'open':
                db.upsert('config', 'inscricoes', { abertas: true });
                await interaction.reply({ content: 'Inscrições ABERTAS! Os usuários agora podem formar times.', ephemeral: true });
                break;

            case 'close':
                db.upsert('config', 'inscricoes', { abertas: false });
                await interaction.reply({ content: 'Inscrições FECHADAS! Os usuários não podem mais formar times.', ephemeral: true });
                break;

            case 'status':
                const status = db.read('config', 'inscricoes');
                const estado = status?.abertas ? 'ABERTAS' : 'FECHADAS';
                const timesCount = db.count('times') || 0;
                await interaction.reply({ 
                    content: `Status das inscrições: ${estado}\nTimes inscritos: ${timesCount}`, 
                    ephemeral: true 
                });
                break;

            case 'limpar':
                // Remover todos os times, cargos e canais de voz
                const times = db.readAll('times');
                
                for (const timeId of Object.keys(times)) {
                    const time = times[timeId];
                    
                    // Tentar excluir o cargo do time
                    if (time.cargoId) {
                        try {
                            const cargo = await interaction.guild.roles.fetch(time.cargoId);
                            if (cargo) {
                                await cargo.delete();
                            }
                        } catch (error) {
                            console.log(`Erro ao excluir cargo ${time.cargoId}:`, error.message);
                        }
                    }
                    
                    // Tentar excluir o canal de voz do time
                    if (time.canalVozId) {
                        try {
                            const canal = await interaction.guild.channels.fetch(time.canalVozId);
                            if (canal) {
                                await canal.delete();
                            }
                        } catch (error) {
                            console.log(`Erro ao excluir canal de voz ${time.canalVozId}:`, error.message);
                        }
                    }
                    
                    // Remover o time do banco de dados
                    db.delete('times', timeId);
                }
                
                await interaction.reply({ 
                    content: 'Todos os times, cargos e canais de voz foram removidos!', 
                    ephemeral: true 
                });
                break;
        }
    }
};