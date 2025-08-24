const express = require('express');
const db = require('./db');
const router = express.Router();

// Helper para convertir el formato de la base de datos a un formato más amigable para el frontend
const formatRecord = (record) => {
 return {
  id: record.id,
  documento: record.documento,
  nombre1: record.nombre1,
  nombre2: record.nombre2,
  apellido1: record.apellido1,
  apellido2: record.apellido2,
  telefono: record.telefono,
  celular: record.celular,
 };
};

router.post('/', async (req, res) => {
 const { documento, nombre1, nombre2, apellido1, apellido2, telefono, celular } = req.body;
 try {
  const query = `
   INSERT INTO personap (documento, nombre1, nombre2, apellido1, apellido2, telefono, celular)
   VALUES ($1, $2, $3, $4, $5, $6, $7)
   RETURNING *;`;
  const values = [documento, nombre1, nombre2, apellido1, apellido2, telefono, celular];
  const result = await db.query(query, values);
  res.status(201).json(formatRecord(result.rows[0]));
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
  
  let query, values;

  // Lógica de búsqueda mejorada: comprueba si el término de búsqueda es numérico
  if (!isNaN(search) && search.trim() !== '') {
   // Si es un número, busca por documento (que es de tipo BIGINT)
   query = `
    SELECT * FROM personap
    WHERE documento = $1
    ORDER BY id;`;
   values = [search];
  } else {
   // Si no es un número, realiza la búsqueda de texto en los campos de nombre/apellido
   const searchTerms = search.toUpperCase().split(' ').filter(term => term.length > 0);
   const likeQueries = [];
   const queryValues = [];
 
   searchTerms.forEach((term, index) => {
     queryValues.push(`%${term}%`);
     likeQueries.push(`(
      UPPER(nombre1) LIKE $${index + 1} OR
      UPPER(nombre2) LIKE $${index + 1} OR
      UPPER(apellido1) LIKE $${index + 1} OR
      UPPER(apellido2) LIKE $${index + 1}
     )`);
   });
 
   const whereClause = likeQueries.join(' AND ');
   
   query = `
    SELECT * FROM personap
    WHERE 
     ${whereClause}
    ORDER BY id;`;
   
   values = queryValues;
  }
  
  const result = await db.query(query, values);
  const formattedResult = result.rows.map(formatRecord);
  res.status(200).json(formattedResult);
 } catch (err) {
  console.error('Error al obtener los registros:', err);
  res.status(500).json({ error: 'No se pudieron obtener los registros.' });
 }
});

router.put('/:id', async (req, res) => {
 const { id } = req.params;
 const { documento, nombre1, nombre2, apellido1, apellido2, telefono, celular } = req.body;
 try {
  const query = `
   UPDATE personap
   SET documento = $1, nombre1 = $2, nombre2 = $3, apellido1 = $4, apellido2 = $5, telefono = $6, celular = $7
   WHERE id = $8
   RETURNING *;`;
  const values = [documento, nombre1, nombre2, apellido1, apellido2, telefono, celular, id];
  const result = await db.query(query, values);
  if (result.rowCount > 0) {
   res.status(200).json(formatRecord(result.rows[0]));
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
  const query = 'DELETE FROM personap WHERE id = $1 RETURNING *;';
  const result = await db.query(query, [id]);
  if (result.rowCount > 0) {
   res.status(200).json({ message: 'Registro eliminado exitosamente.', deleted_record: formatRecord(result.rows[0]) });
  } else {
   res.status(404).json({ error: 'Registro no encontrado.' });
  }
 } catch (err) {
  console.error('Error al eliminar el registro:', err);
  res.status(500).json({ error: 'No se pudo eliminar el registro.' });
 }
});

module.exports = router;
