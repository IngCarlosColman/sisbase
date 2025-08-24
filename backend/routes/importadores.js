//==========================================================================
// Archivo: importadores.js
// Descripción: Define las rutas de la API para la tabla 'importadores'.
//              Permite CRUD, búsqueda y paginación (scroll infinito).
//==========================================================================

const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

// Configuración de la conexión a la base de datos
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: 5432,
});

//--------------------------------------------------------------------------
// 1. Crear un nuevo registro (POST /)
//--------------------------------------------------------------------------
router.post('/', async (req, res) => {
  const { razon_social, telefono, email } = req.body;
  try {
    const query = `
      INSERT INTO importadores ("razon_social", "telefono", "email")
      VALUES ($1, $2, $3)
      RETURNING *;`;
    const values = [razon_social, telefono, email];
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al crear el registro:', err);
    res.status(500).json({ error: 'No se pudo crear el registro.' });
  }
});

//--------------------------------------------------------------------------
// 2. Obtener o buscar registros (GET /)
//    - Carga inicial: No devuelve registros (cuando 'search' no está presente).
//    - Búsqueda/Mostrar todo: Carga 100 registros iniciales.
//--------------------------------------------------------------------------
router.get('/', async (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    const { search, limit, offset } = req.query;
    const parsedLimit = parseInt(limit, 10) || 100;
    const parsedOffset = parseInt(offset, 10) || 0;

    // Lógica para no cargar datos al inicio (cuando 'search' no existe)
    if (search === undefined) {
      return res.status(200).json([]);
    }

    let whereClause = '';
    let values = [];
    let paramIndex = 1;

    // Lógica para búsqueda (si 'search' tiene un valor)
    if (search && search.trim() !== '') {
      const searchValue = search.toUpperCase();
      whereClause = `WHERE UPPER("razon_social") ILIKE $${paramIndex} OR UPPER("email") ILIKE $${paramIndex++}`;
      values.push(`%${searchValue}%`);
    }

    // Agrega los parámetros de paginación al final
    values.push(parsedLimit, parsedOffset);

    const finalQuery = `
      SELECT id, "razon_social", "telefono", "email"
      FROM importadores
      ${whereClause}
      ORDER BY "razon_social"
      LIMIT $${paramIndex++}
      OFFSET $${paramIndex++};`;

    const result = await pool.query(finalQuery, values);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error al obtener los registros:', err);
    res.status(500).json({ error: 'No se pudieron obtener los registros.' });
  }
});

//--------------------------------------------------------------------------
// 3. Actualizar un registro (PUT /:id)
//--------------------------------------------------------------------------
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { razon_social, telefono, email } = req.body;
  try {
    const query = `
      UPDATE importadores
      SET "razon_social" = $1, "telefono" = $2, "email" = $3
      WHERE id = $4
      RETURNING *;`;
    const values = [razon_social, telefono, email, id];
    const result = await pool.query(query, values);
    if (result.rowCount > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Registro no encontrado.' });
    }
  } catch (err) {
    console.error('Error al actualizar el registro:', err);
    res.status(500).json({ error: 'No se pudo actualizar el registro.' });
  }
});

//--------------------------------------------------------------------------
// 4. Eliminar un registro (DELETE /:id)
//--------------------------------------------------------------------------
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const query = 'DELETE FROM importadores WHERE id = $1 RETURNING *;';
    const result = await pool.query(query, [id]);
    if (result.rowCount > 0) {
      res.status(200).json({ message: 'Registro eliminado exitosamente.', deleted_record: result.rows[0] });
    } else {
      res.status(404).json({ error: 'Registro no encontrado.' });
    }
  } catch (err) {
    console.error('Error al eliminar el registro:', err);
    res.status(500).json({ error: 'No se pudo eliminar el registro.' });
  }
});

module.exports = router;