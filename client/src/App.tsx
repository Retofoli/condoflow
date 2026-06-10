import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Navbar } from './components/Navbar';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Condominio } from './pages/Condominio';
import Projecao from './pages/Projecao';
import Simulador from './pages/Simulador';
import { Usuario } from './types';
import Entradas from './pages/Entradas';
import Pagamentos from './pages/Pagamentos';
import Sindicos from './pages/Sindicos';

function Layout({ children, usuario, onLogout }: { children: React.ReactNode; usuario: Usuario; onLogout: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar usuario={usuario} onLogout={onLogout} />
      <main>{children}</main>
    </div>
  );
}

export default function App() {
  const auth = useAuth();

  if (auth.carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <LoadingSpinner texto="Carregando..." />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            auth.usuario ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onLogin={auth.login} />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            auth.usuario ? (
              <Layout usuario={auth.usuario} onLogout={auth.logout}>
                <Dashboard />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/sindicos"
          element={
            auth.usuario ? (
              <Layout usuario={auth.usuario} onLogout={auth.logout}>
                <Sindicos />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/condominios/:id"
          element={
            auth.usuario ? (
              <Layout usuario={auth.usuario} onLogout={auth.logout}>
                <Condominio />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/condominios/:id/projecao"
          element={
            auth.usuario ? (
              <Layout usuario={auth.usuario} onLogout={auth.logout}>
                <Projecao />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/condominios/:id/entradas"
          element={
            auth.usuario ? (
              <Layout usuario={auth.usuario} onLogout={auth.logout}>
                <Entradas />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/condominios/:id/pagamentos"
          element={
            auth.usuario ? (
              <Layout usuario={auth.usuario} onLogout={auth.logout}>
                <Pagamentos />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/condominios/:id/simulador"
          element={
            auth.usuario ? (
              <Layout usuario={auth.usuario} onLogout={auth.logout}>
                <Simulador />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="/" element={<Navigate to={auth.usuario ? '/dashboard' : '/login'} replace />} />
        <Route path="*" element={<Navigate to={auth.usuario ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
