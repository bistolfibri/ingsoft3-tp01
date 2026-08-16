import app from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 FinFix Backend API escuchando en el puerto ${PORT}`);
  console.log(`🌐 Healthcheck disponible en: http://localhost:${PORT}/health`);
});
