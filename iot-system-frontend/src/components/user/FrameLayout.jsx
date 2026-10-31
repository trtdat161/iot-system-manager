import { Link, Outlet, useLocation } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FaBell,
  FaChevronRight,
  FaHome,
  FaMicrochip,
  FaUserCircle,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../switchLanguage/LanguageSwitch";
import { Sidebar } from "./Sidebar";
import { UserGetMe } from "../../api/user/accountApi";
import { GetConnectedDevice } from "../../api/user/connectDevice";
import { UserGetHistory } from "../../api/user/notification";
import { useDeviceSignalR } from "../../hooks/useDeviceSignalR";

const NOTIFICATION_PAGE_SIZE = 100;

const isUnreadNotification = (notification) =>
  notification.isRead === false || notification.IsRead === false;

export function FrameLayoutUser() {
  const [collapsed, setCollapsed] = useState(false);
  const [fullname, setFullname] = useState("");
  const [deviceMac, setDeviceMac] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [, setLiveAlertCount] = useState(0);
  const unreadCountDelta = useRef(0);
  const location = useLocation();
  const { t } = useTranslation("user_frame_layout");
  const connection = useDeviceSignalR(deviceMac);

  const breadcrumbs = [
    {
      to: "/user-frame-layout/dashboard-user",
      label: t("home"),
      icon: <FaHome size={14} />,
    },
    { to: "/user-frame-layout/device-notifications", label: t("notification") },
    {
      to: "/user-frame-layout/waiting-connection",
      label: t("waiting_connection"),
      icon: <FaMicrochip size={13} />,
    },
  ];

  const isActiveBreadcrumb = (crumb) => location.pathname === crumb.to;

  useEffect(() => {
    let isMounted = true;
    UserGetMe()
      .then((response) => {
        if (isMounted) {
          setFullname(response.data.fullname);
        }
      })
      .catch((err) => {
        console.log("error:", err?.message || err);
      });

    const loadNotificationCounts = async () => {
      try {
        const firstResponse = await UserGetHistory(1, NOTIFICATION_PAGE_SIZE);
        const firstPage = firstResponse.data;
        const firstItems = Array.isArray(firstPage.data) ? firstPage.data : [];
        let count = firstItems.filter(isUnreadNotification).length;
        const totalPages = firstPage.totalPages ?? 1;
        const batchSize = 5;

        for (
          let firstPageNumber = 2;
          firstPageNumber <= totalPages;
          firstPageNumber += batchSize
        ) {
          const pageNumbers = Array.from(
            { length: Math.min(batchSize, totalPages - firstPageNumber + 1) },
            (_, index) => firstPageNumber + index,
          );
          const responses = await Promise.all(
            pageNumbers.map((pageNumber) =>
              UserGetHistory(pageNumber, NOTIFICATION_PAGE_SIZE),
            ),
          );
          count += responses.reduce((pageCount, response) => {
            const items = Array.isArray(response.data.data)
              ? response.data.data
              : [];
            return pageCount + items.filter(isUnreadNotification).length;
          }, 0);
        }

        if (isMounted) {
          setUnreadCount(Math.max(0, count + unreadCountDelta.current));
        }
      } catch (err) {
        console.error("Failed to load unread notification count:", err);
      }
    };

    loadNotificationCounts();
    GetConnectedDevice()
      .then((response) => {
        if (isMounted) {
          setDeviceMac(
            response.data?.macAddress ?? response.data?.MacAddress ?? null,
          );
        }
      })
      .catch((err) => {
        console.error("Failed to load connected device for notifications:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!connection) return;

    const handleReceiveAlert = () => {
      unreadCountDelta.current += 1;
      setUnreadCount((count) => count + 1);
      setLiveAlertCount((count) => count + 1);
    };

    connection.on("ReceiveAlert", handleReceiveAlert);
    return () => connection.off("ReceiveAlert", handleReceiveAlert);
  }, [connection]);

  const handleNotificationRead = useCallback(() => {
    unreadCountDelta.current -= 1;
    setUnreadCount((count) => Math.max(0, count - 1));
  }, []);

  useEffect(() => {
    const syncSidebarWithViewport = () => {
      if (window.innerWidth <= 767) {
        setCollapsed(true);
      }
    };

    syncSidebarWithViewport();
    window.addEventListener("resize", syncSidebarWithViewport);

    return () => window.removeEventListener("resize", syncSidebarWithViewport);
  }, [setCollapsed]);

  const styleFrame = {
    marginLeft: collapsed ? "7px" : "162px",
    transition: "margin-left 0.24s ease-out",
    padding: "20px",
  };

  return (
    <>
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        unreadCount={unreadCount}
      />

      <div
        className={`app-page-frame user-frame ${collapsed ? "collapsed" : ""}`}
        style={styleFrame}
      >
        <div className="container-fluid mb-3">
          <div className="row">
            <div className="col-md-12">
              <header className="user-frame-header bg-dark text-white rounded p-2">
                <div className="d-flex justify-content-between align-items-center user-frame-header-inner">
                  <div className="d-flex align-items-center gap-3 user-frame-left">
                    <span
                      className="user-frame-notice-bell"
                      aria-label={t("notification")}
                    >
                      <FaBell className="user-frame-notice-icon" />
                    </span>

                    <nav
                      className="user-frame-breadcrumb"
                      aria-label="Breadcrumb"
                    >
                      <span className="user-frame-home-icon">
                        <FaHome size={14} />
                      </span>
                      {breadcrumbs.map((crumb, index) => {
                        const isActive = isActiveBreadcrumb(crumb);

                        return (
                          <span className="user-frame-crumb" key={crumb.to}>
                            {index > 0 && (
                              <FaChevronRight
                                size={10}
                                className="user-frame-crumb-separator"
                              />
                            )}
                            <Link
                              to={crumb.to}
                              className={`user-frame-crumb-link ${
                                isActive ? "active" : ""
                              }`}
                              aria-current={isActive ? "page" : undefined}
                            >
                              {crumb.icon}
                              {crumb.label}
                            </Link>
                          </span>
                        );
                      })}
                    </nav>
                  </div>

                  <div className="d-flex align-items-center gap-3 user-frame-right">
                    <span>
                      {t("welcome_user")} {fullname}
                    </span>
                    <div
                      className="user-avatar"
                      aria-label={t("user_avatar_alt")}
                    >
                      <FaUserCircle />
                    </div>
                    <LanguageSwitcher />
                  </div>
                </div>
              </header>
            </div>
          </div>
        </div>

        <div className="container-fluid">
          <div className="row">
            <div className="col-md-12">
              <div className="user-frame-content">
                <Outlet
                  context={{
                    connection,
                    onNotificationRead: handleNotificationRead,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
