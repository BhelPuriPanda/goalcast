import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fetchCommentary } from '../api/api';
import { fetchMatches } from '../api/api';
import { on, off, subscribeMatch, unsubscribeMatch } from '../ws/ws';
import StatusBadge from '../components/StatusBadge';
import CommentaryItem from '../components/CommentaryItem';

export default function MatchDetailPage() {
  const { id } = useParams();
  const matchId = Number(id);
  const navigate = useNavigate();

  const [match, setMatch] = useState(null);
  const [commentary, setCommentary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch match metadata + commentary on mount
  useEffect(() => {
    Promise.all([
      fetchMatches(100),
      fetchCommentary(matchId, 100),
    ])
      .then(([allMatches, commentaryData]) => {
        const found = allMatches.find((m) => m.id === matchId);
        if (!found) throw new Error('Match not found');
        setMatch(found);
        // Commentary comes newest-first from API; keep that order
        setCommentary(commentaryData);
      })
      .catch((e) => setError(e.message ?? 'Failed to load match'))
      .finally(() => setLoading(false));
  }, [matchId]);

  // Subscribe to WebSocket for this match
  useEffect(() => {
    subscribeMatch(matchId);

    function handleCommentary(item) {
      if (item.matchId !== matchId) return;
      setCommentary((prev) => {
        if (prev.some((c) => c.id === item.id)) return prev;
        return [item, ...prev];
      });
    }

    on('commentary-added', matchId, handleCommentary);

    return () => {
      off('commentary-added', matchId, handleCommentary);
      unsubscribeMatch(matchId);
    };
  }, [matchId]);

  if (loading) {
    return (
      <div className="container">
        <div className="state-container">
          <div className="spinner" />
          <div className="state-title">Loading match...</div>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="container">
        <div className="state-container">
          <div className="state-icon">⚠️</div>
          <div className="state-title">Match not found</div>
          <div className="state-subtitle">{error}</div>
        </div>
      </div>
    );
  }

  const startLabel = match.startTime
    ? format(new Date(match.startTime), 'EEEE, MMM d · HH:mm')
    : null;
  const endLabel = match.endTime
    ? format(new Date(match.endTime), 'HH:mm')
    : null;

  return (
    <div className="container">
      {/* Back nav */}
      <div className="detail-back" onClick={() => navigate('/')}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        All Matches
      </div>

      {/* Hero score card */}
      <div className={`match-hero ${match.status}`}>
        <div className="hero-top">
          <span className="hero-sport">{match.sport}</span>
          <StatusBadge status={match.status} />
        </div>

        <div className="hero-teams">
          <div className="hero-team">
            <div className="hero-team-name">{match.homeTeam}</div>
            <div className="hero-score">{match.homeScore ?? 0}</div>
          </div>

          <div className="hero-vs">
            <span>vs</span>
          </div>

          <div className="hero-team">
            <div className="hero-team-name">{match.awayTeam}</div>
            <div className="hero-score">{match.awayScore ?? 0}</div>
          </div>
        </div>

        {startLabel && (
          <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {startLabel}{endLabel ? ` – ${endLabel}` : ''}
          </div>
        )}
      </div>

      {/* Commentary feed */}
      <div className="feed-section">
        <div className="feed-title">
          {match.status === 'live' && <span className="live-dot" />}
          Live Commentary
          <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
            ({commentary.length})
          </span>
        </div>

        {commentary.length === 0 ? (
          <div className="state-container" style={{ paddingTop: 40, paddingBottom: 40 }}>
            <div className="state-icon">🎙️</div>
            <div className="state-title">No commentary yet</div>
            <div className="state-subtitle">Events will appear here in real time</div>
          </div>
        ) : (
          <div className="feed-list">
            {commentary.map((item) => (
              <CommentaryItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
