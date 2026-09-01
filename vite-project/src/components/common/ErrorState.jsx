import { AlertCircle } from 'lucide-react';

export function ErrorState({ title = 'Something went wrong', message = 'Unable to load data. Please try again.', onRetry }) {
  return (
    <div className="error-state-card">
      <AlertCircle size={28} className="error-icon" />
      <h3>{title}</h3>
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="primary-btn" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
}
