const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require("discord.js");
const voiceInviteManager = require('../../Scripts/VoiceInviteManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("voice-invite")
        .setDescription("Cria convite que direciona para um canal de voz e expulsa ao sair")
        .addChannelOption(option =>
            option
                .setName('canal')
                .setDescription('Canal de voz para onde o usuário será direcionado')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildVoice)
        )
        .addIntegerOption(option =>
            option
                .setName('tempo')
                .setDescription('Tempo máximo do convite (minutos)')
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
                .setDescription('Motivo da expulsão ao sair do canal')
                .setRequired(false)
        ),

    async execute(interaction) {
        const canalVoz = interaction.options.getChannel('canal');
        const tempoMinutos = interaction.options.getInteger('tempo');
        const motivo = interaction.options.getString('motivo') || "Você saiu do canal de voz";

        // Verificar se o bot tem permissões no canal
        if (!canalVoz.viewable || !canalVoz.joinable) {
            return interaction.reply({
                content: "Não tenho permissão para acessar esse canal de voz!",
                flags: MessageFlags.Ephemeral
            });
        }

        try {
            // Criar convite normal
            const invite = await interaction.channel.createInvite({
                maxAge: tempoMinutos * 60, // Expira após o tempo
                maxUses: 1, // Apenas 1 uso
                temporary: false,
                reason: `Convite para canal de voz ${canalVoz.name} por ${interaction.user.tag}`
            });

            // Armazenar informação do convite
            voiceInviteManager.addInvite(invite.code, {
                canalVozId: canalVoz.id,
                guildId: interaction.guild.id,
                tempoMinutos,
                motivo,
                criador: interaction.user.id,
                criadoEm: Date.now(),
                usado: false
            });

            const embed = new EmbedBuilder()
                .setTitle('CONVITE PARA CANAL DE VOZ')
                .setColor(0x00FF00)
                .setDescription(`**Convite criado com direcionamento automático!**`)
                .addFields(
                    { name: 'Link do Convite', value: `https://discord.gg/${invite.code}`, inline: false },
                    { name: 'Canal de Voz', value: `${canalVoz}`, inline: true },
                    { name: 'Expira em', value: `${tempoMinutos} minutos`, inline: true },
                    { name: 'Usos', value: '1 uso', inline: true },
                    { name: 'Observação', value: `O usuário será expulso ao sair do canal de voz`, inline: false }
                )
                .setFooter({ text: `Convite criado por ${interaction.user.tag}` })
                .setTimestamp();

            await interaction.reply({ 
                content: `**Convite para Canal de Voz:** https://discord.gg/${invite.code}\n **Usuário será direcionado para: ${canalVoz.name}**\n⚠️ **Será expulso ao sair do canal!**`,
                embeds: [embed],
                flags: MessageFlags.Ephemeral
            });

        } catch (error) {
            console.error('Erro ao criar convite para canal de voz:', error);
            await interaction.reply({ 
                content: "Ocorreu um erro ao criar o convite.", 
                flags: MessageFlags.Ephemeral
            });
        }
    }
};