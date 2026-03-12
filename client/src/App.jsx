import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MatchesPage from './pages/MatchesPage';
import MatchDetailPage from './pages/MatchDetailPage';
import './ws/ws'; // boot the WS connection on load

function Navbar() {
  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <span className="navbar-logo">⚡ Goalcast</span>
        <span className="navbar-subtitle">Live Sports</span>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<MatchesPage />} />
        <Route path="/matches/:id" element={<MatchDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}
