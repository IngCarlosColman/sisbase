//==========================================================================
// Archivo: politicos.js
// Descripción: Define las rutas de la API para la tabla 'politicos'.
//              Permite CRUD, búsqueda y una búsqueda avanzada de teléfono.
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
  const { nombres, apellidos, partido } = req.body;
  try {
    const query = `
      INSERT INTO politicos ("nombres", "apellidos", "partido")
      VALUES ($1, $2, $3)
      RETURNING *;`;
    const values = [nombres, apellidos, partido];
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al crear el registro de político:', err);
    res.status(500).json({ error: 'No se pudo crear el registro de político.' });
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

    if (search === undefined) {
      return res.status(200).json([]);
    }

    let whereClause = '';
    let values = [];
    let paramIndex = 1;

    if (search && search.trim() !== '') {
      const searchValue = search.trim();
      whereClause = `WHERE (
        to_tsvector('spanish', "nombres" || ' ' || "apellidos") @@ plainto_tsquery('spanish', $${paramIndex}) OR
        to_tsvector('spanish', partido) @@ plainto_tsquery('spanish', $${paramIndex})
      )`;
      values.push(searchValue);
      paramIndex++;
    }

    values.push(parsedLimit, parsedOffset);

    // CAMBIO: Se incluyen los nuevos campos cedula y telefono en el select
    const finalQuery = `
      SELECT id, nombres, apellidos, partido, cedula, telefono
      FROM politicos
      ${whereClause}
      ORDER BY "apellidos"
      LIMIT $${paramIndex++}
      OFFSET $${paramIndex++};`;

    const result = await pool.query(finalQuery, values);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error al obtener los registros de políticos:', err);
    res.status(500).json({ error: 'No se pudieron obtener los registros de políticos.' });
  }
});

//--------------------------------------------------------------------------
// 3. Actualizar un registro (PUT /:id) - LÓGICA AVANZADA
//--------------------------------------------------------------------------
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombres, apellidos, partido, cedula } = req.body;
  
  try {
    let combinedTelefono = '';

    // Si se proporciona una cédula, buscar teléfonos
    if (cedula && cedula.trim() !== '') {
      // Paso 1: Buscar en la tabla 'personap' por documento
      const personaPQuery = 'SELECT telefono FROM personap WHERE documento = $1;';
      const personaPResult = await pool.query(personaPQuery, [cedula]);

      if (personaPResult.rows.length > 0) {
        const tel = personaPResult.rows[0].telefono;
        if (tel) combinedTelefono = tel.trim();
      }

      // Paso 2: Buscar en la tabla 'personas' por cedula (ci)
      const personasQuery = 'SELECT tel FROM personas WHERE ci = $1;';
      const personasResult = await pool.query(personasQuery, [cedula]);

      if (personasResult.rows.length > 0) {
        const tel = personasResult.rows[0].tel;
        if (tel) {
          if (combinedTelefono !== '') {
            combinedTelefono += ', ' + tel.trim();
          } else {
            combinedTelefono = tel.trim();
          }
        }
      }
    }
    
    // CAMBIO: La cédula y el teléfono (si se encontró) se guardan en la tabla politicos
    const updateQuery = `
      UPDATE politicos
      SET "nombres" = $1, "apellidos" = $2, "partido" = $3, "cedula" = $4, "telefono" = $5
      WHERE id = $6
      RETURNING *;`;
    const updateValues = [nombres, apellidos, partido, cedula, combinedTelefono, id];
    const updateResult = await pool.query(updateQuery, updateValues);

    if (updateResult.rowCount > 0) {
      // Devolver los datos del político actualizado y el teléfono encontrado
      const updatedPolitico = updateResult.rows[0];
      res.status(200).json(updatedPolitico);
    } else {
      res.status(404).json({ error: 'Registro de político no encontrado.' });
    }
  } catch (err) {
    console.error('Error al actualizar el registro de político:', err);
    res.status(500).json({ error: 'No se pudo actualizar el registro de político.' });
  }
});

//--------------------------------------------------------------------------
// 4. Eliminar un registro (DELETE /:id)
//--------------------------------------------------------------------------
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const query = 'DELETE FROM politicos WHERE id = $1 RETURNING *;';
    const result = await pool.query(query, [id]);
    if (result.rowCount > 0) {
      res.status(200).json({ message: 'Registro de político eliminado exitosamente.', deleted_record: result.rows[0] });
    } else {
      res.status(404).json({ error: 'Registro de político no encontrado.' });
    }
  } catch (err) {
    console.error('Error al eliminar el registro de político:', err);
    res.status(500).json({ error: 'No se pudo eliminar el registro de político.' });
  }
});

module.exports = router;