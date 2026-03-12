import { useEffect, useState } from 'react';
import { fetchMatches } from '../api/api';
import { on, off } from '../ws/ws';
import MatchList from '../components/MatchList';

export default function MatchesPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMatches(50)
      .then(setMatches)
      .catch(() => setError('Could not load matches. Is the server running?'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function handleMatchCreated(newMatch) {
      setMatches((prev) => {
        // avoid duplicates
        if (prev.some((m) => m.id === newMatch.id)) return prev;
        return [newMatch, ...prev];
      });
    }

    on('match-created', null, handleMatchCreated);
    return () => off('match-created', null, handleMatchCreated);
  }, []);

  const liveCount = matches.filter((m) => m.status === 'live').length;

  if (loading) {
    return (
      <div className="container">
        <div className="state-container">
          <div className="spinner" />
          <div className="state-title">Loading matches...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="state-container">
          <div className="state-icon">⚠️</div>
          <div className="state-title">Connection Error</div>
          <div className="state-subtitle">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">
          Live Matches
          {liveCount > 0 && (
            <span style={{ marginLeft: 12, fontSize: '1rem', color: 'var(--live)', fontWeight: 600 }}>
              {liveCount} live
            </span>
          )}
        </h1>
        <p className="page-subtitle">
          {matches.length === 0
            ? 'No matches yet — check back soon'
            : `${matches.length} match${matches.length !== 1 ? 'es' : ''} · updates in real-time`}
        </p>
      </div>

      {matches.length === 0 ? (
        <div className="state-container">
          <div className="state-icon">🏟️</div>
          <div className="state-title">No matches scheduled</div>
          <div className="state-subtitle">New matches will appear here automatically</div>
        </div>
      ) : (
        <MatchList matches={matches} />
      )}
    </div>
  );
}
