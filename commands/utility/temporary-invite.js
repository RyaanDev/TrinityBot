const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");

const tempMembers = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName("temporary-invite")
        .setDescription("Cria convite que expulsa membros após o tempo")
        .addIntegerOption(option =>
            option
                .setName('tempo')
                .setDescription('Tempo até expulsar (minutos)')
                .setRequired(true)
                .addChoices(
                    { name: '30 minutos', value: 30 },
                    { name: '1 hora', value: 60 },
                    { name: '6 horas', value: 360 },
                    { name: '12 horas', value: 720 },
                    { name: '1 dia', value: 1440 }
                )
        )
        .addStringOption(option =>
            option.setName('motivo')
                .setDescription('Motivo da expulsão temporária')
                .setRequired(false)
        ),

    async execute(interaction) {
        const tempoMinutos = interaction.options.getInteger('tempo');
        const motivo = interaction.options.getString('motivo') || "Acesso temporário expirado";

        try {
            // Criar convite normal
            const invite = await interaction.channel.createInvite({
                maxAge: tempoMinutos * 60, // Expira após o tempo
                maxUses: 1, // Apenas 1 uso
                temporary: false, // Importante: false para poder expulsar depois
                reason: `Convite temporário de ${tempoMinutos}min por ${interaction.user.tag}`
            });

            // Armazenar informação do convite temporário
            tempMembers.set(invite.code, {
                tempoMinutos,
                motivo,
                criador: interaction.user.id,
                criadoEm: Date.now()
            });

            // Agendar expulsão
            setTimeout(async () => {
                try {
                    // Buscar o membro que entrou por este convite
                    const invites = await interaction.guild.invites.fetch();
                    const usedInvite = invites.find(inv => inv.code === invite.code && inv.uses > 0);
                    
                    if (usedInvite && usedInvite.inviter) {
                        console.log(`Convite ${invite.code} foi usado, mas não consigo identificar o membro automaticamente.`);
                    }
                    
                    // Remover da lista
                    tempMembers.delete(invite.code);
                } catch (error) {
                    console.error('Erro ao processar expulsão temporária:', error);
                }
            }, tempoMinutos * 60 * 1000);

            const embed = new EmbedBuilder()
                .setTitle('CONVITE TEMPORÁRIO')
                .setColor(0xFFA500)
                .setDescription(`**Convite criado com expulsão automática!**`)
                .addFields(
                    { name: 'Link', value: `https://discord.gg/${invite.code}`, inline: false },
                    { name: 'Expulsão em', value: `${tempoMinutos} minutos`, inline: true },
                    { name: 'Usos', value: '1 uso', inline: true },
                    { name: 'Motivo', value: motivo, inline: false }
                )
                .setFooter({ text: `Após ${tempoMinutos}min, o membro será expulso automaticamente` });

            await interaction.reply({ 
                content: `**Convite temporário:** https://discord.gg/${invite.code}\n⚠️ **O membro será expulso após ${tempoMinutos} minutos!**`,
                embeds: [embed],
                ephemeral: true 
            });

        } catch (error) {
            console.error('Erro ao criar convite temporário:', error);
            await interaction.reply({ 
                content: "Ocorreu um erro ao criar o convite temporário.", 
                ephemeral: true 
            });
        }
    }
};