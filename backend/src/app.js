import express from 'express';
import cors from 'cors';
import * as Sentry from '@sentry/node';
import expenseRoutes from './routes/expenseRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

// Endpoints API
app.use('/api', expenseRoutes);

// Healthcheck endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'FinFix Backend API', timestamp: new Date().toISOString() });
});

// TEMPORAL (TP9): provoca un error para verlo en Sentry. Sacar al terminar.
app.get('/api/falla', () => {
  throw new Error('Falla de prueba del TP9');
});

// Va después de todas las rutas: le pasa a Sentry los errores no manejados.
Sentry.setupExpressErrorHandler(app);

export default app;
