import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Scan from './pages/Scan.jsx';
import Guide from './pages/Guide.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import Quiz from './pages/Quiz.jsx';
import Me from './pages/Me.jsx';
import BinNight from './pages/BinNight.jsx';
import { Login, Register } from './pages/Auth.jsx';
import { useAuth } from './lib/auth.jsx';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-8 text-center text-ash">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="scan" element={<Scan />} />
        <Route path="guide" element={<Guide />} />
        <Route path="bin-night" element={<BinNight />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="quiz" element={<RequireAuth><Quiz /></RequireAuth>} />
        <Route path="me" element={<RequireAuth><Me /></RequireAuth>} />
        <Route path="dashboard" element={<Navigate to="/me" replace />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
