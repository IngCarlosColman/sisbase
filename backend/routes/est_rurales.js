//==========================================================================
// Archivo: est_rurales.js
// Descripción: Define las rutas de la API para la tabla est_rurales.
//              Permite la búsqueda, la carga inicial y el scroll infinito.
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
  const { razon_social, direccion, departamento, ciudad, telefono, email } = req.body;
  try {
    const query = `
      INSERT INTO est_rurales (razon_social, direccion, departamento, ciudad, telefono, email)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;`;
    const values = [razon_social, direccion, departamento, ciudad, telefono, email];
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al crear el registro:', err);
    res.status(500).json({ error: 'No se pudo crear el registro.' });
  }
});

//--------------------------------------------------------------------------
// 2. Obtener o buscar registros (GET /)
//    - Soporta búsqueda, carga inicial y scroll infinito.
//--------------------------------------------------------------------------
router.get('/', async (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    const { search, limit, offset } = req.query;
    const parsedLimit = parseInt(limit, 10) || 100;
    const parsedOffset = parseInt(offset, 10) || 0;
    
    // Si no hay parámetro de búsqueda, devuelve una paginación completa.
    if (!search) {
      const allQuery = `
        SELECT * FROM est_rurales
        ORDER BY razon_social
        LIMIT $1
        OFFSET $2;`;
      const allValues = [parsedLimit, parsedOffset];
      const result = await pool.query(allQuery, allValues);
      return res.status(200).json(result.rows);
    }
    
    // Si hay un término de búsqueda, aplica la lógica de búsqueda.
    const searchValue = search.toUpperCase();
    const searchTerms = searchValue.split(' ').filter(term => term.length > 0);
    const likeQueries = [];
    const queryValues = [];

    searchTerms.forEach((term, index) => {
      queryValues.push(`%${term}%`);
      likeQueries.push(`(UPPER(razon_social) ILIKE $${index + 1} OR UPPER(departamento) ILIKE $${index + 1} OR UPPER(ciudad) ILIKE $${index + 1})`);
    });

    const whereClause = likeQueries.join(' AND ');
    
    queryValues.push(parsedLimit, parsedOffset);
    
    const query = `
      SELECT * FROM est_rurales
      WHERE 
        ${whereClause}
      ORDER BY razon_social
      LIMIT $${searchTerms.length + 1}
      OFFSET $${searchTerms.length + 2};`;
      
    const result = await pool.query(query, queryValues);
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
  const { razon_social, direccion, departamento, ciudad, telefono, email } = req.body;
  try {
    const query = `
      UPDATE est_rurales
      SET razon_social = $1, direccion = $2, departamento = $3, ciudad = $4, telefono = $5, email = $6
      WHERE id = $7
      RETURNING *;`;
    const values = [razon_social, direccion, departamento, ciudad, telefono, email, id];
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
    const query = 'DELETE FROM est_rurales WHERE id = $1 RETURNING *;';
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