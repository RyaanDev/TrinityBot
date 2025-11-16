const {SlashCommandBuilder, InteractionContextType, PermissionFlagsBits, PermissionsBitField,EmbedBuilder} = require("discord.js")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Bane um usuario")
    .addUserOption(option=>
        option
        .setName('usuario')
        .setDescription("Selecione o Usuario que deseja banir!")
        .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('motivo')
        .setDescription('Diga o motivo pelo qual deseja banir esse usuario!')
        .setRequired(false)
    )
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator || PermissionFlagsBits.BanMembers),
    async execute(interaction){
        const targetUser = interaction.options.getUser('usuario')
        motivo = interaction.options.getString('motivo')||"Sem motivo definido!";

        //checkando se  o bot possui permissão para banir!
        if(!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.BanMembers)){
            return interaction.reply({content:"Eu não tenho permissão para banir usuarios!",ephemeral:true});
        }

        const member = await interaction.guild.members.fetch(targetUser.id).catch(()=>null);    

        if(!member){
            interaction.reply({content:"Esse membro não esta neste servidor!",ephemeral:true});
        }

        if (member.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.reply({ content: 'Você não pode banir pessoas com cargo maior ou igual ao seu!', ephemeral: true });
        }

        if (!member.bannable) {
            return interaction.reply({ content: 'Eu não consigo banir esse membro! este usuario possui um cargo maior que o meu.', ephemeral: true });
        }

        try{
            const carteirinha = new EmbedBuilder()
                .setTitle('USUÁRIO BANIDO')
                .setColor(0xFF0000)
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
                .addFields(
                    { name: 'Usuário', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: 'ID', value: targetUser.id, inline: true },
                    { name: 'Conta Criada', value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`, inline: true },
                    { name: 'Banido por', value: `${interaction.user.tag}`, inline: true },
                    { name: 'Motivo', value: motivo, inline: false },
                    { name: 'Data do Ban', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                )
                .setFooter({ text: `Sistema de Moderação • ${interaction.guild.name}`, iconURL: interaction.guild.iconURL() })
                .setTimestamp();

            await member.ban({ reason: motivo });
            await interaction.reply({ embeds: [carteirinha] });
        }
        catch(error){
            console.error(error,'Erro ao banir usuario');
            await interaction.reply({ content: 'Ocorreu um erro ao banir este membro', ephemeral: true });
        }
    }
}