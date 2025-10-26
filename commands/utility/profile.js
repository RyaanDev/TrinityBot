const { SlashCommandBuilder, AttachmentBuilder, GuildMember, userMention, MessageFlags } = require('discord.js');
const { Canvas, loadImage, registerFont } = require('canvas'); 
const ColorThief = require('colorthief');
const axios = require('axios'); 
const db = require('../../database/database');
const path = require('path');

registerFont(path.resolve(__dirname, '../../fonts', 'GothTitan-0W5md.ttf'), { family: 'Goth Titan' });

// Função para RGB para HEX 
function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

function hexToRgb(hex) {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return [r, g, b];
}

// Função para calcular cor complementar
function getComplementaryColor(hexColor) {
    // Remove o # se presente
    hexColor = hexColor.replace('#', '');
    
    // Converte para RGB
    const r = parseInt(hexColor.substr(0, 2), 16);
    const g = parseInt(hexColor.substr(2, 2), 16);
    const b = parseInt(hexColor.substr(4, 2), 16);
    
    // Calcula o complemento
    const compR = (255 - r).toString(16).padStart(2, '0');
    const compG = (255 - g).toString(16).padStart(2, '0');
    const compB = (255 - b).toString(16).padStart(2, '0');
    
    return `#${compR}${compG}${compB}`;
}

//função para satarução

function getSaturation(r,g,b){
    const max = Math.max(r,g,b);
    const min = Math.min(r,g,b);
    if(max === 0 ) return 0;
    return(max - min)/max*100;
}

//função para verificar  o brilho

function getBrightness(r, g, b) {
    return (r * 299 + g * 587 + b * 114) / 1000;
}

//calculo de intesidade

function getColorIntensity(r,g,b){
    const saturation = getSaturation(r,g,b);
    const brightness = getBrightness(r,g,b);

    return saturation * 0.7+brightness*0.3;
}

function findContrastingIntenseColors(colors) {
    if (colors.length < 2) return [colors[0], colors[0]];
    
    let bestContrast = 0;
    let colorPair = [colors[0], colors[1]];
    
    // Filtrar apenas cores intensas (com boa saturação)
    const intenseColors = colors.filter(color => {
        const [r, g, b] = color;
        return getSaturation(r, g, b) > 30 && getBrightness(r, g, b) > 30;
    });
    
    // Se não encontrou cores intensas suficientes, usar todas
    const colorsToUse = intenseColors.length >= 2 ? intenseColors : colors;
    
    // Encontrar o par de cores com maior contraste entre as intensas
    for (let i = 0; i < colorsToUse.length; i++) {
        for (let j = i + 1; j < colorsToUse.length; j++) {
            const color1 = colorsToUse[i];
            const color2 = colorsToUse[j];
            
            const brightness1 = getBrightness(color1[0], color1[1], color1[2]);
            const brightness2 = getBrightness(color2[0], color2[1], color2[2]);
            
            // Calcular intensidade de ambas as cores
            const intensity1 = getColorIntensity(color1[0], color1[1], color1[2]);
            const intensity2 = getColorIntensity(color2[0], color2[1], color2[2]);
            
            // Contraste baseado na diferença de brilho e intensidade
            const brightnessContrast = Math.abs(brightness1 - brightness2);
            const intensityScore = (intensity1 + intensity2) / 2;
            
            // Combinar contraste de brilho com intensidade das cores
            const totalContrast = brightnessContrast * 0.6 + intensityScore * 0.4;
            
            if (totalContrast > bestContrast) {
                bestContrast = totalContrast;
                // Garantir que a cor mais clara venha primeiro no gradiente
                if (brightness1 > brightness2) {
                    colorPair = [color1, color2];
                } else {
                    colorPair = [color2, color1];
                }
            }
        }
    }
    
    return colorPair;
}

// Função para criar cores análogas (cores que combinam harmonicamente)
function createAnalogousColors(baseColor, count = 2) {
    const [r, g, b] = baseColor;
    
    // Converter RGB para HSL para manipulação harmônica
    let h, s, l;
    [h, s, l] = rgbToHsl(r, g, b);
    
    const analogousColors = [];
    
    // Criar cores análogas (30 graus de diferença no círculo cromático)
    for (let i = 0; i < count; i++) {
        const hue = (h + (i * 30)) % 360;
        const [newR, newG, newB] = hslToRgb(hue, s, l);
        analogousColors.push([newR, newG, newB]);
    }
    
    return analogousColors;
}

