// industrias.js (Versión refactorizada)
// Importamos el pool de la base de datos desde el nuevo módulo db.js.
const express = require('express');
const db = require('./db'); // Importa la conexión a la base de datos

const router = express.Router();

// Manejadores de rutas refactorizados para usar la función `db.query`.

// Crear una nueva industria (POST)
router.post('/', async (req, res) => {
  const { razon_social, telefonos, email, actividad, direccion, departamento, ciudad } = req.body;
  try {
    const queryText = `
      INSERT INTO industrias (razon_social, telefonos, email, actividad, direccion, departamento, ciudad)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;`;
    const values = [razon_social, telefonos, email, actividad, direccion, departamento, ciudad];
    const result = await db.query(queryText, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al crear el registro de industria:', err);
    res.status(500).json({ error: 'No se pudo crear el registro de industria.' });
  }
});

// Obtener o buscar industrias (GET)
router.get('/', async (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    const { search, limit = 50, offset = 0 } = req.query;

    let queryText;
    let queryValues = [];
    const numericLimit = parseInt(limit, 10);
    const numericOffset = parseInt(offset, 10);

    // =========================================================
    // CAMBIO CLAVE: Lógica para la cláusula WHERE
    // =========================================================
    let whereClause = '';

    if (search) {
      const searchTerms = search.split(' ').filter(term => term.length > 0);
      const ilikeQueries = [];
      searchTerms.forEach((term, index) => {
        ilikeQueries.push(`(razon_social ILIKE $${index + 1} OR actividad ILIKE $${index + 1} OR departamento ILIKE $${index + 1} OR ciudad ILIKE $${index + 1})`);
        queryValues.push(`%${term}%`);
      });
      whereClause = `WHERE ${ilikeQueries.join(' AND ')}`;
    }
    
    // =========================================================
    // Lógica para la consulta con o sin cláusula WHERE
    // =========================================================
    queryText = `
      SELECT id, razon_social, telefonos, email, actividad, direccion, departamento, ciudad
      FROM industrias
      ${whereClause}
      ORDER BY razon_social
      LIMIT $${queryValues.length + 1}
      OFFSET $${queryValues.length + 2};`;

    queryValues.push(numericLimit);
    queryValues.push(numericOffset);

    const result = await db.query(queryText, queryValues);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error al obtener los registros de industria:', err);
    res.status(500).json({ error: 'No se pudo obtener el registro de industria.' });
  }
});

// Actualizar una industria por ID (PUT)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { razon_social, telefonos, email, actividad, direccion, departamento, ciudad } = req.body;
  try {
    const queryText = `
      UPDATE industrias
      SET razon_social = $1, telefonos = $2, email = $3, actividad = $4, direccion = $5, departamento = $6, ciudad = $7
      WHERE id = $8
      RETURNING *;`;
    const values = [razon_social, telefonos, email, actividad, direccion, departamento, ciudad, id];
    const result = await db.query(queryText, values);
    if (result.rowCount > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Registro de industria no encontrado.' });
    }
  } catch (err) {
    console.error('Error al actualizar el registro de industria:', err);
    res.status(500).json({ error: 'No se pudo actualizar el registro de industria.' });
  }
});

// Eliminar una industria por ID (DELETE)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const queryText = 'DELETE FROM industrias WHERE id = $1 RETURNING *;';
    const result = await db.query(queryText, [id]);
    if (result.rowCount > 0) {
      res.status(200).json({ message: 'Registro de industria eliminado exitosamente.', deleted_record: result.rows[0] });
    } else {
      res.status(404).json({ error: 'Registro de industria no encontrado.' });
    }
  } catch (err) {
    console.error('Error al eliminar el registro de industria:', err);
    res.status(500).json({ error: 'No se pudo eliminar el registro de industria.' });
  }
});

module.exports = router;