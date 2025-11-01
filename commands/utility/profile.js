const { SlashCommandBuilder, AttachmentBuilder, GuildMember, userMention, MessageFlags } = require('discord.js');
const { Canvas, loadImage, registerFont } = require('canvas'); 
const ColorThief = require('colorthief');
const axios = require('axios'); 
const db = require('../../database/database');
const path = require('path');
const voiceTracker = require('../../Scripts/VoiceTrack');

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
    if (diffDays < 730 && diffDays > 365) return `${Math.floor(diffDays / 365)} ano`;
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

async function loadLocalIcons() {
    const icons = {};
    const iconNames = ['crown', 'headphone', 'sparkle', 'trophy', 'gear', 'discord'];
    
    for (const iconName of iconNames) {
        try {
            const iconPath = path.resolve(__dirname, '../../icons', `${iconName}.png`);
            icons[iconName] = await loadImage(iconPath);
            console.log(`Ícone ${iconName} carregado com sucesso`);
        } catch (error) {
            console.error(`Erro ao carregar ícone ${iconName}:`, error.message);
            icons[iconName] = null;
        }
    }
    
    return icons;
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
                        .setMaxLength(300)))
                        .addSubcommand(subcommand =>
                                        subcommand
                                            .setName('voice')
                                            .setDescription('Mostra estatísticas de tempo em call'))
                                            .addSubcommand(subcommand =>
                                                            subcommand
                                                                .setName('reset-voice')
                                                                .setDescription('[ADMIN] Reseta o tempo de voz de um usuário')
                                                                .addUserOption(option =>
                                                                    option.setName('usuario')
                                                                        .setDescription('Usuário para resetar o tempo')
                                                                        .setRequired(true))),
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        if (subcommand === 'view') {
            await handleProfileView(interaction);
        } else if (subcommand === 'edit') {
            await handleProfileEdit(interaction);
        }else if (subcommand === 'voice') {
            await handleVoiceStats(interaction);
        }else if (subcommand === 'reset-voice') {
            await handleResetVoice(interaction);
        }
    },
};

//sessão para VoiceTrack

async function handleVoiceStats(interaction) {
    const userId = interaction.user.id;
    const voiceMinutes = voiceTracker.getVoiceTime(userId);
    const voiceHours = Math.floor(voiceMinutes / 60);
    const voiceMinutesRemainder = voiceMinutes % 60;

    let response = `**Estatísticas de Voz**\n`;
    response += `Tempo total em call: ${voiceHours}h ${voiceMinutesRemainder}m\n`;
    response += `Isso equivale a aproximadamente ${Math.floor(voiceHours / 24)} dias!`;

    await interaction.reply({
        content: response,
        flags: MessageFlags.Ephemeral
    });
}

