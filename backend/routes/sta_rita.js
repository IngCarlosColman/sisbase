//==========================================================================
// Archivo: sta_rita.js
// Descripción: Define las rutas de la API para la tabla 'contri_sta_rita'.
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
    const { razon_social, representante, telefono, actividad } = req.body;
    try {
        const query = `
            INSERT INTO contri_sta_rita (razon_social, representante, telefono, actividad)
            VALUES ($1, $2, $3, $4)
            RETURNING *;`;
        const values = [razon_social, representante, telefono, actividad];
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
        
        // Si no hay parámetro de búsqueda, se devuelve un array vacío por defecto
        if (search === undefined) {
            return res.status(200).json([]);
        }

        let whereClause = '';
        let values = [];
        let paramIndex = 1;
        let orderByClause = '';

        if (search && search.trim() !== '') {
            const searchValue = `%${search.trim()}%`;
            whereClause = `
                WHERE razon_social ILIKE $${paramIndex} OR representante ILIKE $${paramIndex} OR actividad ILIKE $${paramIndex}
            `;
            values.push(searchValue);
            orderByClause = `ORDER BY razon_social`;
        } else {
            // Ordena alfabéticamente por razón social si no hay búsqueda
            orderByClause = `ORDER BY razon_social`;
        }

        values.push(parsedLimit, parsedOffset);

        const finalQuery = `
            SELECT id, razon_social, representante, telefono, actividad
            FROM contri_sta_rita
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
    const { razon_social, representante, telefono, actividad } = req.body;
    try {
        const query = `
            UPDATE contri_sta_rita
            SET razon_social = $1, representante = $2, telefono = $3, actividad = $4
            WHERE id = $5
            RETURNING *;`;
        const values = [razon_social, representante, telefono, actividad, id];
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
        const query = 'DELETE FROM contri_sta_rita WHERE id = $1 RETURNING *;';
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