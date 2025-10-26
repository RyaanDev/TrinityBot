// database.js
const fs = require('fs');
const path = require('path');

class Database {
    constructor(filename = 'data.json') {
        this.filepath = path.join(__dirname, filename);
        this.data = this.loadData();
    }

    /**
     * Carrega os dados do arquivo JSON
     */
    loadData() {
        try {
            if (fs.existsSync(this.filepath)) {
                const rawData = fs.readFileSync(this.filepath, 'utf8');
                return JSON.parse(rawData);
            }
            return {};
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            return {};
        }
    }

    /**
     * Salva os dados no arquivo JSON
     */
    saveData() {
        try {
            fs.writeFileSync(this.filepath, JSON.stringify(this.data, null, 2), 'utf8');
            return true;
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
            return false;
        }
    }

    /**
     * CREATE - Cria um novo registro
     */
    create(collection, id, record) {
        if (!this.data[collection]) {
            this.data[collection] = {};
        }

        if (this.data[collection][id]) {
            throw new Error(`Registro com ID ${id} já existe na coleção ${collection}`);
        }

        record.createdAt = new Date().toISOString();
        record.updatedAt = new Date().toISOString();

        this.data[collection][id] = record;
        this.saveData();
        return record;
    }

    /**
     * READ - Lê um registro específico
     */
    read(collection, id) {
        if (!this.data[collection] || !this.data[collection][id]) {
            return null;
        }
        return this.data[collection][id];
    }

    /**
     * READ ALL - Lê todos os registros de uma coleção
     */
    readAll(collection) {
        if (!this.data[collection]) {
            return {};
        }
        return this.data[collection];
    }

    /**
     * UPDATE - Atualiza um registro existente
     */
    update(collection, id, updates) {
        if (!this.data[collection] || !this.data[collection][id]) {
            throw new Error(`Registro com ID ${id} não encontrado na coleção ${collection}`);
        }

        delete updates.createdAt;
        delete updates.id;

        updates.updatedAt = new Date().toISOString();

        this.data[collection][id] = {
            ...this.data[collection][id],
            ...updates
        };

        this.saveData();
        return this.data[collection][id];
    }

    /**
     * UPSERT - Cria ou atualiza um registro
     */
    upsert(collection, id, record) {
        if (this.read(collection, id)) {
            return this.update(collection, id, record);
        } else {
            return this.create(collection, id, record);
        }
    }

    /**
     * DELETE - Remove um registro
     */
    delete(collection, id) {
        if (!this.data[collection] || !this.data[collection][id]) {
            throw new Error(`Registro com ID ${id} não encontrado na coleção ${collection}`);
        }

        const deletedRecord = this.data[collection][id];
        delete this.data[collection][id];

        if (Object.keys(this.data[collection]).length === 0) {
            delete this.data[collection];
        }

        this.saveData();
        return deletedRecord;
    }

    /**
     * FIND - Encontra registros baseado em uma condição
     */
    find(collection, condition) {
        if (!this.data[collection]) {
            return [];
        }

        return Object.entries(this.data[collection])
            .filter(([id, record]) => condition(record))
            .map(([id, record]) => ({ id, ...record }));
    }

    /**
     * COUNT - Conta o número de registros em uma coleção
     */
    count(collection) {
        if (!this.data[collection]) {
            return 0;
        }
        return Object.keys(this.data[collection]).length;
    }
}

module.exports = new Database();