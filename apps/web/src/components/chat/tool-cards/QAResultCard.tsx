interface QAResultCardProps {
  question: string;
  answer: string;
}

export function QAResultCard({ question, answer }: QAResultCardProps) {
  const truncated = answer.length > 100 ? answer.slice(0, 100) + '...' : answer;

  return (
    <div
      style={{
        background: '#252540',
        borderRadius: '8px',
        padding: '12px 16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
        <span style={{ color: '#9ca3af' }}>{question}</span>
        <span style={{ color: '#6b7280' }}>→</span>
        <span style={{ color: '#00bfff' }}>{truncated}</span>
      </div>
    </div>
  );
}