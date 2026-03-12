import MatchCard from './MatchCard';

export default function MatchList({ matches }) {
  if (!matches.length) return null;
  return (
    <div className="match-grid">
      {matches.map((m) => (
        <MatchCard key={m.id} match={m} />
      ))}
    </div>
  );
}
