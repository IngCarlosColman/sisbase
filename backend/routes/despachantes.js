//==========================================================================
// Archivo: despachantes.js
// Descripción: Define las rutas de la API para la tabla 'despachantes'.
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
 // El campo 'registro' se ha eliminado del cuerpo de la solicitud
 const { cedula, nombre, telefono } = req.body;
 try {
  const query = `
   INSERT INTO despachantes (cedula, nombre, telefono)
   VALUES ($1, $2, $3)
   RETURNING *;`;
  const values = [cedula, nombre, telefono];
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

  if (search === undefined) {
    // Si no hay parámetro de búsqueda, se asume que se está cargando por defecto.
    // En este caso, no se devuelve nada para que el frontend maneje la carga inicial.
    return res.status(200).json([]);
  }

  let whereClause = '';
  let values = [];
  let paramIndex = 1;
  let orderByClause = '';

  if (search && search.trim() !== '') {
    const searchValue = `%${search.trim()}%`;
    whereClause = `WHERE nombre ILIKE $${paramIndex} OR CAST(cedula AS TEXT) ILIKE $${paramIndex++}`;
    values.push(searchValue);
    orderByClause = `ORDER BY nombre`; // Ordenar por nombre cuando hay búsqueda
  } else {
    // --- CAMBIO CLAVE: Ordenar primero por si tiene teléfono, luego por nombre ---
    orderByClause = `ORDER BY (telefono IS NULL) ASC, nombre ASC`;
  }

  values.push(parsedLimit, parsedOffset);

  const finalQuery = `
    SELECT id, cedula, nombre, telefono
    FROM despachantes
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
 // El campo 'registro' se ha eliminado del cuerpo de la solicitud
 const { cedula, nombre, telefono } = req.body;
 try {
  const query = `
   UPDATE despachantes
   SET cedula = $1, nombre = $2, telefono = $3
   WHERE id = $4
   RETURNING *;`;
  const values = [cedula, nombre, telefono, id];
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
  const query = 'DELETE FROM despachantes WHERE id = $1 RETURNING *;';
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