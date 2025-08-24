//==========================================================================
// Archivo: exportagricola.js
// Descripción: Define las rutas de la API para la tabla 'agricola'.
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
  const { propietario, operador, gerente, telefono, instalacion, departamento, ciudad } = req.body;
  try {
    const query = `
      INSERT INTO agricola ("propietario", "operador", "gerente", "telefono", "instalacion", "departamento", "ciudad")
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;`;
    const values = [propietario, operador, gerente, telefono, instalacion, departamento, ciudad];
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al crear el registro:', err);
    res.status(500).json({ error: 'No se pudo crear el registro.' });
  }
});

//--------------------------------------------------------------------------
// 2. Obtener o buscar registros (GET /)
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

    // Lógica para búsqueda en campos de agricola
    if (search && search.trim() !== '') {
      const searchValue = `%${search.toUpperCase()}%`;
      whereClause = `
        WHERE UPPER("propietario") ILIKE $${paramIndex}
        OR UPPER("operador") ILIKE $${paramIndex}
        OR UPPER("departamento") ILIKE $${paramIndex}
        OR UPPER("ciudad") ILIKE $${paramIndex}`;
      values.push(searchValue);
    }
    
    // Agrega los parámetros de paginación al final
    values.push(parsedLimit, parsedOffset);
    
    const finalQuery = `
      SELECT id, propietario, operador, gerente, telefono, instalacion, departamento, ciudad
      FROM agricola
      ${whereClause}
      ORDER BY propietario
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
  const { propietario, operador, gerente, telefono, instalacion, departamento, ciudad } = req.body;
  try {
    const query = `
      UPDATE agricola
      SET 
        "propietario" = $1, 
        "operador" = $2, 
        "gerente" = $3, 
        "telefono" = $4, 
        "instalacion" = $5, 
        "departamento" = $6, 
        "ciudad" = $7
      WHERE id = $8
      RETURNING *;`;
    const values = [propietario, operador, gerente, telefono, instalacion, departamento, ciudad, id];
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
    const query = 'DELETE FROM agricola WHERE id = $1 RETURNING *;';
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