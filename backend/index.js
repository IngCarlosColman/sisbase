const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 8000;

// Importar las rutas de las diferentes tablas
const personapRoutes = require('./routes/personap');
const personasRoutes = require('./routes/personas');
const industriasRoutes = require('./routes/industrias');
const abogadosRoutes = require('./routes/abogados');
const itaipuRoutes = require('./routes/itaipu');
const yacyretaRoutes = require('./routes/yacyreta');
const estRuralesRoutes = require('./routes/est_rurales');
const estacionesRouter = require('./routes/estaciones');
const importadoresRouter = require('./routes/importadores');
const exportagricolaRouter = require('./routes/exportagricola');
const futbolistasRoutes = require('./routes/futbolistas');
const politicosRouter = require('./routes/politicos');
const medicosRoutes = require('./routes/medicos');
const despachantesRouter = require('./routes/despachantes'); // <-- NUEVA LÍNEA
const staRitaRouter = require('./routes/sta_rita');

// Middleware para procesar el cuerpo de las solicitudes y habilitar CORS
app.use(express.json());
app.use(cors());

// Conectar las rutas con sus respectivos endpoints
app.use('/api/personap', personapRoutes);
app.use('/api/personas', personasRoutes);
app.use('/api/industrias', industriasRoutes);
app.use('/api/abogados', abogadosRoutes);
app.use('/api/itaipu', itaipuRoutes);
app.use('/api/yacyreta', yacyretaRoutes);
app.use('/api/est-rurales', estRuralesRoutes);
app.use('/api/estaciones', estacionesRouter);
app.use('/api/importadores', importadoresRouter);
app.use('/api/exportagricola', exportagricolaRouter);
app.use('/api/futbolistas', futbolistasRoutes);
app.use('/api/politicos', politicosRouter);
app.use('/api/medicos', medicosRoutes);
app.use('/api/despachantes', despachantesRouter); // <-- NUEVA LÍNEA
app.use('/api/contri_sta_rita', staRitaRouter);
// Ruta principal para verificar que el servidor está en funcionamiento
app.get('/', (req, res) => {
    res.send('Servidor de SisBase en funcionamiento.');
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});