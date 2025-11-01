const db = require('../database/database');

// Função para formatar dados do usuário
function formatUserData(member) {
    const now = new Date();
    
    // Dados automáticos obrigatórios
    const automaticData = {
        discordJoinDate: member.user.createdAt.toISOString(),
        serverJoinDate: member.joinedAt.toISOString(),
        roles: member.roles.cache.map(role => role.name).filter(name => name !== '@everyone'),
        commandCount: 0,
        eventsParticipated: 0,
        eventsWon: 0,
        totalVoiceTime: 0, // em minutos - será atualizado pelo voice tracker
        lastVoiceUpdate: new Date().toISOString(),
        badges: [],
        createdAt: new Date().toISOString()
    };
    
    // Dados opcionais (serão preenchidos pelo usuário)
    const optionalData = {
        about: "",
        birthday: "",
        favoriteGame: "",
        socialLinks: {}
    };
    
    return { ...automaticData, ...optionalData };
}

function createBasicUserData(userId) {
    const now = new Date();
    
    return {
        discordJoinDate: now.toISOString(), // Usa data atual como fallback
        serverJoinDate: now.toISOString(), // Usa data atual como fallback
        roles: [],
        commandCount: 0,
        eventsParticipated: 0,
        eventsWon: 0,
        totalVoiceTime: 0,
        lastVoiceUpdate: now.toISOString(),
        badges: [],
        createdAt: now.toISOString(),
        about: "",
        birthday: "",
        favoriteGame: "",
        socialLinks: {}
    };
}

class VoiceTracker {
    constructor() {
        this.voiceSessions = new Map(); // { userId: { joinTime: Date, channelId: string } }
    }

    // Iniciar tracking quando usuário entrar em um canal de voz
    startTracking(member, channelId) {
        const userId = member.id;
        this.voiceSessions.set(userId, {
            joinTime: new Date(),
            channelId: channelId,
            guildId: member.guild.id
        });
        console.log(`Iniciando tracking de voz para ${member.user.tag}`);
    }

    // Parar tracking e calcular tempo quando usuário sair
    async stopTracking(member) {
        const userId = member.id;
        const session = this.voiceSessions.get(userId);
        try{
        if (!session) return 0;
        const endTime = new Date();
        const timeSpent = Math.floor((endTime - session.joinTime) / (1000 * 60)); // tempo em minutos

        // Atualizar no banco de dados
        await this.updateVoiceTime(userId, timeSpent, member);
        
        this.voiceSessions.delete(userId);
        console.log(`🎧 ${member.user.tag} ficou ${timeSpent} minutos em call`);

        return timeSpent;}
        catch (error) {
            console.error(`Erro ao parar tracking para ${member.user.tag}:`, error);
            
            let userData = db.read('users', userId);
            if (!userData) {
                // Se não existir, criar perfil usando o objeto member
                userData = formatUserData(member);
                db.create('users', userId, userData);
                console.log(`Novo usuario adicionado com sucesso! ${userId}`);
            }
            return 0;
        }
    }

    // Atualizar tempo total no banco de dados
    async updateVoiceTime(userId, minutes,member=null) {
        let userData = db.read('users', userId);
        
        if (!userData) {
            // Se temos o objeto member, usa formatUserData, senão usa createBasicUserData
            userData = member ? formatUserData(member) : createBasicUserData(userId);
            userData.totalVoiceTime = minutes;
            userData.lastVoiceUpdate = new Date().toISOString();
            db.create('users', userId, userData);
        } else {
            userData.totalVoiceTime = (userData.totalVoiceTime || 0) + minutes;
            userData.lastVoiceUpdate = new Date().toISOString();
            db.update('users', userId, userData);
        }
        
        return userData.totalVoiceTime;
    }

    // Obter tempo total de um usuário
    getVoiceTime(userId) {
        const userData = db.read('users', userId);
        return userData?.totalVoiceTime || 0;
    }

    // Limpar sessões antigas (em caso de reinício do bot)
    cleanup() {
        const now = new Date();
        for (const [userId, session] of this.voiceSessions.entries()) {
            // Se a sessão tem mais de 24 horas, remove
            if (now - session.joinTime > 24 * 60 * 60 * 1000) {
                this.voiceSessions.delete(userId);
            }
        }
    }
}

module.exports = new VoiceTracker();