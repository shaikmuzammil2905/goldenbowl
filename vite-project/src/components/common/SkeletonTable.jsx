export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="skeleton-table">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-row">
          <div className="skeleton-cell col-sm"></div>
          <div className="skeleton-cell col-md"></div>
          <div className="skeleton-cell col-lg"></div>
          <div className="skeleton-cell col-sm"></div>
        </div>
      ))}
    </div>
  );
}
