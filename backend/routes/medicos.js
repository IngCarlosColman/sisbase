//==========================================================================
// Archivo: medicos.js
// Descripción: Define las rutas de la API para la tabla 'medicos'.
//              Permite CRUD, búsqueda y paginación (scroll infinito).
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
  const { cedula, nombre, registro, telefono } = req.body;
  try {
    const query = `
      INSERT INTO medicos (cedula, nombre, registro, telefono)
      VALUES ($1, $2, $3, $4)
      RETURNING *;`;
    const values = [cedula, nombre, registro, telefono];
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al crear el registro:', err);
    res.status(500).json({ error: 'No se pudo crear el registro.' });
  }
});

//--------------------------------------------------------------------------
// 2. Obtener o buscar registros (GET /)
//    - Carga inicial: No devuelve registros (cuando 'search' no está presente).
//    - Búsqueda/Mostrar todo: Carga 100 registros iniciales.
//--------------------------------------------------------------------------
router.get('/', async (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    const { search, limit, offset } = req.query;
    const parsedLimit = parseInt(limit, 10) || 100;
    const parsedOffset = parseInt(offset, 10) || 0;

    if (search === undefined) {
      return res.status(200).json([]);
    }

    let whereClause = '';
    let values = [];
    let paramIndex = 1;
    let orderByClause = `ORDER BY nombre`;

    if (search && search.trim() !== '') {
      const searchValue = `%${search.trim()}%`;
      whereClause = `WHERE nombre ILIKE $${paramIndex} OR CAST(cedula AS TEXT) ILIKE $${paramIndex++}`;
      values.push(searchValue);
    } else {
      // --- CAMBIO CORREGIDO: Ordenar por teléfono que no sea NULL ni vacío
      orderByClause = `ORDER BY CASE WHEN telefono IS NOT NULL AND LENGTH(TRIM(telefono)) > 0 THEN 0 ELSE 1 END, nombre`;
    }

    values.push(parsedLimit, parsedOffset);

    const finalQuery = `
      SELECT id, cedula, nombre, registro, telefono
      FROM medicos
      ${whereClause}
      ${orderByClause}
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
  const { cedula, nombre, registro, telefono } = req.body;
  try {
    const query = `
      UPDATE medicos
      SET cedula = $1, nombre = $2, registro = $3, telefono = $4
      WHERE id = $5
      RETURNING *;`;
    const values = [cedula, nombre, registro, telefono, id];
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
    const query = 'DELETE FROM medicos WHERE id = $1 RETURNING *;';
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