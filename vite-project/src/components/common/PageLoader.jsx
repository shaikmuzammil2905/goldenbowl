import { LoadingSpinner } from './LoadingSpinner';

export function PageLoader({ text = 'Loading Golden Food Bowl...' }) {
  return (
    <div className="page-loader-overlay">
      <LoadingSpinner size="large" />
      <p className="page-loader-text">{text}</p>
    </div>
  );
}
