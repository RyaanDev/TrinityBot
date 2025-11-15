const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class EventBracket {
    constructor() {
        this.scriptPath = path.join(__dirname, 'BracketTool.py');
    }

    async executePython(method, ...args) {
        return new Promise((resolve, reject) => {
            // Converte valores JavaScript para literais Python/JSON compatíveis
            const pythonArgs = args.map(arg => {
                if (arg === false) return 'False';
                if (arg === true) return 'True';
                if (arg === null) return 'None';
                if (Array.isArray(arg)) return JSON.stringify(arg);
                if (typeof arg === 'object') return JSON.stringify(arg);
                if (typeof arg === 'string') return JSON.stringify(arg);
                return String(arg);
            }).join(', ');

            // Script temporário que será executado pelo Python
            const tempScript = `
import sys
import os
import json

# Garante que o diretório do script atual esteja no path
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(script_dir)

try:
    from BracketTool import bracket_manager
    result = bracket_manager.${method}(${pythonArgs})
    # Em alguns casos result pode ser None -> imprimimos JSON null/None corretamente
    print("SUCCESS:" + json.dumps(result))
except Exception as e:
    # Imprime ERROR: + mensagem para o Node tratar
    print("ERROR:" + str(e))
`;

            const tempScriptPath = path.join(__dirname, 'temp_script.py');
            try {
                fs.writeFileSync(tempScriptPath, tempScript);
            } catch (err) {
                return reject(new Error('Falha ao criar script temporário: ' + err.message));
            }

            // Spawn do processo python
            const pythonCmd = 'python'; // altere para 'python3' se necessário no seu SO
            const pythonProcess = spawn(pythonCmd, [tempScriptPath], { windowsHide: true });

            let output = '';
            let errorOut = '';

            pythonProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                errorOut += data.toString();
            });

            pythonProcess.on('close', (code) => {
                // limpa arquivo temporário
                try { fs.unlinkSync(tempScriptPath); } catch (e) {}

                // Se houver erro no stderr e exit code não for zero, rejeitamos com o stderr
                if (code !== 0 && errorOut) {
                    return reject(new Error(`Python returned exit code ${code}: ${errorOut}`));
                }

                // Procura a linha SUCCESS:
                const lines = output.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
                const successLine = lines.find(line => line.startsWith('SUCCESS:'));
                const errorLine = lines.find(line => line.startsWith('ERROR:'));

                if (successLine) {
                    try {
                        const jsonStr = successLine.substring(8);
                        // json.loads("null") -> None em Python, aqui parse no JS:
                        const result = JSON.parse(jsonStr);
                        return resolve(result);
                    } catch (e) {
                        return reject(new Error(`Falha ao parsear JSON do Python: ${e.message}. Saída: ${output}`));
                    }
                } else if (errorLine) {
                    return reject(new Error(errorLine.substring(6)));
                } else {
                    // fallback: sem SUCCESS nem ERROR
                    return reject(new Error(`Saída inesperada do Python: ${output || errorOut}`));
                }
            });
        });
    }

    async createBracket(participants, hasLower = false, isTeamBracket = false) {
        try {
            const result = await this.executePython('create_bracket', participants, hasLower, isTeamBracket);
            return result;
        } catch (error) {
            console.error('Python createBracket error:', error);
            throw error;
        }
    }

    async advanceWinner(winner, loser) {
        try {
            const result = await this.executePython('advance_winner', winner, loser);
            return result;
        } catch (error) {
            console.error('Python advanceWinner error:', error);
            throw error;
        }
    }

    async getCurrentMatchups() {
        try {
            const result = await this.executePython('get_current_matchups');
            return result;
        } catch (error) {
            console.error('Python getCurrentMatchups error:', error);
            return null;
        }
    }

    async getCurrentBracket() {
        try {
            const result = await this.executePython('get_current_bracket');
            return result;
        } catch (error) {
            console.error('Python getCurrentBracket error:', error);
            return null;
        }
    }

    async resetBracket() {
        try {
            const result = await this.executePython('reset_bracket');
            return result;
        } catch (error) {
            console.error('Python resetBracket error:', error);
            return false;
        }
    }

    // Métodos locais para times (Node side)
    getAllTeams() {
        const db = require('../database/database');
        const times = db.readAll('times');
        return Object.values(times || {}).filter(time => time && time.status === 'ativo');
    }

    getTeamByName(teamName) {
        const times = this.getAllTeams();
        return times.find(team => team && team.nomeTime === teamName);
    }

    async createTeamBracket(hasLower = false) {
        const teams = this.getAllTeams();
        if (teams.length < 2) throw new Error('Mínimo de 2 times cadastrados.');
        const teamNames = teams.map(team => team.nomeTime);
        return await this.createBracket(teamNames, hasLower, true);
    }
}

module.exports = new EventBracket();
