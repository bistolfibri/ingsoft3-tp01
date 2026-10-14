import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Las columnas DATE (OID 1082) se devuelven como texto 'YYYY-MM-DD' y no como objeto Date,
// para evitar corrimientos de día por zona horaria entre local, Docker y la nube.
pg.types.setTypeParser(1082, (value) => value);

// Configuración centralizada parametrizable mediante variables de entorno
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'finfix_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  // Bases en la nube (Neon, Render Postgres) exigen SSL. Se activa con DB_SSL=true.
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  // Margen amplio: una base serverless "dormida" puede tardar unos segundos en despertar.
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Error inesperado en el cliente de PostgreSQL:', err);
});

export default pool;
