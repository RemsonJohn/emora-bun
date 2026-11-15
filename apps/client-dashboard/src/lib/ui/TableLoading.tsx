export function TableLoading() {
  return (
    <div className="table-skeleton" aria-label="Loading records" role="status">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i}>
          <span />
          <span />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}