// Função para resetar tempo de voz
async function handleResetVoice(interaction) {
    // Verificar permissões
    if (!interaction.member.permissions.has('ADMINISTRATOR')) {
        return await interaction.reply({
            content: 'Você precisa de permissão de administrador para usar este comando.',
            flags: MessageFlags.Ephemeral
        });
    }

    const targetUser = interaction.options.getUser('usuario');
    let userData = db.read('users', targetUser.id);

    if (userData) {
        userData.totalVoiceTime = 0;
        userData.lastVoiceUpdate = new Date().toISOString();
        db.update('users', targetUser.id, userData);
    }

    await interaction.reply({
        content: `Tempo de voz de ${targetUser.tag} foi resetado.`,
        flags: MessageFlags.Ephemeral
    });
}

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
// Função principal para gerar a imagem do perfil (reutilizável)
async function generateProfileImage(interaction, member) {
    const canvas = new Canvas(1055, 650);
    const ctx = canvas.getContext('2d');
    const userId = member.id;

    // CARREGAR ÍCONES LOCAIS
    const icons = await loadLocalIcons();
    const iconSize = 25;

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
    const prinX = 880;
    const prinY = 530;
    const prinA = 10;
    const prinB = 30;

    // FUNDO PRINCIPAL
    ctx.beginPath();
    ctx.roundRect(prinA, prinB, prinX, prinY, radius);
    ctx.fillStyle = '#1a1a1a';
    ctx.fill();

    // BORDA GRADIENTE PRINCIPAL
    ctx.beginPath();
    const mainGradient = ctx.createLinearGradient(30, 0, 0, 170);
    mainGradient.addColorStop(0, mainStartColor);
    mainGradient.addColorStop(1, mainEndColor);
    ctx.strokeStyle = mainGradient;
    ctx.lineWidth = 6;
    ctx.roundRect(prinA, prinB, prinX, prinY, radius);
    ctx.stroke();

    // ÁREA DE INFORMAÇÕES À DIREITA(A cima)
    const infoX2 = 360;
    const infoY2 = prinB+60;
    const infoWidth2 = prinX-infoX2-10;
    const infoHeight2 = (prinY/2)+40;

    ctx.beginPath();
    ctx.roundRect(infoX2, infoY2, infoWidth2, infoHeight2, radius);
    ctx.fillStyle = '#2a2a2a';
    ctx.fill();
    
    ctx.beginPath();
    const infoGradient2 = createHarmoniousGradient(
        ctx, 
        infoX2, infoY2, 
        infoX2 + infoWidth2, infoY2 + infoHeight2,
        mainStartColor,
        'analogous'
    );
    ctx.strokeStyle = infoGradient2;
    ctx.lineWidth = 4;
    ctx.roundRect(infoX2, infoY2, infoWidth2, infoHeight2, radius);
    ctx.stroke();

    // ÁREA DE INFORMAÇÕES À DIREITA
    const infoX = 360;
    const infoY = infoHeight2+110;
    const infoWidth = prinX-infoX-10;
    const infoHeight = infoY-(prinY/2)-20;

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
    const nameWidth = 460;
    const nameHeight = 50;
    const nameX = (prinX-nameWidth)/2;
    const nameY = 10;

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

    //Variaveis do layout inferior
    const startY = infoY+40;
    const startX = prinX-infoWidth+40;
    const lineHeight = 25;
    const collum = infoWidth/3;
    let currentcollum = 0;
    let currentBtnCollum = 0;
    let currentLine = 0;
    let currentBtnLine = 0;

    //Area para Botões do layout inferior
    ctx.beginPath();
    ctx.fillStyle =infoGradient;
    ctx.roundRect(startX-5+(collum*currentBtnCollum),startY-20+(lineHeight*2*currentBtnLine++), 100,40,7);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle =infoGradient;
    ctx.roundRect(startX-5+(collum*currentBtnCollum++),startY-20+(lineHeight*2*currentBtnLine--), 100,40,7);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle =infoGradient;
    ctx.roundRect(startX-5+(collum*currentBtnCollum),startY-20+(lineHeight*2*currentBtnLine++), 100,40,7);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle =infoGradient;
    ctx.roundRect(startX-5+(collum*currentBtnCollum++),startY-20+(lineHeight*2*currentBtnLine--), 100,40,7);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle =infoGradient;
    ctx.roundRect(startX-5+(collum*currentBtnCollum),startY-20+(lineHeight*2*currentBtnLine++), 100,40,7);
    ctx.fill();

    if (member.id === interaction.user.id) {
        ctx.beginPath();
        ctx.fillStyle =infoGradient;
        ctx.roundRect(startX-5+(collum*currentBtnCollum++),startY-20+(lineHeight*2*currentBtnLine--), 100,40,7);
        ctx.fill();
    }

    // Texto do nome
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 25px "Lucida Console", "Arial Unicode MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(member.displayName, nameX + nameWidth/2, nameY + nameHeight/2);

    // MÁSCARA PARA A FOTO DE PERFIL
    ctx.save();
    const avatarRectX = ((prinX-infoWidth)-avatarRectSize)/2;
    const avatarRectY = prinB+60;
    const raioavatar = avatarRectSize/2;
    const avatarRadius = Math.PI*2;

    ctx.beginPath();
    ctx.arc(avatarRectX+raioavatar, avatarRectY+raioavatar, raioavatar,0, avatarRadius, true);
    ctx.clip();
    ctx.drawImage(avatar, avatarRectX, avatarRectY, avatarRectSize, avatarRectSize);
    ctx.restore();

    //caixas de descrição
    const descSizeX1= 130;
    const descSizeX2= 100;
    const deszSizeY = 27;
    ctx.beginPath();
    ctx.roundRect(infoX2+20, infoY2-(deszSizeY/2), descSizeX1, deszSizeY, 7);
    ctx.fillStyle = '#2a2a2a';
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(infoX2+20, infoY2-(deszSizeY/2), descSizeX1, deszSizeY, 7);
    ctx.lineWidth =3;
    ctx.strokeStyle = infoGradient;
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px bold "Lucida Console", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("Sobre mim",infoX2+20+(descSizeX1/2), infoY2, descSizeX1, deszSizeY);
    

    //caixa de baixo

    ctx.beginPath();
    ctx.roundRect(infoX+20, infoY-(deszSizeY/2), descSizeX2, deszSizeY, 7);
    ctx.fillStyle = '#2a2a2a';
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(infoX+20, infoY-(deszSizeY/2), descSizeX2, deszSizeY, 7);
    ctx.lineWidth =3;
    ctx.strokeStyle = infoGradient;
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px bold "Lucida Console", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("Status",infoX+20+(descSizeX2/2), infoY, descSizeX2, deszSizeY);
    

    //borda da foto

    ctx.beginPath();
    ctx.arc(avatarRectX+raioavatar, avatarRectY+raioavatar, raioavatar,0, avatarRadius, true);
    ctx.lineWidth = 5;
    ctx.strokeStyle = mainGradient;
    ctx.stroke();

    // INFORMAÇÕES DO PERFIL (DIREITA)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '18px bold "Lucida Console", sans-serif';
    ctx.textAlign = 'left';
    
    

     // Tempo no Discord 
    if (icons.crown) {
        ctx.drawImage(icons.discord, startX - iconSize -15, startY + (lineHeight * 2 * currentLine) - iconSize/2, iconSize, iconSize);
    }
    const discordTime = getDiscordTime(userData.discordJoinDate);
    ctx.fillText(`${discordTime}`, startX, startY + (lineHeight * 2 * currentLine++));

    // Cargo principal
    if (icons.crown) {
        ctx.drawImage(icons.crown, startX + (collum * currentcollum) - iconSize - 15, startY + (lineHeight * 2 * currentLine) - iconSize/2, iconSize, iconSize);
    }
    const mainRole = userData.roles.length > 0 ? userData.roles[0] : 'Membro';
    ctx.fillText(`${mainRole}`, startX + (collum * currentcollum++), startY + (lineHeight * 2 * currentLine--));

    // Tempo em chamadas (horas)
    if (icons.headphone) {
        ctx.drawImage(icons.headphone, startX + (collum * currentcollum) - iconSize - 15, startY + (lineHeight * 2 * currentLine) - iconSize/2, iconSize, iconSize);
    }
    const voiceMinutes = voiceTracker.getVoiceTime(userId);
    const voiceHours = Math.floor(voiceMinutes / 60);
    const voiceMinutesRemainder = voiceMinutes % 60;
    ctx.fillText(`${voiceHours}h ${voiceMinutesRemainder}m`, startX + (collum * currentcollum), startY + (lineHeight * 2 * currentLine++));

    // Eventos participados
    if (icons.sparkle) {
        ctx.drawImage(icons.sparkle, startX + (collum * currentcollum) - iconSize - 15, startY + (lineHeight * 2 * currentLine) - iconSize/2, iconSize, iconSize);
    }
    ctx.fillText(`${userData.eventsParticipated || 0}`, startX + (collum * currentcollum++), startY + (lineHeight * 2 * currentLine--));

    // Vitórias
    if (icons.trophy) {
        ctx.drawImage(icons.trophy, startX + (collum * currentcollum) - iconSize - 15, startY + (lineHeight * 2 * currentLine) - iconSize/2, iconSize, iconSize);
    }
    ctx.fillText(`${userData.eventsWon || 0}`, startX + (collum * currentcollum), startY + (lineHeight * 2 * currentLine++));

    // Comandos usados (só mostra se for o próprio usuário)
    if (member.id === interaction.user.id) {
        if (icons.gear) {
            ctx.drawImage(icons.gear, startX + (collum * currentcollum) - iconSize - 15, startY + (lineHeight * 2 * currentLine) - iconSize/2, iconSize, iconSize);
        }
        ctx.fillText(`${userData.commandCount || 0}`, startX + (collum * currentcollum++), startY + (lineHeight * 2 * currentLine--));
    }

    const PerfilTitle = userData.totalVoiceTime;
    ctx.font = '35px bold Lucida Console, sans-serif'
    switch (PerfilTitle){
        case 0:
           // ctx.fillText('Novato',avatarRectX+avatarRectX,avatarRectY*3+10);
            break;
        case 1:
            //ctx.fillText('Aprendiz',avatarRectX+avatarRectX,avatarRectY*3+10);
            break;
    }

    //Função de Warp para o texto
    function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const lines = [];
    const paragraphs = text.split('\n');
    
    for (const paragraph of paragraphs) {
        const words = paragraph.split(' ');
        let currentLine = words[0];
        
        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + ' ' + word).width;
            
            if (width < maxWidth) {
                currentLine += ' ' + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
    }
    
    // Desenhar todas as linhas
    let currentY = y;
    for (const line of lines) {
        // Verificar se ainda cabe na área
        if (currentY < infoY2 + infoHeight2 - 20) {
            ctx.fillText(line, x, currentY);
            currentY += lineHeight;
        } else {
            break; // Para de desenhar se não couber mais
        }
    }
    
    return currentY;
}

    // Sobre (se existir)
    if (userData.about && userData.about.length > 0) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '19px bold "Lucida Console", sans-serif';
        ctx.textAlign = 'left';
        wrapText(ctx,userData.about,infoX2+10,infoY2+30,infoWidth2-20,25);
    }

    // Aniversário (se existir)
    if (userData.birthday) {
       /* const typeX = prinX-infoX+(infoX/2);
        const typeY = prinY-14;
        ctx.beginPath();
        ctx.roundRect(typeX,typeY,60,20,3);
        ctx.fillStyle = "#FFD700";
        ctx.fill();*/
        //ctx.clip()
        //ctx.fillText(`${userData.birthday}`, typeX, typeY);
        //ctx.fillStyle = "#f2f5f7";
        
    }

    // Jogo favorito (se existir)
    if (userData.favoriteGame) {
        //ctx.fillText(`Favorito: ${userData.favoriteGame}`, startX, startY + (lineHeight * currentLine++));
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