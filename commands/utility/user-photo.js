const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Exibe o avatar de um usuário')
        .addUserOption(option =>
            option
                .setName('usuario')
                .setDescription('Usuário para mostrar o avatar')
                .setRequired(false)
        ),
    
    async execute(interaction) {
        try {
            const targetUser = interaction.options.getUser('usuario') || interaction.user;
            
            const avatarURL = targetUser.displayAvatarURL({ 
                size: 4096, 
                dynamic: true,
                extension: 'png'
            });
            
            const embed = {
                color: 0x0099ff,
                title: `Avatar de ${targetUser.username}`,
                description: `Avatar de ${targetUser.tag}`,
                image: {
                    url: avatarURL
                },
                fields: [
                    {
                        name: 'Links para download',
                        value: `[PNG](${targetUser.displayAvatarURL({ size: 4096, format: 'png' })}) | [JPG](${targetUser.displayAvatarURL({ size: 4096, format: 'jpg' })}) | [WEBP](${targetUser.displayAvatarURL({ size: 4096, format: 'webp' })})`
                    }
                ],
                footer: {
                    text: `Solicitado por ${interaction.user.tag}`,
                    icon_url: interaction.user.displayAvatarURL({ size: 32 })
                },
                timestamp: new Date().toISOString()
            };
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Erro no comando avatar:', error);
            await interaction.reply({
                content: 'Ocorreu um erro ao exibir o avatar!',
                ephemeral: true
            });
        }
    }
};