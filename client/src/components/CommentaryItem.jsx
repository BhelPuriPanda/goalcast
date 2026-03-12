const EVENT_ICONS = {
  goal:        '⚽',
  yellow_card: '🟨',
  red_card:    '🟥',
  substitution:'🔄',
  foul:        '⚠️',
  corner:      '🚩',
  offside:     '🚫',
  penalty:     '🎯',
  free_kick:   '💨',
  save:        '🧤',
  injury:      '🩹',
  var:         '📺',
  kickoff:     '🏁',
  halftime:    '🔔',
  fulltime:    '🏁',
  comment:     '💬',
};

export default function CommentaryItem({ item }) {
  const icon = EVENT_ICONS[item.eventType?.toLowerCase()] ?? '💬';
  const eventClass = item.eventType?.toLowerCase().replace(/\s+/g, '_') ?? '';

  return (
    <div className={`commentary-item ${eventClass}`}>
      <div className="ci-minute">
        {item.minute != null ? (
          <>
            <span className="ci-min-num">{item.minute}</span>
            <span className="ci-min-label">min</span>
          </>
        ) : (
          <span className="ci-min-label" style={{ fontSize: '1.3rem' }}>•</span>
        )}
      </div>
      <div className="ci-separator" />
      <div className="ci-body">
        <div className="ci-event-row">
          <span className="ci-event-icon">{icon}</span>
          <span className="ci-event-type">{item.eventType ?? 'comment'}</span>
          {item.actor && <span className="ci-actor">{item.actor}</span>}
        </div>
        <div className="ci-message">{item.message}</div>
        {item.period && <div className="ci-period">{item.period}</div>}
      </div>
    </div>
  );
}
