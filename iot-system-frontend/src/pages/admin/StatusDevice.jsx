import { useCallback, useEffect, useState } from "react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router-dom";
import { GetStatusDevice } from "../../api/admin/deviceApi";
import { Pagination } from "../../components/common/Pagination";
import "../../css/admin/ManagerUserAndDevice.css";

const PAGE_SIZE = 10;

function isDeviceOnline(lastSeenAt) {
  if (!lastSeenAt) return false;

  const lastSeenTime = Date.parse(lastSeenAt);
  return Number.isFinite(lastSeenTime) && Date.now() - lastSeenTime <= 30_000;
}

export function StatusDevice() {
  const { t } = useTranslation("admin_manager_device");
  const { connection } = useOutletContext() || {};
  const [devices, setDevices] = useState([]);
  const [totalDevices, setTotalDevices] = useState(0);
  const [pages, setPages] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDevices = useCallback(
    async (currentPage, status, { silent = false } = {}) => {
      if (!silent) setLoading(true);
      setError("");

      try {
        const response = await GetStatusDevice(currentPage, PAGE_SIZE, status);
        const paged = response.data;
        setDevices(Array.isArray(paged.data) ? paged.data : []);
        setTotalDevices(paged.totalItems ?? 0);
        setTotalPages(paged.totalPages ?? 1);
      } catch (err) {
        console.error("Failed to load device statuses:", err);
        setDevices([]);
        setTotalDevices(0);
        setTotalPages(1);
        setError(t("load_devices_failed"));
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    fetchDevices(pages, statusFilter);
  }, [fetchDevices, pages, statusFilter]);

  useEffect(() => {
    if (!connection) return undefined;

    const handleDeviceStatus = () => {
      fetchDevices(pages, statusFilter, { silent: true });
    };

    connection.on("ReceiveDeviceStatus", handleDeviceStatus);
    return () => connection.off("ReceiveDeviceStatus", handleDeviceStatus);
  }, [connection, fetchDevices, pages, statusFilter]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchDevices(pages, statusFilter, { silent: true });
      }
    }, 30_000);

    return () => window.clearInterval(intervalId);
  }, [fetchDevices, pages, statusFilter]);

  const handleStatusChange = (event) => {
    setStatusFilter(event.target.value);
    setPages(1);
  };

  return (
    <div>
      <h5 className="mb-3 fw-semibold parent">
        <div className="bg-white p-3 text-dark d-flex justify-content-between align-items-center shadow-sm border rounded-2">
          <div>
            <h4>
              {t("total_devices")}{" "}
              <span
                className="badge rounded-pill text-white"
                style={{ backgroundColor: "#fd7e14" }}
              >
                {totalDevices}
              </span>
            </h4>
            <div className="title">
              <span className="account-count-badge">
                {t("manage_devices")} {devices.length}
              </span>
            </div>
          </div>
          <div className="search-filter-container">
            <div className="search-filter">
              <div className="filter-group">
                <label className="filter-label" htmlFor="device-status-filter">
                  {t("status")}
                </label>
                <select
                  id="device-status-filter"
                  className="filter-select"
                  value={statusFilter}
                  onChange={handleStatusChange}
                >
                  <option value="">{t("all_status")}</option>
                  <option value="online">{t("online")}</option>
                  <option value="offline">{t("offline")}</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </h5>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="table-wrapper-fixed">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: 50 }}>#</th>
                <th>{t("name")}</th>
                <th>{t("mac_address")}</th>
                <th>{t("status")}</th>
                <th>{t("claim_status")}</th>
                <th>{t("last_seen_at")}</th>
                <th>{t("created_at")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center">
                    {t("loading_devices")}
                  </td>
                </tr>
              ) : devices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center">
                    {t("no_device_data")}
                  </td>
                </tr>
              ) : (
                devices.map((device, index) => {
                  // Luôn tính từ lastSeenAt, không phụ thuộc bộ lọc đang chọn
                  const online = isDeviceOnline(device.lastSeenAt);

                  return (
                    <tr key={device.id}>
                      <td className="text-muted">
                        {(pages - 1) * PAGE_SIZE + index + 1}
                      </td>
                      <td className="fw-semibold">{device.name}</td>
                      <td className="text-muted">{device.macAddress}</td>
                      <td>
                        <span
                          className={`badge ${
                            online ? "text-bg-success" : "text-bg-secondary"
                          }`}
                        >
                          {online ? t("online") : t("offline")}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            device.isClaimed
                              ? "text-bg-primary"
                              : "text-bg-light"
                          }`}
                        >
                          {device.isClaimed ? t("claimed") : t("unclaimed")}
                        </span>
                      </td>
                      <td className="text-muted">
                        {device.lastSeenAt
                          ? dayjs(device.lastSeenAt).format(
                              "DD/MM/YYYY HH:mm:ss",
                            )
                          : t("not_available")}
                      </td>
                      <td className="text-muted">
                        {dayjs(device.createdAt).format("DD/MM/YYYY HH:mm")}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={pages}
          totalPages={totalPages}
          onPageChange={setPages}
        />
      </div>
    </div>
  );
}
