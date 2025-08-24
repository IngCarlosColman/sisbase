//==========================================================================
// Archivo: futbolistas.js
// Descripción: Define las rutas de la API para la tabla 'futbolistas'.
//              Permite CRUD, búsqueda y paginación.
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
  const { cedula, nombres, apellidos, posicion, telefono } = req.body;
  try {
    const query = `
      INSERT INTO futbolistas ("cedula", "nombres", "apellidos", "posicion", "telefono")
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;`;
    const values = [cedula, nombres, apellidos, posicion, telefono];
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al crear el registro de futbolista:', err);
    res.status(500).json({ error: 'No se pudo crear el registro de futbolista.' });
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

    if (search === undefined) {
      return res.status(200).json([]);
    }

    let whereClause = '';
    let values = [];
    let paramIndex = 1;

    // Lógica de búsqueda mejorada para manejar múltiples palabras
    if (search && search.trim() !== '') {
      const searchValue = search.trim();
      whereClause = `WHERE (
        to_tsvector('spanish', "nombres" || ' ' || "apellidos") @@ plainto_tsquery('spanish', $${paramIndex}) OR
        to_tsvector('spanish', "posicion") @@ plainto_tsquery('spanish', $${paramIndex})
      )`;
      values.push(searchValue);
      paramIndex++; // <-- LÍNEA CORREGIDA
    }

    // Agrega los parámetros de paginación
    values.push(parsedLimit, parsedOffset);

    const finalQuery = `
      SELECT id, "cedula", "nombres", "apellidos", "posicion", "telefono"
      FROM futbolistas
      ${whereClause}
      ORDER BY "apellidos"
      LIMIT $${paramIndex++}
      OFFSET $${paramIndex++};`;

    const result = await pool.query(finalQuery, values);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error al obtener los registros de futbolistas:', err);
    res.status(500).json({ error: 'No se pudieron obtener los registros de futbolistas.' });
  }
});

//--------------------------------------------------------------------------
// 3. Actualizar un registro (PUT /:id)
//--------------------------------------------------------------------------
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { cedula, nombres, apellidos, posicion, telefono } = req.body;
  try {
    const query = `
      UPDATE futbolistas
      SET "cedula" = $1, "nombres" = $2, "apellidos" = $3, "posicion" = $4, "telefono" = $5
      WHERE id = $6
      RETURNING *;`;
    const values = [cedula, nombres, apellidos, posicion, telefono, id];
    const result = await pool.query(query, values);
    if (result.rowCount > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Registro de futbolista no encontrado.' });
    }
  } catch (err) {
    console.error('Error al actualizar el registro de futbolista:', err);
    res.status(500).json({ error: 'No se pudo actualizar el registro de futbolista.' });
  }
});

//--------------------------------------------------------------------------
// 4. Eliminar un registro (DELETE /:id)
//--------------------------------------------------------------------------
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const query = 'DELETE FROM futbolistas WHERE id = $1 RETURNING *;';
    const result = await pool.query(query, [id]);
    if (result.rowCount > 0) {
      res.status(200).json({ message: 'Registro de futbolista eliminado exitosamente.', deleted_record: result.rows[0] });
    } else {
      res.status(404).json({ error: 'Registro de futbolista no encontrado.' });
    }
  } catch (err) {
    console.error('Error al eliminar el registro de futbolista:', err);
    res.status(500).json({ error: 'No se pudo eliminar el registro de futbolista.' });
  }
});

module.exports = router;