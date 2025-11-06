const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("invite")
        .setDescription("Cria um convite para o servidor")
        .addChannelOption(option =>
            option
                .setName('canal')
                .setDescription('Canal para o convite (padrão: geral)')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false)
        )
        .addIntegerOption(option =>
            option
                .setName('ilimitado')
                .setDescription('Número máximo de usos (0 = ilimitado)')
                .setMinValue(0)
                .setMaxValue(100)
                .setRequired(false)
        )
        .addIntegerOption(option =>
            option
                .setName('tempo')
                .setDescription('Tempo de expiração em horas')
                .setRequired(false)
                .addChoices(
                    { name: '30 minutos', value: 0.5 },
                    { name: '1 hora', value: 1 },
                    { name: '6 horas', value: 6 },
                    { name: '12 horas', value: 12 },
                    { name: '1 dia', value: 24 },
                    { name: '3 dias', value: 72 },
                    { name: '7 dias', value: 168 },
                    { name: 'Nunca expira', value: 0 }
                )
        )
        .addBooleanOption(option =>
            option
                .setName('temporario')
                .setDescription('Os membros entram como temporários?')
                .setRequired(false)
        ),

    async execute(interaction) {
        const canal = interaction.options.getChannel('canal') || interaction.channel;
        const maxUsos = interaction.options.getInteger('ilimitado') || 0;
        const tempoHoras = interaction.options.getInteger('tempo') || 24;
        const temporario = interaction.options.getBoolean('temporario') || false;

        // Verificar permissões do bot
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.CreateInstantInvite)) {
            return interaction.reply({ 
                content: "Eu não tenho permissão para criar convites!", 
                ephemeral: true 
            });
        }

        // Verificar se é administrador para criar convites sem validade
        if (tempoHoras === 0 && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ 
                content: "Apenas administradores podem criar convites sem data de expiração por motivos de segurança.", 
                ephemeral: true 
            });
        }

        // Verificar se é administrador para criar convites com usos ilimitados
        if (maxUsos === 0 && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ 
                content: "Apenas administradores podem criar convites com usos ilimitados por motivos de segurança.", 
                ephemeral: true 
            });
        }

        // Se for convite sem restrições, pedir confirmação
        if ((tempoHoras === 0 || maxUsos === 0) && interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            const embedConfirmacao = new EmbedBuilder()
                .setTitle('⚠️ CONFIRMACAO DE CONVITE SEM RESTRICOES')
                .setColor(0xFF0000)
                .setDescription("Voce esta prestes a criar um convite sem restricoes de seguranca.")
                .addFields(
                    { name: 'Tempo de expiracao', value: tempoHoras === 0 ? 'NUNCA' : `${tempoHoras} hora(s)`, inline: true },
                    { name: 'Maximo de usos', value: maxUsos === 0 ? 'ILIMITADO' : `${maxUsos} usos`, inline: true },
                    { name: 'Canal', value: `${canal}`, inline: true },
                    { 
                        name: 'AVISOS IMPORTANTES', 
                        value: 'Convites sem restricoes podem:\n- Ser compartilhados indevidamente\n- Comprometer a seguranca do servidor\n- Permitir entrada de usuarios mal-intencionados\n- Ser dificil de revogar posteriormente',
                        inline: false 
                    }
                )
                .setFooter({ 
                    text: `Requisitado por ${interaction.user.tag}`, 
                    iconURL: interaction.user.displayAvatarURL() 
                })
                .setTimestamp();

            const botoesConfirmacao = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('confirmar_convite')
                        .setLabel('Sim, criar convite sem restricoes')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('cancelar_convite')
                        .setLabel('Cancelar e usar restricoes')
                        .setStyle(ButtonStyle.Secondary)
                );

            await interaction.reply({ 
                embeds: [embedConfirmacao], 
                components: [botoesConfirmacao],
                ephemeral: true 
            });

            // Coletor de interação para os botões
            const filter = (btnInteraction) => 
                btnInteraction.customId === 'confirmar_convite' || 
                btnInteraction.customId === 'cancelar_convite';

            const collector = interaction.channel.createMessageComponentCollector({ 
                filter, 
                time: 30000, // 30 segundos
                max: 1 
            });

            collector.on('collect', async (btnInteraction) => {
                if (btnInteraction.customId === 'cancelar_convite') {
                    await btnInteraction.update({
                        content: 'Criacao do convite sem restricoes foi cancelada. Use o comando novamente com restricoes de tempo ou usos.',
                        embeds: [],
                        components: []
                    });
                    return;
                }

                if (btnInteraction.customId === 'confirmar_convite') {
                    try {
                        const invite = await canal.createInvite({
                            maxAge: tempoHoras === 0 ? 0 : tempoHoras * 3600,
                            maxUses: maxUsos,
                            temporary: temporario,
                            reason: `Convite sem restricoes criado por ${interaction.user.tag}`
                        });

                        const embedConviteCriado = new EmbedBuilder()
                            .setTitle('CONVITE SEM RESTRICOES CRIADO')
                            .setColor(0xFFA500)
                            .setDescription("Convite criado com sucesso - USE COM EXTREMA CAUTELA")
                            .addFields(
                                { name: 'Link do Convite', value: `https://discord.gg/${invite.code}`, inline: false },
                                { name: 'Maximo de Usos', value: maxUsos === 0 ? 'ILIMITADO' : `${maxUsos} usos`, inline: true },
                                { name: 'Expira em', value: tempoHoras === 0 ? 'NUNCA' : `${tempoHoras} hora(s)`, inline: true },
                                { name: 'Membros Temporarios', value: temporario ? 'Sim' : 'Nao', inline: true },
                                { name: 'Canal', value: `${canal}`, inline: true },
                                { 
                                    name: 'ALERTA DE SEGURANCA', 
                                    value: 'Este convite nao possui restricoes. Compartilhe apenas com pessoas de extrema confianca e monitore o servidor ativamente.',
                                    inline: false 
                                }
                            )
                            .setFooter({ 
                                text: `Criado por ${interaction.user.tag} - Convite sem restricoes`, 
                                iconURL: interaction.user.displayAvatarURL() 
                            })
                            .setTimestamp();

                        await btnInteraction.update({
                            content: `**LINK DO CONVITE SEM RESTRICOES:** https://discord.gg/${invite.code}\n\nGUARDE ESTE LINK EM LOCAL SEGURO E NAO COMPARTILHE PUBLICAMENTE.`,
                            embeds: [embedConviteCriado],
                            components: []
                        });

                    } catch (error) {
                        console.error('Erro ao criar convite:', error);
                        await btnInteraction.update({
                            content: "Ocorreu um erro ao criar o convite sem restricoes.",
                            embeds: [],
                            components: []
                        });
                    }
                }
            });

            collector.on('end', async (collected) => {
                if (collected.size === 0) {
                    await interaction.editReply({
                        content: "Tempo esgotado para confirmar a criacao do convite sem restricoes. O comando foi cancelado.",
                        embeds: [],
                        components: []
                    });
                }
            });

            return; 
        }

        // Código para convites normais
        try {
            const invite = await canal.createInvite({
                maxAge: tempoHoras === 0 ? 0 : tempoHoras * 3600,
                maxUses: maxUsos,
                temporary: temporario,
                reason: `Convite criado por ${interaction.user.tag}`
            });

            const embedInvite = new EmbedBuilder()
                .setTitle('CONVITE CRIADO')
                .setColor(0x00FF00)
                .setDescription("Convite criado com sucesso!")
                .addFields(
                    { name: 'Link do Convite', value: `https://discord.gg/${invite.code}`, inline: false },
                    { name: 'Maximo de Usos', value: maxUsos === 0 ? 'Ilimitado' : `${maxUsos} usos`, inline: true },
                    { name: 'Expira em', value: tempoHoras === 0 ? 'Nunca' : `${tempoHoras} hora(s)`, inline: true },
                    { name: 'Membros Temporarios', value: temporario ? 'Sim' : 'Nao', inline: true },
                    { name: 'Canal', value: `${canal}`, inline: true }
                )
                .setFooter({ 
                    text: `Criado por ${interaction.user.tag}`, 
                    iconURL: interaction.user.displayAvatarURL() 
                })
                .setTimestamp();

            await interaction.reply({ 
                content: `**Link direto:** https://discord.gg/${invite.code}`,
                embeds: [embedInvite],
                ephemeral: true 
            });

        } catch (error) {
            console.error('Erro ao criar convite:', error);
            await interaction.reply({ 
                content: "Ocorreu um erro ao criar o convite.", 
                ephemeral: true 
            });
        }
    }
};