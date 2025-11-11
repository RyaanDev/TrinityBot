class VoiceInviteManager {
    constructor() {
        this.voiceInvites = new Map();
    }

    // Adicionar um convite
    addInvite(code, inviteData) {
        this.voiceInvites.set(code, inviteData);
        console.log(`Convite de voz adicionado: ${code} para canal ${inviteData.canalVozId}`);
    }

    // Remover um convite
    removeInvite(code) {
        this.voiceInvites.delete(code);
        console.log(`Convite de voz removido: ${code}`);
    }

    // Obter um convite
    getInvite(code) {
        return this.voiceInvites.get(code);
    }

    // Obter todos os convites
    getAllInvites() {
        return this.voiceInvites;
    }

    // Marcar convite como usado
    markInviteUsed(code, userId) {
        const invite = this.voiceInvites.get(code);
        if (invite) {
            invite.usado = true;
            invite.userId = userId;
            invite.usadoEm = Date.now();
        }
    }

    // Limpar convites expirados
    cleanup() {
        const now = Date.now();
        let cleaned = 0;
        
        for (const [code, inviteData] of this.voiceInvites.entries()) {
            // Se o convite foi criado há mais tempo que o tempo máximo + margem de segurança
            const maxAge = inviteData.tempoMinutos * 60 * 1000;
            if (now - inviteData.criadoEm > maxAge + 300000) { // +5 minutos de margem
                this.voiceInvites.delete(code);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            console.log(`Limpeza de convites: ${cleaned} convites expirados removidos`);
        }
        
        return cleaned;
    }
}

module.exports = new VoiceInviteManager();