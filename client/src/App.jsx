import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import AdminPanel from './pages/AdminPanel';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Inventory from './pages/Inventory';
import Workers from './pages/Workers';
import AIDesignAssistant from './pages/AIDesignAssistant';
import AIChat from './pages/AIChat';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Global toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-strong)',
              fontSize: '14px',
              borderRadius: '10px',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#000' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#000' } },
          }}
        />

        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Navigate to="/login" replace />} />

          {/* Protected Routes */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminPanel /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute allowedRoles={['admin']}><Orders mode="admin" /></ProtectedRoute>} />
          <Route path="/my-orders" element={<ProtectedRoute allowedRoles={['worker']}><Orders mode="worker" /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute allowedRoles={['admin']}><Inventory /></ProtectedRoute>} />
          <Route path="/workers" element={<ProtectedRoute allowedRoles={['admin']}><Workers /></ProtectedRoute>} />
          <Route path="/ai-design" element={<ProtectedRoute allowedRoles={['admin']}><AIDesignAssistant /></ProtectedRoute>} />
          <Route path="/ai-chat" element={<ProtectedRoute allowedRoles={['worker']}><AIChat /></ProtectedRoute>} />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
