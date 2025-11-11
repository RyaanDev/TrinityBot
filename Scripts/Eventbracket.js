const db = require('../database/database');

class EventBracket {
    createBracket(participantes, hasLower) {
        if (participantes.length < 2) throw new Error('Poucos participantes.');

        // Garante número par, adiciona "BYE" se ímpar
        if (participantes.length % 2 !== 0) participantes.push('BYE');

        const rounds = [];
        let currentRound = [];

        for (let i = 0; i < participantes.length; i += 2) {
            currentRound.push([participantes[i], participantes[i + 1]]);
        }

        rounds.push(currentRound);
        db.upsert('bracket', 'current', { rounds, hasLower, lower: [], winners: [] });
        return rounds;
    }

    advanceWinner(winner, loser) {
        const bracket = db.read('bracket', 'current');
        if (!bracket) return null;

        bracket.winners.push(winner);

        if (bracket.hasLower) bracket.lower.push(loser);

        db.update('bracket', 'current', bracket);
        return bracket;
    }
}

module.exports = new EventBracket();
