const fs = require('fs');
const path = require('path');

class EventManager {
    constructor() {
        this.file = path.join(process.cwd(), 'database', 'events.json');
        if (!fs.existsSync(this.file)) fs.writeFileSync(this.file, JSON.stringify({}));
    }

    load() {
        return JSON.parse(fs.readFileSync(this.file));
    }

    save(data) {
        fs.writeFileSync(this.file, JSON.stringify(data, null, 2));
    }

    updateMatch(winner, loser) {
        const db = this.load();
        const currentEvent = db.current || {};

        if (currentEvent.hasLower) {
            currentEvent.lower = currentEvent.lower || [];
            currentEvent.lower.push(loser);
        } else {
            currentEvent.eliminated = currentEvent.eliminated || [];
            currentEvent.eliminated.push(loser);
        }

        this.save(db);
        return `${winner} avança! ${loser} foi ${currentEvent.hasLower ? 'rebaixado para a lower bracket' : 'eliminado'}.`;
    }
}

module.exports = new EventManager();