// Função para criar cores triádicas (combinação equilibrada)
function createTriadicColors(baseColor) {
    const [r, g, b] = baseColor;
    let [h, s, l] = rgbToHsl(r, g, b);
    
    const triadicColors = [];
    
    // Cores triádicas (120 graus de diferença)
    for (let i = 0; i < 3; i++) {
        const hue = (h + (i * 120)) % 360;
        const [newR, newG, newB] = hslToRgb(hue, s, l);
        triadicColors.push([newR, newG, newB]);
    }
    
    return triadicColors;
}

// Função para criar cores complementares divididas (mais harmônicas)
function createSplitComplementaryColors(baseColor) {
    const [r, g, b] = baseColor;
    let [h, s, l] = rgbToHsl(r, g, b);
    
    const splitColors = [];
    
    // Cores complementares divididas (150 e 210 graus)
    const hues = [(h + 150) % 360, (h + 210) % 360];
    
    for (const hue of hues) {
        const [newR, newG, newB] = hslToRgb(hue, s, l);
        splitColors.push([newR, newG, newB]);
    }
    
    return splitColors;
}

// Funções de conversão RGB para HSL e vice-versa
function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h * 360, s * 100, l * 100];
}

function hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;

    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// Função para gerar gradiente harmonioso (usa cores que combinam)
function createHarmoniousGradient(ctx, x1, y1, x2, y2, baseColor, type = 'analogous') {
    let harmoniousColors;
    
    switch (type) {
        case 'triadic':
            harmoniousColors = createTriadicColors(hexToRgb(baseColor));
            break;
        case 'split':
            harmoniousColors = createSplitComplementaryColors(hexToRgb(baseColor));
            break;
        case 'analogous':
        default:
            harmoniousColors = createAnalogousColors(hexToRgb(baseColor), 2);
            break;
    }
    
    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    
    // Usar as cores harmoniosas para o gradiente
    if (harmoniousColors.length >= 2) {
        const [color1, color2] = harmoniousColors;
        gradient.addColorStop(0, rgbToHex(color1[0], color1[1], color1[2]));
        gradient.addColorStop(1, rgbToHex(color2[0], color2[1], color2[2]));
    } else {
        // Fallback: usar cores complementares
        const compColor = getComplementaryColor(baseColor);
        gradient.addColorStop(0, baseColor);
        gradient.addColorStop(1, compColor);
    }
    
    return gradient;
}

async function getImageBuffer(url) {
    try {
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'arraybuffer'
        });
        return Buffer.from(response.data);
    } catch (error) {
        throw new Error(`Erro ao baixar imagem: ${error.message}`);
    }
}

// Função para calcular tempo no Discord
function getDiscordTime(createdAt) {
    const now = new Date();
    const created = new Date(createdAt);
    const diffTime = Math.abs(now - created);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} dias`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses`;
    return `${Math.floor(diffDays / 365)} anos`;
}

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
        totalVoiceTime: 0, // em minutos
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

// Função para carregar badges
async function loadBadges(badgeNames) {
    const badges = [];
    const badgeSize = 30;
    
    for (const badgeName of badgeNames) {
        try {
            const badgePath = path.resolve(__dirname, '../../badges', `${badgeName}.png`);
            const badgeImage = await loadImage(badgePath);
            badges.push({ image: badgeImage, name: badgeName });
        } catch (error) {
            console.log(`Badge ${badgeName} não encontrada`);
        }
    }
    
    return badges;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Comando de perfil do usuário')
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('Visualiza o perfil de um usuário')
                .addUserOption(option =>
                    option.setName('usuario')
                        .setDescription('Usuário para ver o perfil')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Edita informações do seu perfil')
                .addStringOption(option =>
                    option.setName('campo')
                        .setDescription('Campo que deseja editar')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Sobre mim', value: 'about' },
                            { name: 'Aniversário', value: 'birthday' },
                            { name: 'Jogo favorito', value: 'favoriteGame' }
                        ))
                .addStringOption(option =>
                    option.setName('valor')
                        .setDescription('Novo valor para o campo')
                        .setRequired(true)
                        .setMaxLength(100))),
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        if (subcommand === 'view') {
            await handleProfileView(interaction);
        } else if (subcommand === 'edit') {
            await handleProfileEdit(interaction);
        }
    },
};

// Função para visualizar perfil (próprio ou de outro usuário)
async function handleProfileView(interaction) {
    await interaction.deferReply({ flags: MessageFlags.None });

    let targetMember;
    const userOption = interaction.options.getUser('usuario');
    
    if (userOption) {
        // Ver perfil de outro usuário
        targetMember = await interaction.guild.members.fetch(userOption.id).catch(() => null);
        if (!targetMember) {
            return await interaction.editReply({
                content: 'Usuário não encontrado neste servidor!'
            });
        }
    } else {
        // Ver próprio perfil
        targetMember = interaction.member;
    }

    await generateProfileImage(interaction, targetMember);
}

