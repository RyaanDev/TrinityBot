const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,PermissionFlagsBits } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ban-list")
        .setDescription("Lista todos os usuários banidos do servidor")
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        const suportRoleId = process.env.SUPORT_ID;
        if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)||!interaction.user.id == suportRoleId) {
            return interaction.reply({ 
                content: "Você não tem permissão para ver a lista de bans!", 
                ephemeral: true 
            });
        }

        try {
            const bans = await interaction.guild.bans.fetch();
            
            if (bans.size === 0) {
                const embed = new EmbedBuilder()
                    .setTitle('Lista de Bans')
                    .setColor(0x00FF00)
                    .setDescription('Não há usuários banidos neste servidor.')
                    .setFooter({ text: `Solicitado por ${interaction.user.tag}` });

                return interaction.reply({ embeds: [embed] });
            }

            // Limita a 10 bans por embed (Discord limita a 4000 caracteres)
            const banList = Array.from(bans.values()).slice(0, 10);
            
            const embed = new EmbedBuilder()
                .setTitle(`Lista de Bans - ${bans.size} usuários`)
                .setColor(0xFFA500)
                .setDescription('Aqui estão os usuários atualmente banidos:')
                .setFooter({ text: `Use /unban <ID> para desbanir • Página 1/${Math.ceil(bans.size / 10)}` });

            banList.forEach((ban, index) => {
                embed.addFields({
                    name: `${ban.user.tag}`,
                    value: `**ID:** \`${ban.user.id}\`\n**Motivo:** ${ban.reason || 'Sem motivo registrado'}\n━━━━━━━━━━━━━━━━━━`,
                    inline: false
                });
            });

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Erro ao listar bans:', error);
            await interaction.reply({ 
                content: "Ocorreu um erro ao buscar a lista de bans.", 
                ephemeral: true 
            });
        }
    }
}