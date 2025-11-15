const { SlashCommandBuilder, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, Events, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('update')
        .setDescription('Cria uma embed de atualização')
        ,
    async execute(interaction) {

        const versionInput = new TextInputBuilder()
            .setCustomId('versionInput')
            .setLabel('Versão da atualização')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ex: v1.2.3')
            .setRequired(true);

        const newFeaturesInput = new TextInputBuilder()
            .setCustomId('newFeaturesInput')
            .setLabel('Novas funcionalidades')
            .setStyle(TextInputStyle.Paragraph) 
            .setPlaceholder('• Comando /shop adicionado\n• Sistema de ranking implementado')
            .setRequired(false);

        const improvementsInput = new TextInputBuilder()
            .setCustomId('improvementsInput')
            .setLabel('Melhorias')
            .setStyle(TextInputStyle.Paragraph) 
            .setPlaceholder('• Performance otimizada\n• Interface melhorada')
            .setRequired(false);

        const bugFixesInput = new TextInputBuilder()
            .setCustomId('bugFixesInput')
            .setLabel('Correções de bugs')
            .setStyle(TextInputStyle.Paragraph) 
            .setPlaceholder('• Bug do XP corrigido\n• Problema de conexão resolvido')
            .setRequired(false);

        const versionRow = new ActionRowBuilder().addComponents(versionInput);
        const newFeaturesRow = new ActionRowBuilder().addComponents(newFeaturesInput);
        const improvementsRow = new ActionRowBuilder().addComponents(improvementsInput);
        const bugFixesRow = new ActionRowBuilder().addComponents(bugFixesInput);

        const modal = new ModalBuilder()
            .setCustomId('updateModal')
            .setTitle('Criar Notas de Atualização')
            .addComponents(versionRow, newFeaturesRow, improvementsRow, bugFixesRow);

        await interaction.showModal(modal);

        // Handler para quando o modal for submetido
        const filter = (i) => i.customId === 'updateModal' && i.user.id === interaction.user.id;
        
        try {
            const modalResponse = await interaction.awaitModalSubmit({ filter, time: 300000 }); // 5 minutos

            // Obter os valores dos campos
            const version = modalResponse.fields.getTextInputValue('versionInput');
            const newFeatures = modalResponse.fields.getTextInputValue('newFeaturesInput');
            const improvements = modalResponse.fields.getTextInputValue('improvementsInput');
            const bugFixes = modalResponse.fields.getTextInputValue('bugFixesInput');

            // Função para formatar lista
            const formatList = (text) => {
                if (!text || text.trim() === '') return 'Nenhuma alteração';
                
                return text
                    .split('\n')
                    .filter(line => line.trim() !== '')
                    .map(line => line.trim().startsWith('•') ? line.trim() : `• ${line.trim()}`)
                    .join('\n');
            };

            const embed = new EmbedBuilder()
                .setColor(0x00FF00) // Verde
                .setTitle(`Atualização ${version}`)
                .setDescription('Confira as novidades desta versão:')
                .setTimestamp()
                .setFooter({ text: `Atualização enviada por ${modalResponse.user.username}`, iconURL: modalResponse.user.displayAvatarURL() });

            // Adicionar campos apenas se tiver conteúdo
            if (newFeatures && newFeatures.trim() !== '') {
                embed.addFields({ 
                    name: '**Novas Funcionalidades**', 
                    value: formatList(newFeatures),
                    inline: false 
                });
            }

            if (improvements && improvements.trim() !== '') {
                embed.addFields({ 
                    name: '**Melhorias**', 
                    value: formatList(improvements),
                    inline: false 
                });
            }

            if (bugFixes && bugFixes.trim() !== '') {
                embed.addFields({ 
                    name: '**Correções de Bugs**', 
                    value: formatList(bugFixes),
                    inline: false 
                });
            }

            // Verificar se há algum conteúdo
            const hasContent = newFeatures || improvements || bugFixes;
            if (!hasContent) {
                embed.addFields({ 
                    name: '**Observação**', 
                    value: 'Nenhum detalhe específico foi fornecido para esta atualização.',
                    inline: false 
                });
            }


            await modalResponse.reply({ 
                content: 'Atualização criada com sucesso!', 
                ephemeral: true 
            });

            await modalResponse.channel.send({ embeds: [embed] });

        } catch (error) {
            if (error.code === 'INTERACTION_COLLECTOR_ERROR') {
                await interaction.followUp({ 
                    content: 'Tempo esgotado! O modal foi cancelado.', 
                    ephemeral: true 
                });
            } else {
                console.error('Erro ao processar modal:', error);
                await interaction.followUp({ 
                    content: 'Erro ao processar a atualização.', 
                    ephemeral: true 
                });
            }
        }
    }
};