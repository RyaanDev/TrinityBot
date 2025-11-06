// commands/admin/timeout.js
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("timeout")
        .setDescription("Aplica um timeout (silêncio) temporário em um usuário")
        .addUserOption(option =>
            option
                .setName('usuario')
                .setDescription("Usuário para aplicar o timeout")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName('tempo')
                .setDescription('Duração do timeout em minutos')
                .setRequired(true)
                .addChoices(
                    { name: '1 minuto', value: 1 },
                    { name: '5 minutos', value: 5 },
                    { name: '10 minutos', value: 10 },
                    { name: '30 minutos', value: 30 },
                    { name: '1 hora', value: 60 },
                    { name: '6 horas', value: 360 },
                    { name: '12 horas', value: 720 },
                    { name: '1 dia', value: 1440 },
                    { name: '3 dias', value: 4320 },
                    { name: '1 semana', value: 10080 }
                )
        )
        .addStringOption(option =>
            option.setName('motivo')
                .setDescription('Motivo do timeout')
                .setRequired(false)
        ),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('usuario');
        const tempoMinutos = interaction.options.getInteger('tempo');
        const motivo = interaction.options.getString('motivo') || "Sem motivo definido!";

        // Verificar permissões do bot
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return interaction.reply({ 
                content: "Eu não tenho permissão para aplicar timeout!", 
                ephemeral: true 
            });
        }

        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        if (!member) {
            return interaction.reply({ 
                content: "Este usuário não está no servidor!", 
                ephemeral: true 
            });
        }

        if (member.id === interaction.user.id) {
            return interaction.reply({ 
                content: "Você não pode se silenciar!", 
                ephemeral: true 
            });
        }

        if (member.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.reply({ 
                content: 'Você não pode silenciar pessoas com cargo maior ou igual ao seu!', 
                ephemeral: true 
            });
        }

        if (!member.moderatable) {
            return interaction.reply({ 
                content: 'Eu não consigo silenciar este usuário!', 
                ephemeral: true 
            });
        }

        try {
            const tempoMs = tempoMinutos * 60 * 1000; // Converter para milissegundos
            const dataFim = new Date(Date.now() + tempoMs);

            // Aplicar timeout
            await member.timeout(tempoMs, motivo);

            // Carteirinha do timeout
            const carteirinhaTimeout = new EmbedBuilder()
                .setTitle('TIMEOUT APLICADO')
                .setColor(0xFFFF00) // Amarelo
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
                .addFields(
                    { name: 'Usuário', value: `${targetUser.tag}`, inline: true },
                    { name: 'ID', value: targetUser.id, inline: true },
                    { name: 'Duração', value: `${tempoMinutos} minuto(s)`, inline: true },
                    { name: 'Aplicado por', value: `${interaction.user.tag}`, inline: true },
                    { name: 'Motivo', value: motivo, inline: false },
                    { name: 'Termina em', value: `<t:${Math.floor(dataFim.getTime() / 1000)}:R>`, inline: true }
                )
                .setFooter({ 
                    text: `Ação realizada por ${interaction.user.tag}`, 
                    iconURL: interaction.user.displayAvatarURL() 
                })
                .setTimestamp();

            await interaction.reply({ embeds: [carteirinhaTimeout] });

        } catch (error) {
            console.error('Erro ao aplicar timeout:', error);
            await interaction.reply({ 
                content: "Ocorreu um erro ao aplicar o timeout.", 
                ephemeral: true 
            });
        }
    }
};