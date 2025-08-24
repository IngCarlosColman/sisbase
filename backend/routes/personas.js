const express = require('express');
const { Pool } = require('pg');

const router = express.Router();

const pool = new Pool({
 user: process.env.DB_USER,
 host: process.env.DB_HOST,
 database: process.env.DB_NAME,
 password: process.env.DB_PASSWORD,
 port: 5432,
});

router.post('/', async (req, res) => {
 const { nombre, contacto, ci, tel, fax, cel } = req.body;
 try {
  const query = `
   INSERT INTO personas (nombre, contacto, ci, tel, fax, cel)
   VALUES ($1, $2, $3, $4, $5, $6)
   RETURNING *;`;
  const values = [nombre, contacto, ci, tel, fax, cel];
  const result = await pool.query(query, values);
  res.status(201).json(result.rows[0]);
 } catch (err) {
  console.error('Error al crear el registro:', err);
  res.status(500).json({ error: 'No se pudo crear el registro.' });
 }
});

router.get('/', async (req, res) => {
 res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
 res.setHeader('Pragma', 'no-cache');
 res.setHeader('Expires', '0');

 try {
  const { search } = req.query;
  
  if (!search) {
   return res.status(200).json([]);
  }

  const searchValue = search.toUpperCase();
  let query, values;

  if (/^\d+$/.test(search)) {
       query = `
           SELECT * FROM personas
            WHERE ci = $1
            ORDER BY ci;`;
   values = [search];
  } else {
   const searchTerms = searchValue.split(' ').filter(term => term.length > 0);
   const likeQueries = [];
   const queryValues = [];

   searchTerms.forEach((term, index) => {
     queryValues.push(`%${term}%`);
     likeQueries.push(`(nombre ILIKE $${index + 1} OR contacto ILIKE $${index + 1})`);
   });

   const whereClause = likeQueries.join(' AND ');
   
    query = `
        SELECT * FROM personas
        WHERE
            ${whereClause}
        ORDER BY nombre;`;
   values = queryValues;
    }
  
  const result = await pool.query(query, values);
  res.status(200).json(result.rows);
 } catch (err) {
  console.error('Error al obtener los registros:', err);
  res.status(500).json({ error: 'No se pudieron obtener los registros.' });
 }
});

router.put('/:id', async (req, res) => {
 const { id } = req.params;
 const { nombre, contacto, ci, tel, fax, cel } = req.body;
 try {
  const query = `
   UPDATE personas
   SET nombre = $1, contacto = $2, ci = $3, tel = $4, fax = $5, cel = $6
   WHERE id = $7
   RETURNING *;`;
  const values = [nombre, contacto, ci, tel, fax, cel, id];
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

router.delete('/:id', async (req, res) => {
 const { id } = req.params;
 try {
  const query = 'DELETE FROM personas WHERE id = $1 RETURNING *;';
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
