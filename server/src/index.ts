import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import condominiosRoutes from './routes/condominios';
import projecaoRouter from './routes/projecao';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/condominios', condominiosRoutes);
app.use('/api/condominios', projecaoRouter);
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`CondoFlow API rodando em http://localhost:${PORT}`);
});
