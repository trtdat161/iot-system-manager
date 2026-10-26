import { useTranslation } from "react-i18next";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "../../css/Pagination.css";

const MAX_VISIBLE_PAGES = 5;

export function Pagination({ page, totalPages, onPageChange }) {
  const { t } = useTranslation("common");
  if (totalPages <= 1) return null;

  const visiblePageCount = Math.min(MAX_VISIBLE_PAGES, totalPages);
  const firstVisiblePage = Math.min(
    Math.max(1, page - Math.floor(visiblePageCount / 2)),
    totalPages - visiblePageCount + 1,
  );
  const pages = Array.from(
    { length: visiblePageCount },
    (_, index) => firstVisiblePage + index,
  );

  return (
    <nav
      className="pagination-controls d-flex justify-content-center align-items-center mt-3 mb-2"
      aria-label={t("pagination.navigation")}
    >
      <button
        type="button"
        className="btn btn-outline-primary pagination-arrow"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label={t("pagination.previous")}
      >
        <FaChevronLeft aria-hidden="true" />
      </button>
      <div className="pagination-pages" role="group" aria-label={t("pagination.pages")}>
        {pages.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            className={`pagination-page${pageNumber === page ? " active" : ""}`}
            onClick={() => onPageChange(pageNumber)}
            aria-label={t("pagination.goToPage", { page: pageNumber })}
            aria-current={pageNumber === page ? "page" : undefined}
          >
            {pageNumber}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="btn btn-outline-primary pagination-arrow"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        aria-label={t("pagination.next")}
      >
        <FaChevronRight aria-hidden="true" />
      </button>
    </nav>
  );
}