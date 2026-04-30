import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TaskDetail from './pages/TaskDetail';
import Team from './pages/Team';
import TimeTracker from './pages/TimeTracker';
import TimeReport from './pages/TimeReport';

function PrivateRoute({ children, ownerOnly }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (ownerOnly && user.role !== 'owner') return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/tasks/:id" element={<PrivateRoute><TaskDetail /></PrivateRoute>} />
          <Route path="/time" element={<PrivateRoute><TimeTracker /></PrivateRoute>} />
          <Route path="/report" element={<PrivateRoute><TimeReport /></PrivateRoute>} />
          <Route path="/team" element={<PrivateRoute ownerOnly><Team /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
