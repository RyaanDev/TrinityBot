const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const autoRoleSystem = require('../../Scripts/AutoRoleSystem');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cargo-int')
        .setDescription('Configurar cargo automático para novos membros')
        
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Definir cargo automático')
                .addRoleOption(option =>
                    option
                        .setName('cargo')
                        .setDescription('Cargo a ser dado automaticamente')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('disable')
                .setDescription('Desativar cargo automático')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Ver status atual do cargo automático')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        try {
            switch (subcommand) {
                case 'set': {
                    const role = interaction.options.getRole('cargo');
                    
                    // Verificar se o bot tem permissão para dar o cargo
                    const botMember = interaction.guild.members.me;
                    if (role.position >= botMember.roles.highest.position) {
                        return await interaction.reply({
                            content: 'Eu não posso dar este cargo! Ele está acima ou na mesma posição que meu cargo mais alto.',
                            ephemeral: true
                        });
                    }

                    autoRoleSystem.enableAutoRole(guildId, role.id);
                    
                    await interaction.reply({
                        content: `Cargo automático configurado! Novos membros receberão o cargo **${role.name}** automaticamente.`,
                        ephemeral: false
                    });
                    break;
                }

                case 'disable': {
                    autoRoleSystem.disableAutoRole(guildId);
                    
                    await interaction.reply({
                        content: 'Cargo automático desativado. Novos membros não receberão mais cargo automaticamente.',
                        ephemeral: false
                    });
                    break;
                }

                case 'status': {
                    const config = autoRoleSystem.getAutoRoleConfig(guildId);
                    
                    if (config.enabled && config.roleId) {
                        const role = interaction.guild.roles.cache.get(config.roleId);
                        if (role) {
                            await interaction.reply({
                                content: `**Status do Auto Role:**\n**Ativado**\n**Cargo:** ${role.name}`,
                                ephemeral: false
                            });
                        } else {
                            await interaction.reply({
                                content: 'Cargo automático está configurado, mas o cargo não foi encontrado. Use `/autorole set` para reconfigurar.',
                                ephemeral: false
                            });
                        }
                    } else {
                        await interaction.reply({
                            content: '**Status do Auto Role:**\n**Desativado**\nUse `/autorole set` para ativar.',
                            ephemeral: false
                        });
                    }
                    break;
                }
            }
        } catch (error) {
            console.error('Erro no comando autorole:', error);
            await interaction.reply({
                content: 'Ocorreu um erro ao executar o comando.',
                ephemeral: true
            });
        }
    }
};