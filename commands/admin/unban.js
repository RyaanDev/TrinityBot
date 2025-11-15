const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("unban")
        .setDescription("Desbane um usuário")
        .addStringOption(option =>
            option
                .setName('user')
                .setDescription("ID ou nome do usuário")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('motivo')
                .setDescription('Motivo do unban')
                .setRequired(false)
        )
        ,

    async execute(interaction) {
        const userInput = interaction.options.getString('user');
        const motivo = interaction.options.getString('motivo') || "Sem motivo definido!";

        // Verificar permissões
        if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return interaction.reply({ 
                content: "Você não tem permissão para desbanir usuários!", 
                ephemeral: true 
            });
        }

        try {
            const bans = await interaction.guild.bans.fetch();
            let userToUnban = null;

            // Procurar por ID
            if (userInput.match(/^\d+$/)) {
                userToUnban = bans.get(userInput);
            } 
            // Procurar por tag/nome
            else {
                userToUnban = bans.find(ban => 
                    ban.user.tag.toLowerCase().includes(userInput.toLowerCase()) ||
                    ban.user.username.toLowerCase().includes(userInput.toLowerCase())
                );
            }

            if (!userToUnban) {
                const embedError = new EmbedBuilder()
                    .setTitle('Usuário Não Encontrado')
                    .setColor(0xFF0000)
                    .setDescription(`Não foi encontrado nenhum usuário banido com: **${userInput}**`)
                    .addFields(
                        { name: 'Dica', value: 'Use o ID exato do usuário ou parte do nome/tag' },
                        { name: 'Bans Ativos', value: `Total: ${bans.size} usuários` }
                    );

                return interaction.reply({ embeds: [embedError], ephemeral: true });
            }

            // Desbanir o usuário
            await interaction.guild.members.unban(userToUnban.user.id, motivo);

            // Carteirinha de unban estilizada
            const carteirinha = new EmbedBuilder()
                .setTitle('BANIMENTO REMOVIDO')
                .setColor(0x00FF00)
                .setAuthor({ 
                    name: userToUnban.user.tag, 
                    iconURL: userToUnban.user.displayAvatarURL({ dynamic: true }) 
                })
                .setThumbnail(userToUnban.user.displayAvatarURL({ dynamic: true, size: 256 }))
                .addFields(
                    { name: 'Usuário', value: userToUnban.user.tag, inline: true },
                    { name: 'ID', value: `\`${userToUnban.user.id}\``, inline: true },
                    { name: 'Responsável', value: interaction.user.tag, inline: true },
                    { name: 'Data do Unban', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                    { name: 'Motivo', value: motivo, inline: false }
                )
                .setFooter({ 
                    text: `Sistema de Moderação • ${interaction.guild.name}`, 
                    iconURL: interaction.guild.iconURL() 
                })
                .setTimestamp();

            await interaction.reply({ embeds: [carteirinha] });

        } catch (error) {
            console.error('Erro no unban:', error);
            
            const embedError = new EmbedBuilder()
                .setTitle('Erro no Unban')
                .setColor(0xFF0000)
                .setDescription('Ocorreu um erro ao tentar desbanir o usuário.')
                .addFields(
                    { name: 'Possíveis causas', value: '• ID inválido\n• Usuário já desbanido\n• Problema de permissões' }
                );

            await interaction.reply({ embeds: [embedError], ephemeral: true });
        }
    }
}