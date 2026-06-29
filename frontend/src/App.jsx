// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import WorkspacePage from './pages/WorkspacePage';
import Sidebar from './components/Sidebar';
import { Loader2 } from 'lucide-react';
import './index.css';

function WorkspacePageWithKey() {
  const { workspaceId } = useParams();
  return <WorkspacePage key={workspaceId} />;
}

function AppShell() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-bg flex items-center justify-center">
        <Loader2 className="w-7 h-7 text-[#c4a0b8] spin" />
      </div>
    );
  }

  if (!user) return <AuthPage />;

  return (
    <div className="flex h-screen overflow-hidden page-bg">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden page-content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/workspace/:workspaceId" element={<WorkspacePageWithKey />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}