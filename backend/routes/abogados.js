//==========================================================================
// Archivo: abogados.js
// Descripción: Define las rutas de la API y la lógica para el CRUD completo
//              y la búsqueda de abogados, con los campos correctos.
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
// 1. Crear un nuevo abogado (POST /)
//--------------------------------------------------------------------------
router.post('/', async (req, res) => {
  const { cedula, nombres, apellidos, telefono, ciudad } = req.body;
  try {
    const query = `
      INSERT INTO abogados (cedula, nombres, apellidos, telefono, ciudad)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;`;
    const values = [cedula, nombres, apellidos, telefono, ciudad];
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al crear el registro de abogado:', err);
    res.status(500).json({ error: 'No se pudo crear el registro de abogado.' });
  }
});

//--------------------------------------------------------------------------
// 2. Obtener todos los abogados o buscar (GET /)
//--------------------------------------------------------------------------
router.get('/', async (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    const { query, limit, offset } = req.query;
    const parsedLimit = parseInt(limit) || 100;
    const parsedOffset = parseInt(offset) || 0;

    let whereClause = '';
    let values = [];
    let paramIndex = 1;

    if (query && query.trim() !== '') {
      const searchValue = query.toUpperCase();
      if (/^\d+$/.test(searchValue)) {
        whereClause = `WHERE CAST(cedula AS TEXT) ILIKE $${paramIndex++}`;
        values.push(`%${searchValue}%`);
      } else {
        const searchTerms = searchValue.split(' ').filter(term => term.length > 0);
        const likeQueries = [];
        searchTerms.forEach(() => {
          likeQueries.push(`(UPPER(nombres) ILIKE $${paramIndex} OR UPPER(apellidos) ILIKE $${paramIndex++})`);
          values.push(`%${searchTerms[paramIndex - 2]}%`);
        });
        whereClause = `WHERE ${likeQueries.join(' AND ')}`;
      }
    }

    const finalQuery = `
      SELECT id, cedula, nombres, apellidos, telefono, ciudad
      FROM abogados
      ${whereClause}
      ORDER BY id ASC
      LIMIT $${paramIndex++}
      OFFSET $${paramIndex++};`;
      values.push(parsedLimit, parsedOffset);

    const result = await pool.query(finalQuery, values);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error al obtener o buscar los registros de abogado:', err);
    res.status(500).json({ error: 'No se pudo realizar la operación.' });
  }
});

//--------------------------------------------------------------------------
// 3. Obtener un abogado por ID (GET /:id)
//--------------------------------------------------------------------------
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (isNaN(id)) {
    return res.status(400).json({ error: 'El ID proporcionado no es un número válido.' });
  }
  try {
    const query = 'SELECT id, cedula, nombres, apellidos, telefono, ciudad FROM abogados WHERE id = $1;';
    const result = await pool.query(query, [id]);
    if (result.rowCount > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Registro de abogado no encontrado.' });
    }
  } catch (err) {
    console.error('Error al obtener el registro de abogado:', err);
    res.status(500).json({ error: 'No se pudo obtener el registro de abogado.' });
  }
});

//--------------------------------------------------------------------------
// 4. Actualizar un abogado por ID (PUT /:id)
//--------------------------------------------------------------------------
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { cedula, nombres, apellidos, telefono, ciudad } = req.body;
  try {
    const query = `
      UPDATE abogados
      SET cedula = $1, nombres = $2, apellidos = $3, telefono = $4, ciudad = $5
      WHERE id = $6
      RETURNING *;`;
    const values = [cedula, nombres, apellidos, telefono, ciudad, id];
    const result = await pool.query(query, values);
    if (result.rowCount > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Registro de abogado no encontrado para actualizar.' });
    }
  } catch (err) {
    console.error('Error al actualizar el registro de abogado:', err);
    res.status(500).json({ error: 'No se pudo actualizar el registro de abogado.' });
  }
});

//--------------------------------------------------------------------------
// 5. Eliminar un abogado por ID (DELETE /:id)
//--------------------------------------------------------------------------
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const query = 'DELETE FROM abogados WHERE id = $1 RETURNING *;';
    const result = await pool.query(query, [id]);
    if (result.rowCount > 0) {
      res.status(200).json({ message: 'Registro de abogado eliminado exitosamente.', deleted_record: result.rows[0] });
    } else {
      res.status(404).json({ error: 'Registro de abogado no encontrado para eliminar.' });
    }
  } catch (err) {
    console.error('Error al eliminar el registro de abogado:', err);
    res.status(500).json({ error: 'No se pudo eliminar el registro de abogado.' });
  }
});

module.exports = router;