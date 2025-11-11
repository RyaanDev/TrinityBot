const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const welcomeSystem = require('../../Scripts/WelcomeSystem');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welcome-config')
        .setDescription('Configura o sistema de boas-vindas')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Define o canal de boas-vindas')
                .addChannelOption(option =>
                    option
                        .setName('canal')
                        .setDescription('Canal para enviar mensagens de boas-vindas')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText)
                )
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName('disable')
                .setDescription('Desativa o sistema de boas-vindas')
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Verifica o status do sistema')
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName('set-background')
                .setDescription('Define uma imagem de fundo personalizada')
                .addStringOption(option =>
                    option
                        .setName('arquivo')
                        .setDescription('Nome do arquivo da pasta imgs (ex: background.jpg)')
                        .setRequired(true)
                )
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName('remove-background')
                .setDescription('Remove o background personalizado')
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName('random-background')
                .setDescription('Ativa ou desativa o sorteio aleatório de background')
                .addStringOption(option =>
                    option
                        .setName('modo')
                        .setDescription('Ativar ou desativar o sorteio aleatório')
                        .setRequired(true)
                        .addChoices(
                            { name: 'ativar', value: 'on' },
                            { name: 'desativar', value: 'off' }
                        )
                )
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName('preview')
                .setDescription('Mostra uma prévia do cartão de boas-vindas atual')
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('Reseta todas as configurações de boas-vindas')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        try {
            switch (subcommand) {
                case 'set': {
                    const channel = interaction.options.getChannel('canal');
                    welcomeSystem.setWelcomeChannel(channel.id);
                    await interaction.reply({
                        content: `Sistema de boas-vindas ativado! Mensagens serão enviadas em ${channel}`,
                        flags: 64
                    });
                    break;
                }

                case 'disable': {
                    welcomeSystem.disableWelcome();
                    await interaction.reply({
                        content: 'Sistema de boas-vindas desativado.',
                        flags: 64
                    });
                    break;
                }

                case 'status': {
                    const status = welcomeSystem.getStatus(guildId);
                    let statusText = status.isEnabled 
                        ? `**Ativo**\n• Canal: <#${status.welcomeChannelId}>`
                        : '**Inativo**';
                    
                    if (status.hasCustomBackground) {
                        const path = require('path');
                        const bgName = path.basename(status.customBackground);
                        statusText += `\n• Background personalizado: ${bgName}`;
                    }

                    statusText += `\n• Background aleatório: ${status.useRandomBackground ? 'Ativado' : 'Desativado'}`;

                    const availableBackgrounds = welcomeSystem.getAvailableBackgrounds();
                    if (availableBackgrounds && availableBackgrounds.length > 0) {
                        statusText += `\n• Imagens disponíveis: ${availableBackgrounds.join(', ')}`;
                    } else {
                        statusText += `\n• Pasta imgs/: (nenhum arquivo encontrado)`;
                    }

                    await interaction.reply({
                        content: `**Status do sistema de boas-vindas:**\n${statusText}`,
                        flags: 64
                    });
                    break;
                }

                case 'set-background': {
                    const arquivo = interaction.options.getString('arquivo');
                    const success = welcomeSystem.setWelcomeBackground(guildId, arquivo);

                    if (success) {
                        await interaction.reply({
                            content: `Background definido com sucesso: ${arquivo}`,
                            flags: 64
                        });
                    } else {
                        const available = welcomeSystem.getAvailableBackgrounds();
                        await interaction.reply({
                            content: `Arquivo "${arquivo}" não encontrado na pasta imgs.\n\n📁 **Arquivos disponíveis:** ${available.length > 0 ? available.join(', ') : 'Nenhum arquivo encontrado'}`,
                            flags: 64
                        });
                    }
                    break;
                }

                case 'remove-background': {
                    welcomeSystem.removeWelcomeBackground(guildId);
                    await interaction.reply({
                        content: 'Background personalizado removido.',
                        flags: 64
                    });
                    break;
                }

                case 'random-background': {
                    const modo = interaction.options.getString('modo');
                    const ativar = modo === 'on';
                    welcomeSystem.setRandomBackground(ativar);
                    await interaction.reply({
                        content: `Modo background aleatório ${ativar ? 'ativado' : 'desativado'}.`,
                        flags: 64
                    });
                    break;
                }

                case 'preview': {
                    await interaction.deferReply({ ephemeral: true });
                    const member = interaction.member;
                    const guildId = interaction.guild.id;

                    const customBackground = welcomeSystem.backgrounds.get(guildId) || null;
                    const useRandomBackground = welcomeSystem.useRandomBackground;

                    const card = await welcomeSystem
                        .sendPreview(member, customBackground, useRandomBackground);

                    await interaction.followUp({
                        content: '**Prévia do seu cartão de boas-vindas:**',
                        files: [{ attachment: card, name: 'preview.png' }],
                        ephemeral: true
                    });
                    break;
                }

                case 'reset': {
                    welcomeSystem.resetConfig();
                    await interaction.reply({
                        content: 'Todas as configurações de boas-vindas foram resetadas.',
                        flags: 64
                    });
                    break;
                }
            }
        } catch (error) {
            console.error('Erro no comando welcome-config:', error);
            await interaction.reply({
                content: 'Ocorreu um erro ao executar o comando.',
                flags: 64
            });
        }
    }
};
