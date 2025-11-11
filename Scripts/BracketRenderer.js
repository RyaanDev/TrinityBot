const { createCanvas } = require('canvas');

class BracketRenderer {
    async render(bracket) {
        const rounds = bracket.rounds;
        const width = 1300;
        const height = 200 + rounds[0].length * 130;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, width, height);
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'center';

        const boxWidth = 220;
        const boxHeight = 60;
        const hSpacing = 180;
        const vSpacing = 120;

        rounds.forEach((round, rIndex) => {
            round.forEach((match, mIndex) => {
                const baseX = 100 + rIndex * (boxWidth + hSpacing);
                const baseY = 100 + mIndex * vSpacing * Math.pow(2, rIndex);

                match.forEach((player, pIndex) => {
                    const y = baseY + pIndex * (boxHeight + 10);
                    const gradient = ctx.createLinearGradient(baseX, y, baseX + boxWidth, y + boxHeight);
                    gradient.addColorStop(0, '#00bfff');
                    gradient.addColorStop(1, '#0077ff');
                    ctx.fillStyle = gradient;
                    ctx.fillRect(baseX, y, boxWidth, boxHeight);

                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(baseX, y, boxWidth, boxHeight);

                    ctx.fillStyle = '#fff';
                    ctx.fillText(player, baseX + boxWidth / 2, y + boxHeight / 1.7);

                    // Linhas conectando fases
                    if (rIndex < rounds.length - 1 && player !== 'BYE') {
                        const lineStartX = baseX + boxWidth;
                        const lineStartY = y + boxHeight / 2;
                        const lineEndX = lineStartX + hSpacing / 2;
                        const lineEndY = baseY + (vSpacing * Math.pow(2, rIndex)) / 2 + boxHeight / 2;
                        ctx.strokeStyle = '#00bfff';
                        ctx.lineWidth = 3;
                        ctx.beginPath();
                        ctx.moveTo(lineStartX, lineStartY);
                        ctx.lineTo(lineEndX, lineEndY);
                        ctx.stroke();
                    }
                });
            });
        });

        return canvas.toBuffer('image/png');
    }
}

module.exports = new BracketRenderer();
