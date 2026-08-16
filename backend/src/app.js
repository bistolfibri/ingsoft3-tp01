import express from 'express';
import cors from 'cors';
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

export default app;
