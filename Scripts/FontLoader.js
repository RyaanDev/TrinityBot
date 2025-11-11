const { registerFont } = require('canvas');
const path = require('path');
const fs = require('fs');

class FontLoader {
    constructor() {
        this.fontsDir = path.join(__dirname, 'fonts');
        this.registered = false;
    }

    register() {
        if (this.registered) return;

        try {
            // Tenta carregar uma fonte customizada da pasta /fonts, se existir
            if (fs.existsSync(this.fontsDir)) {
                const fonts = fs.readdirSync(this.fontsDir);
                const customFont = fonts.find(f => /\.(ttf|otf)$/i.test(f));
                if (customFont) {
                    registerFont(path.join(this.fontsDir, customFont), { family: 'CustomFont' });
                    console.log(`Fonte personalizada registrada: ${customFont}`);
                    this.registered = true;
                    return;
                }
            }

            // Se não encontrar nada, usa Arial genérica do sistema (não precisa de arquivo)
            console.log('Nenhuma fonte personalizada encontrada. Usando Arial padrão do sistema.');
            this.registered = true;

        } catch (err) {
            console.log('Erro ao registrar fonte (usando padrão do sistema):', err);
        }
    }
}

module.exports = new FontLoader();