// Função para editar perfil
async function handleProfileEdit(interaction) {
    const campo = interaction.options.getString('campo');
    const valor = interaction.options.getString('valor');
    const userId = interaction.user.id;

    // Verificar se o usuário existe no banco de dados
    let userData = db.read('users', userId);
    
    if (!userData) {
        // Se não existir, criar perfil básico
        userData = formatUserData(interaction.member);
        db.create('users', userId, userData);
    }

    // Validar e atualizar o campo específico
    let mensagemSucesso = '';
    
    switch (campo) {
        case 'about':
            userData.about = valor;
            mensagemSucesso = 'Seu "Sobre mim" foi atualizado com sucesso!';
            break;
            
        case 'birthday':
            // Validação simples de formato de data (DD/MM)
            const birthdayRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])$/;
            if (!birthdayRegex.test(valor)) {
                return await interaction.reply({
                    content: 'Formato de data inválido! Use DD/MM (ex: 15/08 para 15 de agosto)',
                    flags: MessageFlags.Ephemeral
                });
            }
            userData.birthday = valor;
            mensagemSucesso = 'Seu aniversário foi atualizado com sucesso!';
            break;
            
        case 'favoriteGame':
            userData.favoriteGame = valor;
            mensagemSucesso = 'Seu jogo favorito foi atualizado com sucesso!';
            break;
    }

    // Atualizar no banco de dados
    db.update('users', userId, userData);

    await interaction.reply({
        content: `${mensagemSucesso}\nUse \`/profile view\` para ver as mudanças.`,
        flags: MessageFlags.Ephemeral
    });
}

