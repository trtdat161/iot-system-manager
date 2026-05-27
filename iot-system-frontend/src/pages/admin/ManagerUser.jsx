import { useEffect, useState, useTransition } from "react";
import {
  DeleteAccount,
  GetAccounts,
  SearchAccount,
} from "../../api/admin/accountApi";
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
import { LogoutAccount } from "../../api/authApi";
import dayjs from "dayjs";
import "../../css/admin/ManagerUser.css";
import { Sidebar } from "../../components/admin/Sidebar";
import { MdManageAccounts } from "react-icons/md";
import { Pagination } from "../../components/common/Pagination";

export function ManagerUser() {
  const [errorAccount, setErrorAccount] = useState("");
  const [deleteUser, setDeleteUser] = useState(null); // null nhận object
  const [pages, setPages] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 8;

  const [accounts, setAccounts] = useState([]);
  const navigate = useNavigate();
  const [searchStatus, setSearchStatus] = useState(null);
  const [searchName, setSearchName] = useState("");
  const { t, i18n } = useTranslation("admin_manager_user");

  const fetchAccounts = async (currentPage) => {
    try {
      const response = await GetAccounts(currentPage, PAGE_SIZE);
      const paged = response.data;
      // i18n.changeLanguage(localStorage.getItem("lang") || "vi-VN");
      setAccounts(Array.isArray(paged.data) ? paged.data : []);
      setTotalPages(paged.totalPages ?? 1);
    } catch (err) {
      console.log("error:", err?.message || err);
      setAccounts([]);
    }
  };

  const removeAccount = async (id) => {
    try {
      const response = await DeleteAccount(id);
      if (response.data) {
        setDeleteUser(null); //set lại là null tức ko có id nào đc chọn nữa => dialog ẩn
        const newPage = accounts.length === 1 && pages > 1 ? pages - 1 : pages;
        newPage !== page ? setPages(newPage) : fetchAccounts(page);
      } else {
        setDeleteUser(null);
      }
    } catch (err) {
      console.log("error:", err?.message || err);
      setDeleteUser(null);
    }
  };

  // search + filter
  const handleSearch = async (name, status) => {
    try {
      const response = await SearchAccount(name, status);
      setAccounts(Array.isArray(response.data) ? response.data : []);
      setSearchName("");
    } catch (err) {
      console.log("error:", err?.message || err);
      setAccounts([]);
    }
  };

  const handleReset = () => {
    setSearchName("");
    setSearchStatus("true");
    fetchAccounts(1);
  };

  useEffect(() => {
    fetchAccounts(pages);
  }, [pages]);

  return (
    <div>
      <h5 className="mb-3 fw-semibold parent">
        <div className="bg-white p-3 text-dark d-flex justify-content-between align-items-center shadow-sm border rounded-2">
          <div className="title">
            {t("manage_users")}
            <span className="account-count-badge">
              <MdManageAccounts />
              {accounts.length}
            </span>
          </div>
          {/* search */}
          <div className="search-filter-container">
            <div className="search-filter">
              <div className="filter-group">
                <label className="filter-label">
                  <FaFilter size={14} />
                </label>
                <select
                  className="filter-select"
                  value={searchStatus || ""}
                  onChange={(e) => setSearchStatus(e.target.value)}
                >
                  <option value="" className="text-center">
                    {t("all_status")}
                  </option>
                  <option value="true" className="text-center">
                    {t("active_status")}
                  </option>
                  <option value="false" className="text-center">
                    {t("locked_status")}
                  </option>
                </select>
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
      {/* demo in tạm */}
      {errorAccount && <span className="text-danger">{errorAccount}</span>}
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
              <th colSpan={2}>{t("actions")}</th>
            </tr>
          </thead>

          <tbody>
            {accounts.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center">
                  {t("no_user_data")}
                </td>
              </tr>
            ) : (
              accounts.map((account, index) => (
                <tr key={account.id}>
                  {/* số thứ tự đúng theo trang */}
                  <td className="text-muted">
                    {(pages - 1) * PAGE_SIZE + index + 1}
                  </td>

                  {/* fullname */}
                  <td>
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
                      <button className="btn btn-sm btn-outline-warning admin-edit d-inline-flex align-items-center gap-1">
                        <FaEdit size={12} />
                        <span>{t("edit_account_admin")}</span>
                      </button>
                    ) : (
                      <div className="d-flex gap-2">
                        {/* lock / unlock */}
                        <button
                          onClick={() =>
                            navigate(`/frame-layout/lock-account/${account.id}`)
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
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Dialog xác nhận xoá — đặt ngoài table */}
        {deleteUser && (
          <div
            className="sure-delete-overlay"
            onClick={() => setDeleteUser(null)}
          >
            <div className="sure-delete" onClick={(e) => e.stopPropagation()}>
              <span>{t("confirm_delete_account")}</span>
              <div className="sure-delete-actions">
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => removeAccount(deleteUser)}
                >
                  {t("delete")}
                </button>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => setDeleteUser(null)}
                >
                  {t("cancel")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pagination — dùng lại ở bất kỳ đâu chỉ cần 3 props */}
      <Pagination
        page={pages}
        totalPages={totalPages}
        onPageChange={setPages}
      />
    </div>
  );
}
