// itaipu.js
const express = require('express');
const db = require('./db');

const router = express.Router();

// ---
// 1. OBTENER DETALLES COMBINADOS
// La ruta ahora acepta paginación para la búsqueda y para "Mostrar Todo".
// ---
router.get('/detalles', async (req, res) => {
    // Log 1: Se registra la hora en que la solicitud llega al endpoint.
    console.log('1. Solicitud a /detalles recibida:', new Date().toISOString());

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    try {
        const { search, limit, offset } = req.query;
        let queryText;
        let values = [];

        // Lógica de búsqueda condicional
        if (search) {
            const searchValue = search.toUpperCase();
            if (!isNaN(search) && search.length > 0) {
                // Búsqueda por cédula (exacta)
                queryText = `
                    SELECT *
                    FROM itaipu_detalles_view
                    WHERE cedula = $1;
                `;
                values = [search];
            } else {
                // Búsqueda por nombre (parcial)
                queryText = `
                    SELECT *
                    FROM itaipu_detalles_view
                    WHERE UPPER(nombre) ILIKE $1
                    LIMIT $2 OFFSET $3;
                `;
                values = [`%${searchValue}%`, limit, offset];
            }
        } else {
            // "Mostrar Todo" con paginación
            queryText = `
                SELECT *
                FROM itaipu_detalles_view
                LIMIT $1 OFFSET $2;
            `;
            values = [limit, offset];
        }

        // Log 2: Se registra la hora antes de enviar la consulta a la base de datos.
        console.log('2. Consulta a la DB enviada:', new Date().toISOString());

        const result = await db.query(queryText, values);
        
        // Log 3: Se registra la hora después de que la base de datos respondió.
        console.log('3. Respuesta de la DB recibida:', new Date().toISOString());

        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error al obtener los registros con detalles:', err);
        res.status(500).json({ error: 'No se pudo obtener el registro.' });
    }
});

//---
//### Manejadores de rutas para la tabla `itaipu`
//---

// 2. Obtener o buscar registros general (GET)
router.get('/', async (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    try {
        const { search } = req.query;

        if (!search) {
            return res.status(200).json([]);
        }

        let queryText, values;

        if (!isNaN(search) && search.length > 0) {
            queryText = `
                SELECT cedula, nombre, cargo, ubicacion, salario
                FROM itaipu
                WHERE cedula = $1;`;
            values = [search];
        } else {
            const searchValue = search.toUpperCase();
            queryText = `
                SELECT cedula, nombre, cargo, ubicacion, salario
                FROM itaipu
                WHERE UPPER(nombre) ILIKE $1
                ORDER BY nombre
                LIMIT 100;`;
            values = [`%${searchValue}%`];
        }

        const result = await db.query(queryText, values);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error al obtener los registros:', err);
        res.status(500).json({ error: 'No se pudo obtener el registro.' });
    }
});

// 3. Obtener un registro específico por cédula (GET)
router.get('/:cedula', async (req, res) => {
    const { cedula } = req.params;
    try {
        const queryText = `
            SELECT cedula, nombre, cargo, ubicacion, salario
            FROM itaipu
            WHERE cedula = $1;`;
        const result = await db.query(queryText, [cedula]);
        if (result.rowCount > 0) {
            res.status(200).json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'Registro no encontrado.' });
        }
    } catch (err) {
        console.error('Error al obtener el registro por cédula:', err);
        res.status(500).json({ error: 'No se pudo obtener el registro.' });
    }
});

// 4. Crear un nuevo registro (POST)
router.post('/', async (req, res) => {
    const { cedula, nombre, cargo, ubicacion, salario } = req.body;
    try {
        const queryText = `
            INSERT INTO itaipu (cedula, nombre, cargo, ubicacion, salario)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;`;
        const values = [cedula, nombre, cargo, ubicacion, salario];
        const result = await db.query(queryText, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error al crear el registro:', err);
        res.status(500).json({ error: 'No se pudo crear el registro. Verifique que la cédula sea única.' });
    }
});

// 5. Actualizar un registro por cédula (PUT)
router.put('/:cedula', async (req, res) => {
    const { cedula } = req.params;
    const { nombre, cargo, ubicacion, salario } = req.body;
    try {
        const queryText = `
            UPDATE itaipu
            SET nombre = $1, cargo = $2, ubicacion = $3, salario = $4
            WHERE cedula = $5
            RETURNING *;`;
        const values = [nombre, cargo, ubicacion, salario, cedula];
        const result = await db.query(queryText, values);
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

// 6. Eliminar un registro por cédula (DELETE)
router.delete('/:cedula', async (req, res) => {
    const { cedula } = req.params;
    try {
        const queryText = 'DELETE FROM itaipu WHERE cedula = $1 RETURNING *;';
        const result = await db.query(queryText, [cedula]);
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