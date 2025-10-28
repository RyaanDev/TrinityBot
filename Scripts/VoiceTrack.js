const db = require('../database/database');

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
        
        if (!session) return 0;

        const endTime = new Date();
        const timeSpent = Math.floor((endTime - session.joinTime) / 1000 / 60); // tempo em minutos

        // Atualizar no banco de dados
        await this.updateVoiceTime(userId, timeSpent);
        
        this.voiceSessions.delete(userId);
        console.log(`🎧 ${member.user.tag} ficou ${timeSpent} minutos em call`);

        return timeSpent;
    }

    // Atualizar tempo total no banco de dados
    async updateVoiceTime(userId, minutes) {
        let userData = db.read('users', userId);
        
        if (!userData) {
            userData = {
                totalVoiceTime: minutes,
                lastVoiceUpdate: new Date().toISOString()
            };
        } else {
            userData.totalVoiceTime = (userData.totalVoiceTime || 0) + minutes;
            userData.lastVoiceUpdate = new Date().toISOString();
        }
        
        db.update('users', userId, userData);
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