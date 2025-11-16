// commands/admin/untimeout.js
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("untimeout")
        .setDescription("Remove o timeout de um usuário")
        .addUserOption(option =>
            option
                .setName('usuario')
                .setDescription("Usuário para remover o timeout")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('motivo')
                .setDescription('Motivo da remoção do timeout')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('usuario');
        const motivo = interaction.options.getString('motivo') || "Sem motivo definido!";

        // Verificar permissões do bot
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return interaction.reply({ 
                content: "Eu não tenho permissão para remover timeout!", 
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

        if (!member.isCommunicationDisabled()) {
            return interaction.reply({ 
                content: "Este usuário não está em timeout!", 
                ephemeral: true 
            });
        }

        try {
            // Remover timeout
            await member.timeout(null, motivo);

            // Carteirinha do timeout removido
            const carteirinhaUntimeout = new EmbedBuilder()
                .setTitle('TIMEOUT REMOVIDO')
                .setColor(0x00FF00) // Verde
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
                .addFields(
                    { name: 'Usuário', value: `${targetUser.tag}`, inline: true },
                    { name: 'ID', value: targetUser.id, inline: true },
                    { name: 'Removido por', value: `${interaction.user.tag}`, inline: true },
                    { name: 'Motivo', value: motivo, inline: false },
                    { name: 'Removido em', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                )
                .setFooter({ 
                    text: `Ação realizada por ${interaction.user.tag}`, 
                    iconURL: interaction.user.displayAvatarURL() 
                })
                .setTimestamp();

            await interaction.reply({ embeds: [carteirinhaUntimeout] });

        } catch (error) {
            console.error('Erro ao remover timeout:', error);
            await interaction.reply({ 
                content: "Ocorreu um erro ao remover o timeout.", 
                ephemeral: true 
            });
        }
    }
};