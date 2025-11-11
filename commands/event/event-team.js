const { SlashCommandBuilder, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../database/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('event-team')
        .setDescription('Inscreve um time no torneio')
        .addStringOption(option =>
            option.setName('jogador1')
                .setDescription('Jogador 1 (@membro NomeLoL Elo)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('jogador2')
                .setDescription('Jogador 2 (@membro NomeLoL Elo)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('jogador3')
                .setDescription('Jogador 3 (@membro NomeLoL Elo)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('jogador4')
                .setDescription('Jogador 4 (@membro NomeLoL Elo)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('jogador5')
                .setDescription('Jogador 5 (@membro NomeLoL Elo)')
                .setRequired(true)),
    
    async execute(interaction) {
        // Verificar se as inscricoes estao abertas
        const status = db.read('config', 'inscricoes');
        if (!status?.abertas) {
            return await interaction.reply({ 
                content: 'Inscricoes fechadas! Aguarde ate que as inscricoes sejam abertas pelos administradores.', 
                flags: 64 
            });
        }

        // Pedir apenas o nome do time via modal
        const nomeTimeInput = new TextInputBuilder()
            .setCustomId('nomeTime')
            .setLabel('Nome do Time')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Digite o nome do seu time')
            .setRequired(true)
            .setMaxLength(30);

        const nomeTimeRow = new ActionRowBuilder().addComponents(nomeTimeInput);

        const nomeTimeModal = new ModalBuilder()
            .setCustomId('nomeTimeModal')
            .setTitle('Nome do Time')
            .addComponents(nomeTimeRow);

        await interaction.showModal(nomeTimeModal);

        // Handler para o modal
        const filter = (i) => i.customId === 'nomeTimeModal' && i.user.id === interaction.user.id;
        
        try {
            const modalResponse = await interaction.awaitModalSubmit({ 
                filter: filter, 
                time: 300000 
            });

            const nomeTime = modalResponse.fields.getTextInputValue('nomeTime');

            // Verificar se nome do time ja existe
            const times = db.readAll('times');
            const timeExistente = Object.values(times).find(time => time.nomeTime === nomeTime);
            if (timeExistente) {
                return await modalResponse.reply({ 
                    content: `Ja existe um time com o nome "${nomeTime}"`,
                    flags: 64 
                });
            }

            // Processar os jogadores das opcoes do comando
            const jogadoresInput = [
                interaction.options.getString('jogador1'),
                interaction.options.getString('jogador2'),
                interaction.options.getString('jogador3'),
                interaction.options.getString('jogador4'),
                interaction.options.getString('jogador5')
            ];

            const jogadoresProcessados = [];
            const membrosSelecionados = new Set();
            let totalHoras = 0;

            for (let i = 0; i < 5; i++) {
                const jogadorInput = jogadoresInput[i];
                
                // Extrair mencao do Discord
                const mentionMatch = jogadorInput.match(/<@!?(\d+)>/);
                if (!mentionMatch) {
                    return await modalResponse.reply({ 
                        content: `Formato invalido para Jogador ${i + 1}! Use: @membro NomeLoL Elo`,
                        flags: 64 
                    });
                }

                const discordId = mentionMatch[1];
                
                // Verificar duplicata
                if (membrosSelecionados.has(discordId)) {
                    return await modalResponse.reply({ 
                        content: `O mesmo membro do Discord nao pode estar duas vezes no time!`,
                        flags: 64 
                    });
                }
                membrosSelecionados.add(discordId);

                // Buscar usuario no servidor
                const member = await interaction.guild.members.fetch(discordId).catch(() => null);
                if (!member) {
                    return await modalResponse.reply({ 
                        content: `Membro do Discord nao encontrado no servidor!`,
                        flags: 64 
                    });
                }

                // Extrair nome LoL e elo (remover a mencao)
                const partes = jogadorInput.replace(/<@!?\d+>/, '').trim().split(' ');
                if (partes.length < 2) {
                    return await modalResponse.reply({ 
                        content: `Formato invalido para Jogador ${i + 1}! Use: @membro NomeLoL Elo`,
                        flags: 64 
                    });
                }

                const nomeLoL = partes[0];
                const elo = partes.slice(1).join(' ');

                // Buscar horas no banco de dados
                const usuarioDB = db.read('users', discordId);
                const horas = usuarioDB?.totalVoiceTime || 0;
                totalHoras += horas;

                jogadoresProcessados.push({
                    discordId: discordId,
                    member: member,
                    nomeLoL: nomeLoL,
                    elo: elo,
                    horas: horas,
                    username: member.user.username
                });
            }

            // Verificar se soma das horas e >= 15
            if (totalHoras < 15) {
                const embedErro = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('Horas Insuficientes')
                    .setDescription(`A soma total de horas do time e ${totalHoras}h, mas e necessario 15h no minimo.`)
                    .addFields(
                        { 
                            name: 'Membros e Horas', 
                            value: jogadoresProcessados.map(j => 
                                `${j.member.user.username}: ${j.horas}h - ${j.nomeLoL} - ${j.elo}`
                            ).join('\n') 
                        }
                    );

                return await modalResponse.reply({ 
                    embeds: [embedErro], 
                    flags: 64 
                });
            }

            // Verificar se algum usuario ja esta em outro time
            for (const jogador of jogadoresProcessados) {
                const usuarioEmTime = Object.values(times).find(time => 
                    time.membros.some(m => m.discordId === jogador.discordId)
                );
                if (usuarioEmTime) {
                    return await modalResponse.reply({ 
                        content: `${jogador.member.user.username} ja esta no time "${usuarioEmTime.nomeTime}"`,
                        flags: 64 
                    });
                }
            }

            // Criar time no banco de dados
            const timeId = `time_${Date.now()}`;
            const novoTime = {
                nomeTime: nomeTime,
                criadorId: interaction.user.id,
                criadorUsername: interaction.user.username,
                membros: jogadoresProcessados.map(j => ({
                    discordId: j.discordId,
                    username: j.username,
                    nomeLoL: j.nomeLoL,
                    elo: j.elo,
                    horas: j.horas
                })),
                totalHoras: totalHoras,
                dataCriacao: new Date().toISOString(),
                status: 'ativo'
            };

            db.create('times', timeId, novoTime);

            // Criar cargo do time
            const cargoTime = await interaction.guild.roles.create({
                name: nomeTime,
                color: 'Random',
                mentionable: false,
                reason: `Cargo para o time ${nomeTime}`
            });

            const categoriaEventos = interaction.guild.channels.cache.find(channel => 
                channel.type === 4 && channel.name === "˗ˏˋ ★ ― eventos !!"
            );

            // Criar canal de voz privado na categoria de eventos
            const canalVoz = await interaction.guild.channels.create({
                name: `${nomeTime}`,
                type: 2, 
                parent: categoriaEventos ? categoriaEventos.id : null, 
                permissionOverwrites: [
                ]
            });

            // Adicionar permissoes para administradores
            const adminRole = interaction.guild.roles.cache.find(role => role.permissions.has(PermissionFlagsBits.Administrator));
            if (adminRole) {
                await canalVoz.permissionOverwrites.edit(adminRole, {
                    Connect: true,
                    ViewChannel: true,
                    Speak: true,
                    ManageChannels: true
                });
            }

            // Adicionar cargo aos membros
            for (const jogador of jogadoresProcessados) {
                await jogador.member.roles.add(cargoTime);
            }

            // Atualizar time com IDs do cargo e canal
            db.update('times', timeId, {
                cargoId: cargoTime.id,
                canalVozId: canalVoz.id
            });

            // Embed de sucesso
            const embedSucesso = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('Time Inscrito com Sucesso!')
                .setDescription(`O time "${nomeTime}" foi criado e inscrito no torneio.`)
                .addFields(
                    { 
                        name: 'Membros do Time', 
                        value: jogadoresProcessados.map(j => 
                            `${j.member.user.username}\n${j.nomeLoL} - ${j.elo}\n${j.horas}h`
                        ).join('\n\n'), 
                        inline: false 
                    },
                    { 
                        name: 'Estatisticas', 
                        value: `Total de Horas: ${totalHoras}h\nMembros: 5`, 
                        inline: true 
                    },
                    { 
                        name: 'Recursos Criados', 
                        value: `Cargo: ${cargoTime}\nCanal: ${canalVoz}`, 
                        inline: false 
                    }
                )
                .setTimestamp()
                .setFooter({ text: `Time criado por ${interaction.user.username}` });

            await modalResponse.reply({ 
                embeds: [embedSucesso]
            });

        } catch (error) {
            if (error.code === 'INTERACTION_COLLECTOR_ERROR') {
                await interaction.followUp({ 
                    content: 'Tempo esgotado! A inscricao foi cancelada.', 
                    flags: 64 
                });
            } else {
                console.error('Erro ao processar inscricao:', error);
                await interaction.followUp({ 
                    content: 'Erro ao processar a inscricao.', 
                    flags: 64 
                });
            }
        }
    }
};