// components/common/Pagination.jsx
import { useTranslation } from "react-i18next";

export function Pagination({ page, totalPages, onPageChange }) {
  const { t } = useTranslation("common");

  if (totalPages <= 1) return null;

  return (
    <div className="d-flex justify-content-center align-items-center mt-3 mb-2 gap-4">
      {/* nút trước */}
      <button
        className="btn btn-outline-primary px-4"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
      >
        {t("pagination.previous")}
      </button>

      <span className="fw-bold fs-5 text-primary">
        {t("pagination.page", { page, totalPages })}
      </span>
      {/* nút tiếp theo */}
      <button
        className="btn btn-outline-primary px-4"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
      >
        {t("pagination.next")}
      </button>
    </div>
  );
}
