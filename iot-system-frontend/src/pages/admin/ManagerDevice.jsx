import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  GetDevices,
  AdminAddDevice,
  AdminDeleteDevice,
} from "../../api/admin/deviceApi";
import { FaTrash, FaEdit, FaPlus, FaMicrochip } from "react-icons/fa";
import { MdDevices } from "react-icons/md";
import dayjs from "dayjs";
import "../../css/admin/ManagerUser.css";

export function ManagerDevice() {
  const [devices, setDevices] = useState([]);
  const [name, setName] = useState(""); // tên thiết bị khi thêm
  const [deleteDevice, setDeleteDevice] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  const navigate = useNavigate();

  // Fetch list
  const fetchDevices = async () => {
    try {
      const response = await GetDevices();
      setDevices(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.log("error:", err?.message || err);
      setDevices([]);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

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
        <span className="bg-white text-dark px-3 py-2 rounded d-inline-flex align-items-center shadow-sm border">
          Quản lý thiết bị IoT
          <span className="ms-2">
            <MdDevices />
          </span>
        </span>
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
                  <td className="text-muted">{index + 1}</td>

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

        {/* Dialog xác nhận xoá */}
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
      </div>

      {/* Add Form Overlay */}
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
    </div>
  );
}
