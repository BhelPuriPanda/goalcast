export default function StatusBadge({ status }) {
  const label = { scheduled: 'Scheduled', live: 'Live', finished: 'FT' }[status] ?? status;
  return (
    <span className={`status-badge ${status}`}>
      {status === 'live' && <LiveDot />}
      {label}
    </span>
  );
}

function LiveDot() {
  return <span className="live-dot" />;
}