// Função principal para gerar a imagem do perfil (reutilizável)
async function generateProfileImage(interaction, member) {
    const canvas = new Canvas(700, 400);
    const ctx = canvas.getContext('2d');
    const userId = member.id;

    // Gerenciar dados do usuário no banco de dados
    let userData = db.read('users', userId);

    if (!userData) {
        userData = formatUserData(member);
        db.create('users', userId, userData);
    } else {
        // Atualizar dados automáticos apenas se for o próprio usuário
        if (member.id === interaction.user.id) {
            const updatedData = {
                roles: member.roles.cache.map(role => role.name).filter(name => name !== '@everyone'),
                commandCount: (userData.commandCount || 0) + 1,
                updatedAt: new Date().toISOString()
            };
            userData = db.update('users', userId, updatedData);
        } else {
            // Para outros usuários, apenas atualizar roles se necessário
            const updatedData = {
                roles: member.roles.cache.map(role => role.name).filter(name => name !== '@everyone'),
                updatedAt: new Date().toISOString()
            };
            userData = db.update('users', userId, updatedData);
        }
    }

    const avatarUrl = member.user.displayAvatarURL({ 
        extension: 'png',
        size: 256,
        forceStatic: true
    });

    // Carregar avatar para Canvas
    const avatar = await loadImage(avatarUrl);
    
    let dominantColors;
    try {
        const imageBuffer = await getImageBuffer(avatarUrl);
        dominantColors = await ColorThief.getPalette(imageBuffer, 8);
    } catch (error) {
        console.error('Erro ao extrair cores:', error);
        dominantColors = [[255, 0, 0], [0, 255, 0]];
    }

    // Encontrar cores contrastantes intensas para a borda principal
    const contrastingColors = findContrastingIntenseColors(dominantColors);
    const mainStartColor = rgbToHex(contrastingColors[0][0], contrastingColors[0][1], contrastingColors[0][2]);
    const mainEndColor = rgbToHex(contrastingColors[1][0], contrastingColors[1][1], contrastingColors[1][2]);

    // Desenhar elementos na imagem
    const radius = 20;
    const avatarRectSize = 300;

    // FUNDO PRINCIPAL
    ctx.beginPath();
    ctx.roundRect(10, 10, 680, 380, radius);
    ctx.fillStyle = '#1a1a1a';
    ctx.fill();

    // BORDA GRADIENTE PRINCIPAL
    ctx.beginPath();
    const mainGradient = ctx.createLinearGradient(0, 0, 0, 170);
    mainGradient.addColorStop(0, mainStartColor);
    mainGradient.addColorStop(1, mainEndColor);
    ctx.strokeStyle = mainGradient;
    ctx.lineWidth = 6;
    ctx.roundRect(10, 10, 680, 380, radius);
    ctx.stroke();

    // ÁREA DE INFORMAÇÕES À DIREITA
    const infoX = 340;
    const infoY = 20;
    const infoWidth = 340;
    const infoHeight = 360;

    ctx.beginPath();
    ctx.roundRect(infoX, infoY, infoWidth, infoHeight, radius);
    ctx.fillStyle = '#2a2a2a';
    ctx.fill();
    
    ctx.beginPath();
    const infoGradient = createHarmoniousGradient(
        ctx, 
        infoX, infoY, 
        infoX + infoWidth, infoY + infoHeight,
        mainStartColor,
        'analogous'
    );
    ctx.strokeStyle = infoGradient;
    ctx.lineWidth = 4;
    ctx.roundRect(infoX, infoY, infoWidth, infoHeight, radius);
    ctx.stroke();

    // ÁREA DO NOME DO USUÁRIO
    const nameX = 20;
    const nameY = 330;
    const nameWidth = 303;
    const nameHeight = 50;

    // Fundo do nome
    ctx.beginPath();
    ctx.roundRect(nameX, nameY, nameWidth, nameHeight, radius);
    ctx.fillStyle = '#2a2a2a';
    ctx.fill();

    // Borda do nome
    ctx.beginPath();
    const nameGradient = createHarmoniousGradient(
        ctx,
        nameX, nameY,
        nameX + nameWidth, nameY + nameHeight,
        mainEndColor,
        'triadic'
    );
    ctx.strokeStyle = nameGradient;
    ctx.lineWidth = 3;
    ctx.roundRect(nameX, nameY, nameWidth, nameHeight, radius);
    ctx.stroke();

    // Texto do nome
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 25px "Lucida Console", "Arial Unicode MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(member.displayName, nameX + nameWidth/2, nameY + nameHeight/2);

    // 5. MÁSCARA PARA A FOTO DE PERFIL
    ctx.save();
    const avatarRectX = 20;
    const avatarRectY = 20;
    const avatarRadius = 20;

    ctx.beginPath();
    ctx.roundRect(avatarRectX, avatarRectY, avatarRectSize, avatarRectSize, avatarRadius);
    ctx.clip();
    ctx.drawImage(avatar, avatarRectX, avatarRectY, avatarRectSize, avatarRectSize);
    ctx.restore();

    // INFORMAÇÕES DO PERFIL (DIREITA)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '14px "Lucida Console", sans-serif';
    ctx.textAlign = 'left';
    
    const startY = 50;
    const lineHeight = 25;
    let currentLine = 0;

    // Tempo no Discord
    const discordTime = getDiscordTime(userData.discordJoinDate);
    ctx.fillText(`Discord: ${discordTime}`, infoX + 20, startY + (lineHeight * currentLine++));

    // Cargo principal
    const mainRole = userData.roles.length > 0 ? userData.roles[0] : 'Membro';
    ctx.fillText(`Cargo: ${mainRole}`, infoX + 20, startY + (lineHeight * currentLine++));

    // Jogo favorito (se existir)
    if (userData.favoriteGame) {
        ctx.fillText(`Favorito: ${userData.favoriteGame}`, infoX + 20, startY + (lineHeight * currentLine++));
    }

    // Tempo em chamadas (horas)
    const voiceHours = Math.floor((userData.totalVoiceTime || 0) / 60);
    ctx.fillText(`Chamadas: ${voiceHours}h`, infoX + 20, startY + (lineHeight * currentLine++));

    // Eventos participados
    ctx.fillText(`Eventos: ${userData.eventsParticipated || 0}`, infoX + 20, startY + (lineHeight * currentLine++));

    // Vitórias
    ctx.fillText(`Vitórias: ${userData.eventsWon || 0}`, infoX + 20, startY + (lineHeight * currentLine++));

    // Comandos usados (só mostra se for o próprio usuário)
    if (member.id === interaction.user.id) {
        ctx.fillText(`Comandos: ${userData.commandCount || 0}`, infoX + 20, startY + (lineHeight * currentLine++));
    }

    // Sobre (se existir)
    if (userData.about && userData.about.length > 0) {
        ctx.fillText(`${userData.about.substring(0, 30)}...`, infoX + 20, startY + (lineHeight * currentLine++));
    }

    // Aniversário (se existir)
    if (userData.birthday) {
        ctx.fillText(`${userData.birthday}`, infoX + 20, startY + (lineHeight * currentLine++));
    }

    // Badges (carregar e desenhar)
    if (userData.badges && userData.badges.length > 0) {
        const badges = await loadBadges(userData.badges);
        const badgeStartX = infoX + 20;
        const badgeStartY = startY + (lineHeight * currentLine) + 5;
        const badgeSpacing = 35;
        
        badges.forEach((badge, index) => {
            const x = badgeStartX + (index * badgeSpacing);
            ctx.drawImage(badge.image, x, badgeStartY, 30, 30);
        });
    }



    // Converter o canvas para buffer e enviar
    const buffer = canvas.toBuffer('image/png');
    const attachment = new AttachmentBuilder(buffer, { name: 'profile.png' });

    await interaction.editReply({ 
        files: [attachment] 
    });
}