const { Client, EmbedBuilder } = require('discord.js');
const db = require('../database/database');
const cron = require('node-cron');

// Função para verificar aniversários todos os dias às 12h
function startBirthdayChecker(client) {
    // Agendar tarefa para rodar todos os dias às 12:00
    cron.schedule('0 12 * * *', async () => {
        console.log('Verificando aniversários...');
        
        const hoje = new Date();
        const dia = String(hoje.getDate()).padStart(2, '0');
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        const dataHoje = `${dia}/${mes}`;
        
        console.log(`Data de hoje: ${dataHoje}`);
        
        // Ler todos os usuários do banco de dados
        const users = db.readAll('users') || {};
        console.log(`Total de usuários no banco: ${Object.keys(users).length}`);
        
        let aniversariantes = 0;
        
        for (const [userId, userData] of Object.entries(users)) {
            if (userData.birthday && userData.birthday === dataHoje) {
                console.log(`🎂 Encontrado aniversariante: ${userId} - ${userData.birthday}`);
                aniversariantes++;
                await sendBirthdayMessage(client, userId, userData);
            }
        }
        
        console.log(`✅ Verificação concluída. ${aniversariantes} aniversariantes encontrados.`);
    }, {
        timezone: "America/Sao_Paulo"
    });
}

// Função para enviar mensagem de parabéns
async function sendBirthdayMessage(client, userId, userData) {
    try {
        console.log(`Enviando mensagem de aniversário para ${userId}`);
        
        // Procurar em todos os servidores onde o bot está
        for (const [guildId, guild] of client.guilds.cache) {
            const member = await guild.members.fetch(userId).catch(() => {
                console.log(`Usuário ${userId} não encontrado no servidor ${guild.name}`);
                return null;
            });
            
            if (!member) continue;
            
            console.log(`✅ Usuário encontrado no servidor: ${guild.name}`);
            
            // Procurar por um canal adequado
            let channel = guild.channels.cache.find(ch => 
                (ch.name.includes('geral') || ch.name.includes('general') || ch.name.includes('🎉') || ch.name.includes('chat')) && 
                ch.isTextBased()
            ) || guild.channels.cache.find(ch => 
                ch.isTextBased() && 
                ch.permissionsFor(guild.members.me).has('SendMessages')
            );
            
            if (!channel) {
                console.log(`Nenhum canal adequado encontrado em ${guild.name}`);
                continue;
            }
            
            // Criar embed de parabéns
            const birthdayEmbed = new EmbedBuilder()
                .setColor(0xFF69B4)
                .setTitle('PARABÉNS! 🎂🎉')
                .setDescription(`**${member.displayName}** está comemorando aniversário hoje!`)
                .addFields(
                    { name: 'Aniversariante', value: `${member}`, inline: true },
                    { name: 'Data', value: userData.birthday, inline: true }
                )
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
                .setFooter({ text: 'Desejamos um feliz aniversário!' })
                .setTimestamp();
            
            await channel.send({ 
                content: `**TODOS VENHAM DESEJAR FELIZ ANIVERSÁRIO PARA ${member}!**`,
                embeds: [birthdayEmbed] 
            });
            
            console.log(`Mensagem de aniversário enviada para ${member.displayName} no canal ${channel.name}`);
            break; // Parar após enviar em um servidor
        }
        
    } catch (error) {
        console.error('Erro ao enviar mensagem de aniversário:', error);
    }
}

// ⚠️ IMPORTANTE: Para não dar erro como comando, exportamos um objeto vazio
module.exports = {
    // Exporta um objeto vazio para data e execute
    data: null,
    execute: null,
    startBirthdayChecker // Exporta a função principal
};