// components/common/Pagination.jsx
export function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="d-flex justify-content-center align-items-center mt-3 mb-2 gap-4">
      {/* nút trước */}
      <button
        className="btn btn-outline-primary px-4"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
      >
        « Previous
      </button>

      <span className="fw-bold fs-5 text-primary">
        Page {page} / {totalPages}
      </span>
      {/* nút tiếp theo */}
      <button
        className="btn btn-outline-primary px-4"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
      >
        Next »
      </button>
    </div>
  );
}
