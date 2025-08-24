//==========================================================================
// Archivo: yacyreta.js
// Descripción: Define las rutas de la API para la tabla y la vista materializada
//              de Yacyretá, con lógica de búsqueda y scroll infinito.
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
// 1. Obtener detalles combinados (GET /detalles)
//    - Esta ruta usa la VISTA MATERIALIZADA para un rendimiento óptimo.
//--------------------------------------------------------------------------
router.get('/detalles', async (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    const { search, limit, offset } = req.query;
    const parsedLimit = parseInt(limit) || 100;
    const parsedOffset = parseInt(offset) || 0;

    let queryText;
    let values = [];

    if (search && search.trim() !== '') {
      const searchValue = search.toUpperCase();
      if (!isNaN(search) && search.length > 0) {
        // Búsqueda por cedula
        queryText = `
          SELECT *
          FROM yacyreta_detalles_mview
          WHERE cedula = $1;
        `;
        values = [search];
      } else {
        // Búsqueda por nombre (parcial)
        queryText = `
          SELECT *
          FROM yacyreta_detalles_mview
          WHERE UPPER(nombre) ILIKE $1
          ORDER BY nombre
          LIMIT $2 OFFSET $3;
        `;
        values = [`%${searchValue}%`, parsedLimit, parsedOffset];
      }
    } else {
      // "Mostrar Todo" con paginación
      queryText = `
        SELECT *
        FROM yacyreta_detalles_mview
        LIMIT $1 OFFSET $2;
      `;
      values = [parsedLimit, parsedOffset];
    }

    const result = await pool.query(queryText, values);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error al obtener los registros con detalles de Yacyretá:', err);
    res.status(500).json({ error: 'No se pudo obtener el registro.' });
  }
});

//--------------------------------------------------------------------------
// 2. Obtener o buscar registros general (GET /)
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
      whereClause = `WHERE (CAST(cedula AS TEXT) ILIKE $${paramIndex++} OR UPPER(nombre) ILIKE $${paramIndex++})`;
      values.push(`%${searchValue}%`, `%${searchValue}%`);
    }

    const finalQuery = `
      SELECT cedula, nombre, salario, sede
      FROM yacyreta
      ${whereClause}
      ORDER BY cedula ASC
      LIMIT $${paramIndex++}
      OFFSET $${paramIndex++};`;
      
    values.push(parsedLimit, parsedOffset);
    
    const result = await pool.query(finalQuery, values);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error al obtener o buscar los registros de Yacyretá:', err);
    res.status(500).json({ error: 'No se pudo realizar la operación.' });
  }
});

//--------------------------------------------------------------------------
// 3. Obtener un registro específico por cédula (GET /:cedula)
//--------------------------------------------------------------------------
router.get('/:cedula', async (req, res) => {
  const { cedula } = req.params;
  try {
    const query = 'SELECT cedula, nombre, salario, sede FROM yacyreta WHERE cedula = $1;';
    const result = await pool.query(query, [cedula]);
    if (result.rowCount > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Registro de Yacyretá no encontrado.' });
    }
  } catch (err) {
    console.error('Error al obtener el registro por cédula:', err);
    res.status(500).json({ error: 'No se pudo obtener el registro.' });
  }
});

//--------------------------------------------------------------------------
// 4. Crear un nuevo registro (POST /)
//--------------------------------------------------------------------------
router.post('/', async (req, res) => {
  const { cedula, nombre, salario, sede } = req.body;
  try {
    const query = `
      INSERT INTO yacyreta (cedula, nombre, salario, sede)
      VALUES ($1, $2, $3, $4)
      RETURNING *;`;
    const values = [cedula, nombre, salario, sede];
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al crear el registro de Yacyretá:', err);
    res.status(500).json({ error: 'No se pudo crear el registro. Verifique que la cédula sea única.' });
  }
});

//--------------------------------------------------------------------------
// 5. Actualizar un registro por cédula (PUT /:cedula)
//--------------------------------------------------------------------------
router.put('/:cedula', async (req, res) => {
  const { cedula } = req.params;
  const { nombre, salario, sede } = req.body;
  try {
    const query = `
      UPDATE yacyreta
      SET nombre = $1, salario = $2, sede = $3
      WHERE cedula = $4
      RETURNING *;`;
    const values = [nombre, salario, sede, cedula];
    const result = await pool.query(query, values);
    if (result.rowCount > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Registro de Yacyretá no encontrado para actualizar.' });
    }
  } catch (err) {
    console.error('Error al actualizar el registro de Yacyretá:', err);
    res.status(500).json({ error: 'No se pudo actualizar el registro.' });
  }
});

//--------------------------------------------------------------------------
// 6. Eliminar un registro por cédula (DELETE /:cedula)
//--------------------------------------------------------------------------
router.delete('/:cedula', async (req, res) => {
  const { cedula } = req.params;
  try {
    const query = 'DELETE FROM yacyreta WHERE cedula = $1 RETURNING *;';
    const result = await pool.query(query, [cedula]);
    if (result.rowCount > 0) {
      res.status(200).json({ message: 'Registro de Yacyretá eliminado exitosamente.', deleted_record: result.rows[0] });
    } else {
      res.status(404).json({ error: 'Registro de Yacyretá no encontrado para eliminar.' });
    }
  } catch (err) {
    console.error('Error al eliminar el registro de Yacyretá:', err);
    res.status(500).json({ error: 'No se pudo eliminar el registro.' });
  }
});

module.exports = router;