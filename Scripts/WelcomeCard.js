const { createCanvas, loadImage } = require('canvas');
const path = require('path');
const fs = require('fs');
const fontLoader = require('./FontLoader');

class WelcomeCard {
    constructor() {
        this.backgroundsDir = path.join(process.cwd(), 'imgs');
        fontLoader.register();

        if (!fs.existsSync(this.backgroundsDir)) {
            fs.mkdirSync(this.backgroundsDir, { recursive: true });
        }
    }

    getAvailableBackgrounds() {
        try {
            const files = fs.readdirSync(this.backgroundsDir);
            return files.filter(file =>
                ['.jpg', '.jpeg', '.png', '.webp'].includes(path.extname(file).toLowerCase())
            );
        } catch {
            return [];
        }
    }

    getRandomBackground() {
        const list = this.getAvailableBackgrounds();
        if (list.length === 0) return null;
        const random = list[Math.floor(Math.random() * list.length)];
        return path.join(this.backgroundsDir, random);
    }

    sanitizeText(text) {
        return text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();
    }

    async createWelcomeCard(member, customBackground = null, useRandomBackground = false) {
        const width = 1000;
        const height = 300;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // === Fundo quadrado real ===
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, width, height);
        ctx.clip();
        ctx.fillStyle = '#2f3136';
        ctx.fillRect(0, 0, width, height);

        let backgroundPath = null;
        if (useRandomBackground) backgroundPath = this.getRandomBackground();
        else if (customBackground) backgroundPath = customBackground;

        if (backgroundPath && fs.existsSync(backgroundPath)) {
            const bg = await loadImage(backgroundPath);
            ctx.drawImage(bg, 0, 0, width, height);
        }
        ctx.restore();


        let avatar = null;
        try {
            avatar = await loadImage(member.user.displayAvatarURL({ extension: 'png', size: 256 }));
        } catch (error) {
            console.log('Erro ao carregar avatar:', error);
        }

        const avatarX = 130;
        const avatarY = height / 2;
        const avatarSize = 150;

        if (avatar) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(
                avatar,
                avatarX - avatarSize / 2,
                avatarY - avatarSize / 2,
                avatarSize,
                avatarSize
            );
            ctx.restore();

            ctx.strokeStyle = '#202225';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(avatarX, avatarY, avatarSize / 2 + 2, 0, Math.PI * 2);
            ctx.stroke();
        }

        async function getMemberPosition(guild, memberId) {
            const members = await guild.members.fetch();
            const sorted = members.sort((a, b) => a.joinedTimestamp - b.joinedTimestamp);
            const index = Array.from(sorted.keys()).indexOf(memberId);
            return index + 1;
        }

        const username = this.sanitizeText(member.user.globalName || member.user.username);
        const displayName = username.length > 22 ? username.slice(0, 22) + '...' : username;
        const memberCount = member.guild.memberCount;
        const memberPosition = await getMemberPosition(member.guild, member.id);

        const textStartX = 320;
        const textCenterY = height / 2;

        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 6;

        // Linha 1 — título
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 40px Arial';
        ctx.fillText('BEM-VINDO(A) AO SERVIDOR', textStartX, textCenterY - 50);

        // Linha 2 — nome
        ctx.font = 'bold 56px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(displayName, textStartX, textCenterY + 5);

        // Linha 3 — membro
        ctx.fillStyle = '#ff3366';
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Membro #${memberPosition}`, textStartX, textCenterY + 55);


        ctx.restore();
        ctx.beginPath();
        ctx.rect(0, 0, width, height);
        ctx.clip();

        return canvas.toBuffer('image/png');
    }

    async createWelcomeMessage(member, customBackground = null, useRandomBackground = false) {
        try {
            const buffer = await this.createWelcomeCard(member, customBackground, useRandomBackground);
            return {
                content: `**${this.sanitizeText(member.user.globalName || member.user.username)}** entrou no servidor!`,
                files: [{ attachment: buffer, name: 'welcome.png' }]
            };
        } catch (err) {
            console.error('Erro ao criar cartão:', err);
            return {
                content: `**${this.sanitizeText(member.user.globalName || member.user.username)}** entrou no servidor!`
            };
        }
    }
}

module.exports = new WelcomeCard();
