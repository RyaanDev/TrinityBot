const { PermissionFlagsBits } = require('discord.js');

class AutoRoleSystem {
    constructor() {
        this.autoRoleEnabled = new Map();
    }

    // Habilitar/autorizar auto role para uma guild
    enableAutoRole(guildId, roleId) {
        this.autoRoleEnabled.set(guildId, {
            enabled: true,
            roleId: roleId
        });
        return true;
    }

    // Desabilitar auto role para uma guild
    disableAutoRole(guildId) {
        this.autoRoleEnabled.set(guildId, {
            enabled: false,
            roleId: null
        });
        return true;
    }

    // Obter configuração do auto role
    getAutoRoleConfig(guildId) {
        return this.autoRoleEnabled.get(guildId) || { enabled: false, roleId: null };
    }

    // Aplicar cargo automaticamente quando um membro entrar
    async applyAutoRole(member) {
        const guildId = member.guild.id;
        const config = this.getAutoRoleConfig(guildId);

        if (!config.enabled || !config.roleId) {
            return false;
        }

        try {
            const role = member.guild.roles.cache.get(config.roleId);
            if (!role) {
                console.log(`Cargo não encontrado para auto role na guild ${guildId}`);
                return false;
            }

            await member.roles.add(role);
            console.log(`Cargo automático "${role.name}" dado para ${member.user.tag}`);
            return true;
        } catch (error) {
            console.error(`Erro ao dar cargo automático para ${member.user.tag}:`, error);
            return false;
        }
    }
}

module.exports = new AutoRoleSystem();