export function LoadingSpinner({ size = 'medium', className = '' }) {
  const sizeClass = size === 'small' ? 'spinner-sm' : size === 'large' ? 'spinner-lg' : 'spinner-md';
  return (
    <div className={`spinner ${sizeClass} ${className}`} aria-label="Loading...">
      <div className="spinner-circle"></div>
    </div>
  );
}
