import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';

export default function MatchCard({ match }) {
  const navigate = useNavigate();

  const startLabel = match.startTime
    ? format(new Date(match.startTime), 'MMM d · HH:mm')
    : '—';

  return (
    <div
      className={`match-card ${match.status}`}
      onClick={() => navigate(`/matches/${match.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/matches/${match.id}`)}
    >
      <div className="card-header">
        <span className="sport-tag">{match.sport}</span>
        <StatusBadge status={match.status} />
      </div>

      <div className="teams-row">
        <div className="team-block">
          <div className="team-score">{match.homeScore ?? 0}</div>
          <div className="team-name">{match.homeTeam}</div>
        </div>
        <div className="score-divider">—</div>
        <div className="team-block">
          <div className="team-score">{match.awayScore ?? 0}</div>
          <div className="team-name">{match.awayTeam}</div>
        </div>
      </div>

      <div className="card-footer">
        <span className="card-time">{startLabel}</span>
      </div>
    </div>
  );
}
