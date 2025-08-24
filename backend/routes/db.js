// db.js
// Este módulo crea y exporta el pool de la base de datos para reutilizarlo en todas las rutas.

const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: 5432,
});

// Agregamos un manejador de errores para el pool para que sea más robusto.
pool.on('error', (err) => {
  console.error('Error inesperado en el pool de la base de datos:', err);
  process.exit(-1); // Salimos del proceso si hay un error crítico
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
