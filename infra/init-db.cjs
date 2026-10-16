// Aplica el esquema y los datos mínimos a la base de preprod.
// Lo ejecuta Terraform justo después de crear la base.
const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');

// Reutiliza el driver "pg" que ya está instalado en el backend
const requireDesdeBackend = createRequire(path.join(__dirname, '..', 'backend', 'package.json'));
const { Client } = requireDesdeBackend('pg');

async function main() {
    const client = new Client({
        host: process.env.DB_HOST,
        port: 5432,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: { rejectUnauthorized: false },
    });

    await client.connect();
    for (const archivo of ['schema.sql', 'seed.sql']) {
        const sql = fs.readFileSync(path.join(__dirname, '..', 'database', archivo), 'utf8');
        await client.query(sql);
        console.log('Aplicado:', archivo);
    }
    await client.end();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});