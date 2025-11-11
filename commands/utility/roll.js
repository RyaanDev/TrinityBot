const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roll')
        .setDescription('Gira dados personalizados')
        .addIntegerOption(option =>
            option.setName('quantidade')
                .setDescription('Quantidade de dados a girar (padrão: 1)')
                .setMinValue(1)
                .setMaxValue(10)
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('lados')
                .setDescription('Número de lados do dado (padrão: 6)')
                .setMinValue(2)
                .setMaxValue(100)
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('dado1')
                .setDescription('Número de lados do primeiro dado adicional')
                .setMinValue(2)
                .setMaxValue(100)
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('dado2')
                .setDescription('Número de lados do segundo dado adicional')
                .setMinValue(2)
                .setMaxValue(100)
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('dado3')
                .setDescription('Número de lados do terceiro dado adicional')
                .setMinValue(2)
                .setMaxValue(100)
                .setRequired(false)),
    
    async execute(interaction) {
        // Obter opções ou usar valores padrão
        const quantidade = interaction.options.getInteger('quantidade') || 1;
        const lados = interaction.options.getInteger('lados') || 6;
        
        // Coletar dados adicionais
        const dadosAdicionais = [];
        for (let i = 1; i <= 3; i++) {
            const dado = interaction.options.getInteger(`dado${i}`);
            if (dado) {
                dadosAdicionais.push(dado);
            }
        }

        // Girar os dados principais
        const resultadosPrincipais = [];
        let somaPrincipais = 0;
        
        for (let i = 0; i < quantidade; i++) {
            const resultado = Math.floor(Math.random() * lados) + 1;
            resultadosPrincipais.push(resultado);
            somaPrincipais += resultado;
        }

        // Girar dados adicionais
        const resultadosAdicionais = [];
        const somaAdicionais = [];
        
        dadosAdicionais.forEach((ladosDado, index) => {
            const resultado = Math.floor(Math.random() * ladosDado) + 1;
            resultadosAdicionais.push({
                lados: ladosDado,
                resultado: resultado
            });
            somaAdicionais.push(resultado);
        });

        // Calcular totais
        const totalAdicionais = somaAdicionais.reduce((a, b) => a + b, 0);
        const totalGeral = somaPrincipais + totalAdicionais;

        // Criar embed
        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('🎲 Resultado dos Dados')
            .setTimestamp()
            .setFooter({ text: `Solicitado por ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

        // Adicionar resultados principais
        if (quantidade === 1) {
            embed.setDescription(`**Dado D${lados}**: 🎲 **${resultadosPrincipais[0]}**`);
        } else {
            embed.addFields({
                name: `${quantidade} Dado(s) D${lados}`,
                value: `Resultados: ${resultadosPrincipais.join(', ')}\nSoma: **${somaPrincipais}**`,
                inline: false
            });
        }

        // Adicionar dados adicionais
        if (dadosAdicionais.length > 0) {
            const dadosText = resultadosAdicionais.map((dado, index) => 
                `D${dado.lados}: 🎲 **${dado.resultado}**`
            ).join('\n');
            
            const somaText = somaAdicionais.length > 1 ? `\nSoma dos adicionais: **${totalAdicionais}**` : '';
            
            embed.addFields({
                name: 'Dados Adicionais',
                value: `${dadosText}${somaText}`,
                inline: false
            });
        }

        // Adicionar total geral se houver múltiplos dados
        if (quantidade > 1 || dadosAdicionais.length > 0) {
            embed.addFields({
                name: 'Total Geral',
                value: `**${totalGeral}**`,
                inline: true
            });
        }

        // Enviar resposta
        await interaction.reply({ embeds: [embed] });
    }
};