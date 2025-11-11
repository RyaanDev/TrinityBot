const welcomeCard = require('./WelcomeCard');
const fs = require('fs');
const path = require('path');

class WelcomeSystem {
    constructor() {
        this.welcomeChannelId = null;
        this.isEnabled = false;
        this.backgrounds = new Map();
        this.useRandomBackground = false;

        this.loadConfig();
    }

    setWelcomeChannel(channelId) {
        this.welcomeChannelId = channelId;
        this.isEnabled = true;
        this.saveConfig();
    }

    disableWelcome() {
        this.isEnabled = false;
        this.welcomeChannelId = null;
        this.saveConfig();
    }

    setRandomBackground(state) {
        this.useRandomBackground = state;
        this.saveConfig();
        console.log(`Modo background aleatório: ${state ? 'ativado' : 'desativado'}`);
    }

    setWelcomeBackground(guildId, filename) {
        try {
            const backgroundsDir = path.join(process.cwd(), 'imgs');
            const backgroundPath = path.join(backgroundsDir, filename);
            if (fs.existsSync(backgroundPath)) {
                this.backgrounds.set(guildId, backgroundPath);
                this.saveConfig();
                return true;
            } else return false;
        } catch {
            return false;
        }
    }

    getAvailableBackgrounds() {
        const backgroundsDir = path.join(process.cwd(), 'imgs');
        try {
            if (fs.existsSync(backgroundsDir)) {
                return fs.readdirSync(backgroundsDir).filter(f =>
                    ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(path.extname(f).toLowerCase())
                );
            }
        } catch {}
        return [];
    }

    removeWelcomeBackground(guildId) {
        this.backgrounds.delete(guildId);
        this.saveConfig();
    }

    async sendWelcomeMessage(member) {
        if (!this.isEnabled || !this.welcomeChannelId) return;
        try {
            const channel = member.guild.channels.cache.get(this.welcomeChannelId);
            if (!channel) return;

            const customBackground = this.backgrounds.get(member.guild.id) || null;
            const welcomeMessage = await welcomeCard.createWelcomeMessage(
                member,
                customBackground,
                this.useRandomBackground
            );

            await channel.send(welcomeMessage);
        } catch (error) {
            console.error('Erro ao enviar mensagem de boas-vindas:', error);
        }
    }

    getStatus(guildId = null) {
        const status = {
            isEnabled: this.isEnabled,
            welcomeChannelId: this.welcomeChannelId,
            useRandomBackground: this.useRandomBackground
        };
        if (guildId) {
            status.hasCustomBackground = this.backgrounds.has(guildId);
            status.customBackground = this.backgrounds.get(guildId);
        }
        return status;
    }

    saveConfig() {
        const config = {
            welcomeChannelId: this.welcomeChannelId,
            isEnabled: this.isEnabled,
            useRandomBackground: this.useRandomBackground,
            backgrounds: Array.from(this.backgrounds.entries())
        };
        const configPath = path.join(__dirname, 'welcome-config.json');
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    }

    loadConfig() {
        try {
            const configPath = path.join(__dirname, 'welcome-config.json');
            if (fs.existsSync(configPath)) {
                const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                this.welcomeChannelId = config.welcomeChannelId;
                this.isEnabled = config.isEnabled;
                this.useRandomBackground = config.useRandomBackground || false;
                this.backgrounds = new Map(config.backgrounds || []);
            }
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
        }
    }

    async sendPreview(member, customBackground = null, useRandomBackground = false) {
    try {
        const imageBuffer = await welcomeCard.createWelcomeCard(member, customBackground, useRandomBackground);
        return imageBuffer;
    } catch (error) {
        console.error('Erro ao gerar prévia do cartão:', error);
        throw error;
    }
}
}

module.exports = new WelcomeSystem();
