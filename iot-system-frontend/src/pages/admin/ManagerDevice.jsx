import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  GetDevices,
  SearchDevice,
  AdminAddDevice,
  AdminDeleteDevice,
} from "../../api/admin/deviceApi";
import {
  FaTrash,
  FaEdit,
  FaPlus,
  FaMicrochip,
  FaSearch,
  FaFilter,
  FaRedoAlt,
} from "react-icons/fa";
import { MdDevices } from "react-icons/md";
import dayjs from "dayjs";
import "../../css/admin/ManagerUserAndDevice.css";
import { Pagination } from "../../components/common/Pagination";
import { Portal } from "../../components/common/Portal";

export function ManagerDevice() {
  const [devices, setDevices] = useState([]);
  const [name, setName] = useState(""); // tên thiết bị khi thêm
  const [deleteDevice, setDeleteDevice] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchStatus, setSearchStatus] = useState("");

  const navigate = useNavigate();
  const [pages, setPages] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 10; // số item trên mỗi trang

  // Fetch list
  const fetchDevices = async () => {
    try {
      const response = await GetDevices(pages, PAGE_SIZE);
      const paged = response.data;
      console.log("Fetched devices:", paged);
      setDevices(Array.isArray(paged.data) ? paged.data : []);
      setTotalPages(paged.totalPages ?? 1);
    } catch (err) {
      console.log("error:", err?.message || err);
      setDevices([]);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [pages]);

  // Validate
  const validate = () => {
    if (!name.trim()) {
      setAddError("Tên thiết bị không được để trống!");
      return false;
    }
    if (name.trim().length < 3) {
      setAddError("Tên thiết bị phải có ít nhất 3 ký tự!");
      return false;
    }
    return true;
  };

  // Add device
  // search + filter
  const handleSearch = async (keyword, status) => {
    try {
      const response = await SearchDevice(keyword, status);
      setDevices(Array.isArray(response.data) ? response.data : []);
      setTotalPages(1); // reset totalPages khi search
      setSearchName("");
    } catch (err) {
      console.log("error:", err?.message || err);
      setDevices([]);
      setTotalPages(1);
    }
  };

  const handleReset = () => {
    setSearchName("");
    setSearchStatus("");
    if (pages === 1) {
      fetchDevices(); // nếu đã ở page 1 thì phải gọi trực tiếp
    } else {
      setPages(1); // nếu không phải page 1 thì setPages(1) sẽ trigger useEffect
    }
  };

  const handleAddDevice = async (e) => {
    e.preventDefault();
    setAddError("");

    if (!validate()) {
      return;
    }

    setAddLoading(true);
    try {
      const response = await AdminAddDevice({ name: name.trim() }); // thực ra ko cần .trim() nhưng để tự bảo vệ nên ta thêm cho chắc
      if (response.data) {
        setShowAddForm(false);
        setName("");
        fetchDevices();
      } else {
        setAddError("Thêm thiết bị thất bại!");
      }
    } catch (err) {
      setAddError(err?.response?.data?.message || "Thêm thiết bị thất bại!");
    } finally {
      setAddLoading(false);
    }
  };

  const closeAddForm = () => {
    if (addLoading) return;
    setShowAddForm(false);
    setName("");
    setAddError("");
  };

  // Delete device
  const removeDevice = async (id) => {
    try {
      const response = await AdminDeleteDevice(id);
      if (response.data) {
        setDeleteDevice(null);
        fetchDevices();
        const newPage = devices.length === 1 && pages > 1 ? pages - 1 : pages; // nếu user chỉ còn 1 trên trang và ko phải trag 1 thì sau khi xoá sẽ về trang trước đó, ko thì vẫn ở trang hiện tại
        newPage !== pages ? setPages(newPage) : fetchDevices(pages);
      } else {
        setDeleteDevice(null);
      }
    } catch (err) {
      console.log("error:", err?.message || err);
      setDeleteDevice(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <h5 className="mb-3 fw-semibold parent">
        <div className="bg-white p-3 text-dark d-flex justify-content-between align-items-center shadow-sm border rounded-2">
          <div className="title">
            <span className="account-count-badge">
              Quản lý thiết bị IoT
              <MdDevices />
              {devices.length}
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
                  value={searchStatus}
                  onChange={(e) => setSearchStatus(e.target.value)}
                >
                  <option value="" className="text-center">
                    Tất cả trạng thái
                  </option>
                  <option value="true" className="text-center">
                    Hoạt động
                  </option>
                  <option value="false" className="text-center">
                    Ngừng hoạt động
                  </option>
                </select>
              </div>

              <div className="search-group">
                <FaSearch size={14} className="search-icon" />
                <input
                  type="text"
                  placeholder="Tìm kiếm thiết bị..."
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
                title="Tìm kiếm"
              >
                <FaSearch size={14} />
              </button>

              <button
                className="btn btn-reset"
                onClick={handleReset}
                title="Đặt lại"
              >
                <FaRedoAlt size={14} />
              </button>
            </div>
          </div>
        </div>
      </h5>

      {/* Nút thêm */}
      <div className="mb-3">
        <button
          className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1"
          onClick={() => setShowAddForm(true)}
        >
          <FaPlus size={11} />
          <span>Thêm thiết bị</span>
        </button>
      </div>

      {/* Table */}
      <div className="table-wrapper-fixed">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: 50 }}>#</th>
                <th>Tên thiết bị</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th colSpan={2}>Hành động</th>
              </tr>
            </thead>

            <tbody>
              {devices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">
                    Chưa có thiết bị nào
                  </td>
                </tr>
              ) : (
                devices.map((device, index) => (
                  <tr key={device.id}>
                    <td className="text-muted">
                      {(pages - 1) * PAGE_SIZE + index + 1}
                    </td>

                    <td>
                      <span className="d-inline-flex align-items-center gap-1 text-muted">
                        <FaMicrochip size={12} />
                        <span>{device.name}</span>
                      </span>
                    </td>

                    <td>
                      {device.status === true ? (
                        <span className="badge text-bg-success">Hoạt động</span>
                      ) : (
                        <span className="badge text-bg-danger">
                          Ngừng hoạt động
                        </span>
                      )}
                    </td>

                    <td className="text-muted">
                      {dayjs(device.createdAt).format("DD/MM/YYYY HH:mm")}
                    </td>

                    <td>
                      <div className="d-flex gap-2">
                        <button
                          onClick={() =>
                            navigate(`/frame-layout/edit-device/${device.id}`)
                          }
                          className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                        >
                          <FaEdit size={12} />
                          <span>Sửa</span>
                        </button>

                        <button
                          onClick={() => setDeleteDevice(device.id)}
                          className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1"
                        >
                          <FaTrash size={12} />
                          <span>Xoá</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Dialog xác nhận xoá */}
        <Portal>
          {deleteDevice && (
            <div
              className="sure-delete-overlay"
              onClick={() => setDeleteDevice(null)}
            >
              <div className="sure-delete" onClick={(e) => e.stopPropagation()}>
                <span>Xác nhận xoá thiết bị này?</span>
                <div className="sure-delete-actions">
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => removeDevice(deleteDevice)}
                  >
                    Xoá
                  </button>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => setDeleteDevice(null)}
                  >
                    Huỷ
                  </button>
                </div>
              </div>
            </div>
          )}
        </Portal>

        {/* Pagination */}
        <Pagination
          page={pages}
          totalPages={totalPages}
          onPageChange={setPages}
        />
      </div>

      {/* Add Form Overlay */}
      <Portal>
        {showAddForm && (
          <div className="sure-delete-overlay" onClick={closeAddForm}>
            <div
              className="sure-delete"
              style={{ minWidth: 340, maxWidth: 440, gap: "1rem" }}
              onClick={(e) => e.stopPropagation()}
            >
              <span className="fw-semibold" style={{ fontSize: "1rem" }}>
                Thêm thiết bị mới
              </span>

              {addError && (
                <div
                  className="text-danger"
                  style={{ fontSize: "0.82rem", marginTop: "-0.5rem" }}
                >
                  {addError}
                </div>
              )}

              <form
                onSubmit={handleAddDevice}
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.85rem",
                }}
              >
                <div>
                  <label
                    className="form-label fw-semibold mb-1"
                    style={{ fontSize: "0.83rem" }}
                  >
                    Tên thiết bị
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="VD: Cảm biến khí gas nhà A"
                    disabled={addLoading}
                  />
                </div>

                <div
                  className="sure-delete-actions"
                  style={{ marginTop: "0.25rem" }}
                >
                  <button
                    type="submit"
                    className="btn btn-sm btn-primary"
                    disabled={addLoading}
                  >
                    {addLoading ? "Đang thêm..." : "Thêm"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={closeAddForm}
                    disabled={addLoading}
                  >
                    Huỷ
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </Portal>
    </div>
  );
}
