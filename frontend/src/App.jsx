import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import Employees from './pages/Employees';
import Assignments from './pages/Assignments';
import History from './pages/History';
import AvailableAssets from './pages/AvailableAssets';
import MyAssets from './pages/MyAssets';
import Requests from './pages/Requests';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return user.role === 'admin' ? children : <Navigate to="/available-assets" replace />;
}

function AppRoutes() {
  const { user } = useAuth();
  const home = user?.role === 'employee' ? '/available-assets' : '/';
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={home} replace /> : <Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={user?.role === 'employee' ? <Navigate to="/available-assets" replace /> : <Dashboard />} />
        <Route path="assets" element={<AdminRoute><Assets /></AdminRoute>} />
        <Route path="employees" element={<AdminRoute><Employees /></AdminRoute>} />
        <Route path="assignments" element={<AdminRoute><Assignments /></AdminRoute>} />
        <Route path="requests" element={<AdminRoute><Requests /></AdminRoute>} />
        <Route path="available-assets" element={<AvailableAssets />} />
        <Route path="my-assets" element={<MyAssets />} />
        <Route path="my-requests" element={<Requests />} />
        <Route path="history" element={<AdminRoute><History /></AdminRoute>} />
      </Route>
      <Route path="*" element={<Navigate to={home} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{
          style: { borderRadius: '10px', background: '#7c2d12', color: '#fff' },
          success: { iconTheme: { primary: '#f59e0b', secondary: '#fff' } },
        }} />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
