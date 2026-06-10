import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import condominiosRoutes from './routes/condominios';
import projecaoRouter from './routes/projecao';
import entradasRouter from './routes/entradas';
import pagamentosRouter from './routes/pagamentos';
import sindicosRouter from './routes/sindicos';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://condoflow-weld.vercel.app',
  ],
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/condominios', condominiosRoutes);
app.use('/api/condominios', projecaoRouter);
app.use('/api/condominios', entradasRouter);
app.use('/api/sindicos', sindicosRouter);
app.use('/api/condominios', pagamentosRouter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`CondoFlow API rodando em http://localhost:${PORT}`);
});