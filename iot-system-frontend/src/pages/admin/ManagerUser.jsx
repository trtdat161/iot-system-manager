import { useCallback, useEffect, useRef, useState } from "react";
import { DeleteAccount, GetAccounts } from "../../api/admin/accountApi";
import {
  FaTrash,
  FaLock,
  FaUnlock,
  FaEdit,
  FaCrown,
  FaUser,
  FaSearch,
  FaFilter,
  FaRedoAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LogoutAccount } from "../../api/common/authApi";
import dayjs from "dayjs";
import "../../css/admin/ManagerUserAndDevice.css";
import { Sidebar } from "../../components/admin/Sidebar";
import { MdManageAccounts } from "react-icons/md";
import { Pagination } from "../../components/common/Pagination";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";

export function ManagerUser() {
  const [deleteUser, setDeleteUser] = useState(null); // null nhận object
  const [deleteSuccess, setDeleteSuccess] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [selectedAccountIds, setSelectedAccountIds] = useState([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pages, setPages] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const PAGE_SIZE = 10;

  const [accounts, setAccounts] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const navigate = useNavigate();
  const [searchStatus, setSearchStatus] = useState(null);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [statusMenuPosition, setStatusMenuPosition] = useState(null);
  const statusFilterRef = useRef(null);
  const statusFilterButtonRef = useRef(null);
  const [searchName, setSearchName] = useState("");
  const [appliedSearch, setAppliedSearch] = useState(null);
  const { t } = useTranslation("admin_manager_user");
  const nameFilter = appliedSearch?.name?.trim().toLowerCase() ?? "";
  const statusFilter = appliedSearch?.status ?? "";
  const statusOptions = [
    { value: "", label: t("all_status") },
    { value: "true", label: t("active_status") },
    { value: "false", label: t("locked_status") },
  ];
  const selectedStatusLabel =
    statusOptions.find((option) => option.value === (searchStatus || ""))?.label ??
    statusOptions[0].label;
  const getStatusMenuPosition = useCallback(() => {
    const trigger = statusFilterButtonRef.current;
    if (!trigger) return null;

    const triggerBounds = trigger.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const gutter = 12;
    const width = Math.min(
      Math.max(triggerBounds.width, 180),
      Math.max(0, viewportWidth - gutter * 2),
    );

    return {
      top: triggerBounds.bottom + 4,
      left: Math.max(
        gutter,
        Math.min(triggerBounds.left, viewportWidth - gutter - width),
      ),
      width,
    };
  }, []);
  const visibleAccounts = accounts
    .map((account, pageIndex) => ({ account, pageIndex }))
    .filter(({ account }) => {
      const matchesStatus =
        !statusFilter || String(account.status) === statusFilter;
      const matchesName =
        !nameFilter ||
        (account.fullname ?? "").toLowerCase().includes(nameFilter);

      return matchesStatus && matchesName;
    });

  const removeAccount = async (id) => {
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      const response = await DeleteAccount(id);
      if (response.data) {
        setDeleteSuccess(t("delete_account_success"));
        setDeleteError("");
        setDeleteUser(null); //nếu api xoá ok thì set lại là null tức ko có id nào đc chọn nữa => dialog ẩn
        setSelectedAccountIds((ids) => ids.filter((accountId) => accountId !== id));
        const newPage = accounts.length === 1 && pages > 1 ? pages - 1 : pages; // nếu user chỉ còn 1 trên trang và ko phải trag 1 thì sau khi xoá sẽ về trang trước đó, ko thì vẫn ở trang hiện tại
        newPage !== pages
          ? setPages(newPage)
          : setRefreshIndex((value) => value + 1);
        /*
        nếu page thay đổi -> chuyển sang page mới, nếu page không đổi -> chỉ reload lại data của page hiện tại
        */
      } else {
        setDeleteUser(null);
        setDeleteError(t("delete_account_failed"));
      }
    } catch (err) {
      console.log("error:", err?.message || err);
      setDeleteUser(null);
      setDeleteError(t("delete_account_failed"));
    } finally {
      setIsDeleting(false);
    }
  };

  const removeSelectedAccounts = async () => {
    if (isDeleting || selectedAccountIds.length === 0) return;

    setIsDeleting(true);
    setDeleteError("");
    const selectedIds = [...selectedAccountIds];

    try {
      const results = await Promise.allSettled(
        selectedIds.map((id) => DeleteAccount(id)),
      );
      const deletedIds = results.flatMap((result, index) =>
        result.status === "fulfilled" && result.value.data
          ? [selectedIds[index]]
          : [],
      );
      const failedCount = selectedIds.length - deletedIds.length;

      setShowBulkDeleteDialog(false);
      setSelectedAccountIds((ids) =>
        ids.filter((id) => !deletedIds.includes(id)),
      );

      if (deletedIds.length > 0) {
        setDeleteSuccess(
          t("delete_selected_accounts_success", { count: deletedIds.length }),
        );
      }

      if (failedCount > 0) {
        setDeleteError(
          t("delete_selected_accounts_failed", {
            failed: failedCount,
            succeeded: deletedIds.length,
          }),
        );
      }

      const deletedOnCurrentPage = deletedIds.filter((id) =>
        accounts.some((account) => account.id === id),
      ).length;
      if (
        deletedOnCurrentPage === accounts.length &&
        deletedOnCurrentPage > 0 &&
        pages > 1
      ) {
        setPages((page) => page - 1);
      } else if (deletedIds.length > 0) {
        setRefreshIndex((value) => value + 1);
      }
    } catch (err) {
      console.log("error:", err?.message || err);
      setDeleteError(
        t("delete_selected_accounts_failed", {
          failed: selectedIds.length,
          succeeded: 0,
        }),
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleAccountSelection = (id) => {
    setSelectedAccountIds((ids) =>
      ids.includes(id) ? ids.filter((accountId) => accountId !== id) : [...ids, id],
    );
    setDeleteError("");
  };

  // search + filter
  const handleSearch = (name, status) => {
    setAppliedSearch({ name, status });
  };

  const handleReset = () => {
    setSearchName("");
    setSearchStatus("");
    setAppliedSearch(null);
    setPages(1);
  };

  useEffect(() => {
    let ignore = false;

    const loadAccounts = async () => {
      try {
        const response = await GetAccounts(pages, PAGE_SIZE);
        if (ignore) return;

        const paged = response.data;
        setTotalUsers(paged.totalItems ?? 0);
        setAccounts(Array.isArray(paged.data) ? paged.data : []);
        setTotalPages(paged.totalPages ?? 1);
      } catch (err) {
        if (ignore) return;
        console.log("error:", err?.message || err);
        setAccounts([]);
      }
    };

    loadAccounts();
    return () => {
      ignore = true;
    };
  }, [pages, refreshIndex]);

  useEffect(() => {
    if (!deleteSuccess) return undefined;

    const timeoutId = window.setTimeout(() => setDeleteSuccess(""), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [deleteSuccess]);

  useEffect(() => {
    if (!isStatusMenuOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!statusFilterRef.current?.contains(event.target)) {
        setIsStatusMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [isStatusMenuOpen]);

  useEffect(() => {
    if (!isStatusMenuOpen) return undefined;

    const updatePosition = () => {
      const position = getStatusMenuPosition();
      if (position) setStatusMenuPosition(position);
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [getStatusMenuPosition, isStatusMenuOpen]);

  return (
    <div>
      <h5 className="mb-3 fw-semibold parent">
        <div className="bg-white p-3 text-dark d-flex justify-content-between align-items-center shadow-sm border rounded-2">
          <div>
            <h4>
              {t("total_user")}{" "}
              <span
                className="badge rounded-pill text-white"
                style={{ backgroundColor: "#fd7e14" }}
              >
                {totalUsers}
              </span>
            </h4>
            <div className="title">
              <span className="account-count-badge">
                {t("manage_users")}
                <MdManageAccounts />
                {visibleAccounts.length}
              </span>
            </div>
          </div>
          {/* search */}
          <div className="search-filter-container">
            <div className="search-filter">
              <div className="filter-group manager-user-status-filter">
                <label className="filter-label">
                  <FaFilter size={14} />
                </label>
                <div
                  className="status-filter-dropdown"
                  ref={statusFilterRef}
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                      setIsStatusMenuOpen(false);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      setIsStatusMenuOpen(false);
                      statusFilterButtonRef.current?.focus();
                    }
                  }}
                >
                  <button
                    type="button"
                    className="status-filter-trigger"
                    ref={statusFilterButtonRef}
                    aria-label={t("status")}
                    aria-expanded={isStatusMenuOpen}
                    aria-controls="manager-user-status-options"
                    onClick={() => {
                      if (isStatusMenuOpen) {
                        setIsStatusMenuOpen(false);
                        return;
                      }

                      setStatusMenuPosition(getStatusMenuPosition());
                      setIsStatusMenuOpen(true);
                    }}
                  >
                    <span>{selectedStatusLabel}</span>
                    <span className="status-filter-chevron" aria-hidden="true">
                      ▾
                    </span>
                  </button>
                  {isStatusMenuOpen && (
                    <div
                      className="status-filter-menu"
                      id="manager-user-status-options"
                      role="group"
                      aria-label={t("status")}
                      style={{
                        position: "fixed",
                        ...statusMenuPosition,
                      }}
                    >
                      {statusOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className="status-filter-option"
                          aria-pressed={(searchStatus || "") === option.value}
                          onClick={() => {
                            setSearchStatus(option.value);
                            setIsStatusMenuOpen(false);
                            setStatusMenuPosition(null);
                            statusFilterButtonRef.current?.focus();
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="search-group">
                <FaSearch size={14} className="search-icon" />
                <input
                  type="text"
                  placeholder={t("search_users")}
                  className="search-input"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleSearch(searchName, searchStatus)
                  }
                />
              </div>

              <button
                className="btn btn-search"
                onClick={() => handleSearch(searchName, searchStatus)}
                title={t("search")}
              >
                <FaSearch size={14} />
              </button>

              <button
                className="btn btn-reset"
                onClick={handleReset}
                title={t("reset")}
              >
                <FaRedoAlt size={14} />
              </button>
            </div>
          </div>
        </div>
      </h5>
      {deleteSuccess && (
        <div className="alert alert-success" role="status">
          {deleteSuccess}
        </div>
      )}
      {deleteError && (
        <div className="alert alert-danger" role="alert">
          {deleteError}
        </div>
      )}
      <div className="table-wrapper-fixed">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: 50 }}>#</th>
                <th>{t("name")}</th>
                <th>{t("email")}</th>
                <th>{t("role")}</th>
                <th>{t("created_at")}</th>
                <th>{t("status")}</th>
                <th className="text-center">{t("actions")}</th>
                <th style={{ width: 72 }} className="text-center">
                  <button
                    type="button"
                    className={`btn btn-sm ${
                      selectedAccountIds.length > 0
                        ? "btn-outline-danger"
                        : "btn-outline-secondary"
                    }`}
                    title={t("delete_selected_accounts")}
                    aria-label={t("delete_selected_accounts")}
                    disabled={selectedAccountIds.length === 0}
                    onClick={() => setShowBulkDeleteDialog(true)}
                  >
                    <FaTrash size={13} />
                  </button>
                </th>
              </tr>
            </thead>

            <tbody>
              {visibleAccounts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center">
                    {t("no_user_data")}
                  </td>
                </tr>
              ) : (
                visibleAccounts.map(({ account, pageIndex }) => (
                  <tr key={account.id}>
                    {/* số thứ tự đúng theo trang */}
                    <td className="text-muted">
                      {(pages - 1) * PAGE_SIZE + pageIndex + 1}
                    </td>

                    {/* fullname */}
                    <td className="text-center">
                      {account.role === "admin" ? (
                        <span
                          className="d-inline-flex align-items-center gap-1 px-2 py-1 rounded-2 fw-semibold"
                          style={{
                            background:
                              "linear-gradient(135deg, #f59e0b, #d97706)",
                            color: "#fff",
                            fontSize: "0.78rem",
                          }}
                        >
                          <FaCrown size={13} />
                          {account.fullname}
                        </span>
                      ) : (
                        <span className="d-inline-flex align-items-center gap-1 text-muted">
                          <FaUser size={12} />
                          <span>{account.fullname}</span>
                        </span>
                      )}
                    </td>

                    {/* email */}
                    <td className="text-muted">{account.email}</td>

                    {/* role */}
                    <td className="text-muted">
                      {account.role === "admin" ? (
                        <span
                          style={{
                            fontWeight: "bold",
                            color: "#e9a112",
                          }}
                        >
                          {t("admin")}
                        </span>
                      ) : (
                        t("user")
                      )}
                    </td>

                    {/* created at */}
                    <td className="text-muted">
                      {dayjs(account.createdAt).format("DD/MM/YYYY HH:mm")}
                    </td>

                    {/* status */}
                    <td className="text-muted">
                      {account.status === true ? (
                        <span className="badge text-bg-success">
                          {t("active")}
                        </span>
                      ) : (
                        <span className="badge text-bg-danger">
                          {t("locked")}
                        </span>
                      )}
                    </td>

                    {/* actions */}
                    <td>
                      {/* nếu role là admin thì xử lý sẽ có nút edit thay vì khoá và xoá */}
                      {account.role === "admin" ? (
                        <button
                          className="btn btn-sm btn-outline-warning admin-edit d-inline-flex align-items-center gap-1"
                          onClick={() =>
                            navigate("/admin-frame-layout/profile")
                          }
                        >
                          <FaEdit size={12} />
                          <span>{t("edit_account_admin")}</span>
                        </button>
                      ) : (
                        <div className="d-flex justify-content-center gap-2">
                          {/* lock / unlock */}
                          <button
                            onClick={() =>
                              navigate(
                                `/admin-frame-layout/lock-account/${account.id}`,
                              )
                            }
                            className={`btn btn-sm d-inline-flex align-items-center gap-1 ${
                              account.status === true
                                ? "btn-outline-primary"
                                : "btn-outline-warning"
                            }`}
                            title={
                              account.status === false ? t("unlock") : t("lock")
                            }
                          >
                            {account.status === false ? (
                              <>
                                <FaUnlock size={12} />
                                <span>{t("unlock")}</span>
                              </>
                            ) : (
                              <>
                                <FaLock size={12} />
                                <span>{t("lock")}</span>
                              </>
                            )}
                          </button>

                          {/* delete */}
                          <button
                            onClick={() => setDeleteUser(account.id)} // lưu id để dialog hiện đúng row
                            className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1"
                            title={t("delete_account")}
                          >
                            <FaTrash size={12} />
                            <span>{t("delete")}</span>
                          </button>
                        </div>
                      )}
                    </td>

                    <td style={{ width: 72 }} className="text-center">
                      {account.role !== "admin" && (
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={selectedAccountIds.includes(account.id)}
                          aria-label={`${t("select_account")} ${account.fullname}`}
                          onChange={() => toggleAccountSelection(account.id)}
                        />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Dialog xác nhận xoá — đặt ngoài table */}
          <ConfirmDialog
            open={Boolean(deleteUser)}
            title={t("delete_account")}
            message={t("confirm_delete_account")}
            cancelLabel={t("cancel")}
            confirmLabel={t("delete")}
            DialogIcon={FaTrash}
            onCancel={() => setDeleteUser(null)}
            onConfirm={() => removeAccount(deleteUser)}
          />
          <ConfirmDialog
            open={showBulkDeleteDialog}
            title={t("delete_selected_accounts")}
            message={t("confirm_delete_selected_accounts", {
              count: selectedAccountIds.length,
            })}
            cancelLabel={t("cancel")}
            confirmLabel={t("delete")}
            DialogIcon={FaTrash}
            onCancel={() => setShowBulkDeleteDialog(false)}
            onConfirm={removeSelectedAccounts}
          />
        </div>

        {/* Pagination — dùng lại ở bất kỳ đâu chỉ cần 3 props */}
        <Pagination
          page={pages}
          totalPages={totalPages}
          onPageChange={setPages}
        />
      </div>
    </div>
  );
}
