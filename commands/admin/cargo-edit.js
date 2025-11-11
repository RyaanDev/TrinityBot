const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cargo-edit')
        .setDescription('Configura o sistema de cargos por reação')
        .setDefaultMemberPermissions(0),

    async execute(interaction) {
        const cargosConfig = [
            { label: 'Jogos no geral', emoji: '🕹️', value: 'jogos_geral', roleId: '1437309740651647129' },
            { label: 'League of Legends', emoji: '🪄', value: 'lol', roleId: '1437311455425855548' },
            { label: 'Minecraft', emoji: '🧊', value: 'minecraft', roleId: '1437310923818795088' },
            { label: 'Música', emoji: '🎧', value: 'musica', roleId: '1437310074572767273' },
            { label: 'Memes', emoji: '🃏', value: 'memes', roleId: '1437310714334281748' },
            { label: 'Valorant', emoji: '🔫', value: 'valorant', roleId: '1437310579839598603' },
            { label: 'Anime', emoji: '🌸', value: 'anime', roleId: '1437310282396598352' },
            { label: 'Gartic', emoji: '🎨', value: 'gartic', roleId: '1437310433072513094' },
            { label: 'Eventos', emoji: '✨', value: 'eventos', roleId: '1437311030647853068' },
            { label: 'Hydra', emoji: '🐙', value: 'hydra', roleId: '1437311073911967765' }
        ];

        // Criar embed com menções dos cargos
        const embed = new EmbedBuilder()
            .setTitle('Resgate seus interesses:')
            .setDescription('Selecione uma opção:')
            .setColor(0x0099FF)
            .addFields(
                {
                    name: '\u200b',
                    value: cargosConfig.map(cargo => 
                        `${cargo.emoji} <@&${cargo.roleId}>`
                    ).join('\n')
                }
            );

        // Criar botões para cada cargo
        const rows = [];
        let currentRow = new ActionRowBuilder();
        
        cargosConfig.forEach((cargo, index) => {
            const button = new ButtonBuilder()
                .setCustomId(cargo.value)
                .setEmoji(cargo.emoji)
                .setStyle(ButtonStyle.Secondary);

            currentRow.addComponents(button);

            // Máximo de 5 botões por linha
            if ((index + 1) % 5 === 0 || index === cargosConfig.length - 1) {
                rows.push(currentRow);
                currentRow = new ActionRowBuilder();
            }
        });

        await interaction.reply({
            embeds: [embed],
            components: rows
        });
    },

    // Handler para os botões
    async handleButton(interaction) {
        const cargosConfig = [
            { label: 'Jogos no geral', emoji: '🕹️', value: 'jogos_geral', roleId: '1437309740651647129' },
            { label: 'League of Legends', emoji: '🪄', value: 'lol', roleId: '1437311455425855548' },
            { label: 'Minecraft', emoji: '🧊', value: 'minecraft', roleId: '1437310923818795088' },
            { label: 'Música', emoji: '🎧', value: 'musica', roleId: '1437310074572767273' },
            { label: 'Memes', emoji: '🃏', value: 'memes', roleId: '1437310714334281748' },
            { label: 'Valorant', emoji: '🔫', value: 'valorant', roleId: '1437310579839598603' },
            { label: 'Anime', emoji: '🌸', value: 'anime', roleId: '1437310282396598352' },
            { label: 'Gartic', emoji: '🎨', value: 'gartic', roleId: '1437310433072513094' },
            { label: 'Eventos', emoji: '✨', value: 'eventos', roleId: '1437311030647853068' },
            { label: 'Hydra', emoji: '🐙', value: 'hydra', roleId: '1437311073911967765' }
        ];

        const cargoSelecionado = cargosConfig.find(cargo => cargo.value === interaction.customId);
        
        if (!cargoSelecionado) return;

        const member = interaction.member;
        const hasRole = member.roles.cache.has(cargoSelecionado.roleId);

        try {
            if (hasRole) {
                // Remover cargo se já tem
                await member.roles.remove(cargoSelecionado.roleId);
                await interaction.reply({
                    content: `Cargo <@&${cargoSelecionado.roleId}> removido!`,
                    ephemeral: true
                });
            } else {
                // Adicionar cargo se não tem
                await member.roles.add(cargoSelecionado.roleId);
                await interaction.reply({
                    content: `Cargo <@&${cargoSelecionado.roleId}> adicionado!`,
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('Erro ao atualizar cargo:', error);
            await interaction.reply({
                content: 'Erro ao atualizar cargo. Por favor, tente novamente.',
                ephemeral: true
            });
        }
    }
};