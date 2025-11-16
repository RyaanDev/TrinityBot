// commands/admin/kick.js
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
module.exports = {
    data: new SlashCommandBuilder()
        .setName("kick")
        .setDescription("Expulsa um usuário do servidor")
        .addUserOption(option =>
            option
                .setName('usuario')
                .setDescription("Selecione o usuário que deseja expulsar!")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('motivo')
                .setDescription('Motivo da expulsão')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator || PermissionFlagsBits.KickMembers),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('usuario');
        const motivo = interaction.options.getString('motivo') || "Sem motivo definido!";

        // Verificar permissões do bot
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.KickMembers)) {
            return interaction.reply({ 
                content: "Eu não tenho permissão para expulsar usuários!", 
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
                content: "Você não pode se expulsar!", 
                ephemeral: true 
            });
        }

        if (member.id === interaction.client.user.id) {
            return interaction.reply({ 
                content: "Eu não posso me expulsar!", 
                ephemeral: true 
            });
        }

        if (member.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.reply({ 
                content: 'Você não pode expulsar pessoas com cargo maior ou igual ao seu!', 
                ephemeral: true 
            });
        }

        if (!member.kickable) {
            return interaction.reply({ 
                content: 'Eu não consigo expulsar este usuário! Ele possui um cargo maior que o meu.', 
                ephemeral: true 
            });
        }

        try {
            // Carteirinha da expulsão
            const carteirinhaKick = new EmbedBuilder()
                .setTitle('USUÁRIO EXPULSO')
                .setColor(0xFFA500) // Laranja
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
                .addFields(
                    { name: 'Usuário', value: `${targetUser.tag}`, inline: true },
                    { name: 'ID', value: targetUser.id, inline: true },
                    { name: 'Conta Criada', value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`, inline: true },
                    { name: 'Expulso por', value: `${interaction.user.tag}`, inline: true },
                    { name: 'Motivo', value: motivo, inline: false },
                    { name: 'Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                )
                .setFooter({ 
                    text: `Ação realizada por ${interaction.user.tag}`, 
                    iconURL: interaction.user.displayAvatarURL() 
                })
                .setTimestamp();

            await member.kick(motivo);
            await interaction.reply({ embeds: [carteirinhaKick] });

        } catch (error) {
            console.error('Erro ao expulsar:', error);
            await interaction.reply({ 
                content: "Ocorreu um erro ao expulsar este usuário.", 
                ephemeral: true 
            });
        }
    }
};