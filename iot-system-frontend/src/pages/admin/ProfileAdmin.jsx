import {
  FaEnvelope,
  FaFingerprint,
  FaGlobe,
  FaIdBadge,
  FaKey,
  FaShieldAlt,
  FaUserCircle,
  FaUserTag,
} from "react-icons/fa";
import "../../css/admin/Dashboard.css";
import "../../css/admin/ProfileAdmin.css";
import { GetAdminProfile } from "../../api/admin/profileApi";
import { useEffect, useState } from "react";

export function ProfileAdmin() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  // array fields
  const adminProfile = {
    fullname: profile?.fullname || "Admin Name",
    email: profile?.email || "admin@dtech.vn",
    password: profile?.password || "********",
    status: profile?.status ? "Active" : "Inactive",
    role: profile?.role || "Administrator",
    language: profile?.languageCode || "English",
    createdAt: profile?.createdAt || "2026-05-30 22:15",
    updatedAt: profile?.updatedAt || "no data",
  };

  const profileFields = [
    {
      id: "fullname",
      label: "Fullname",
      value: adminProfile.fullname,
      type: "text",
      icon: <FaUserCircle />,
      tone: "cyan",
      readOnly: false,
    },
    {
      id: "email",
      label: "Email",
      value: adminProfile.email,
      type: "email",
      icon: <FaEnvelope />,
      tone: "blue",
      readOnly: false,
    },
    {
      id: "password",
      label: "Password",
      value: adminProfile.password,
      type: "password",
      icon: <FaKey />,
      tone: "amber",
      readOnly: false,
    },
    {
      id: "language",
      label: "Language",
      value: adminProfile.language,
      // ---- lặp qua ngôn ngữ ----
      inputType: "select",
      options: [
        { value: "en", label: "English" },
        { value: "vi", label: "Vietnamese" },
      ],
      type: "text",
      icon: <FaGlobe />,
      tone: "amber",
      readOnly: false,
    },
    {
      id: "status",
      label: "Status",
      value: adminProfile.status,
      type: "text",
      icon: <FaShieldAlt />,
      tone: "green",
      readOnly: true,
    },
    {
      id: "role",
      label: "Role",
      value: adminProfile.role,
      type: "text",
      icon: <FaUserTag />,
      tone: "cyan",
      readOnly: true,
    },
    {
      id: "createdAt",
      label: "Created At",
      value: adminProfile.createdAt,
      type: "text",
      icon: <FaIdBadge />,
      tone: "blue",
      readOnly: true,
    },
    {
      id: "updatedAt",
      label: "Updated At",
      value: adminProfile.updatedAt,
      type: "text",
      icon: <FaIdBadge />,
      tone: "green",
      readOnly: true,
    },
  ];
  // gọi api profile
  const fetchProfile = async () => {
    try {
      const response = await GetAdminProfile();
      console.log("Admin profile response:", response.data);
      setProfile(response.data);
      // Xử lý response ở đây
    } catch (error) {
      console.error("Error fetching profile:", error);
      setError("Failed to load profile. Please try again later.");
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!profile) {
    return <div className="loading-message">Loading profile...</div>;
  }

  return (
    <main className="admin-dashboard admin-profile">
      <section className="profile-card glass-panel">
        <aside className="profile-summary">
          <div className="profile-avatar">
            <FaIdBadge />
          </div>

          <div className="profile-summary-content">
            <span className="profile-badge">
              <span className="live-dot"></span>
              {adminProfile.status}
            </span>
            <h1>{adminProfile.fullname}</h1>
            <p>{adminProfile.email}</p>
          </div>

          <div className="profile-access">
            <FaShieldAlt />
            <div>
              <span>Current access</span>
              <strong>{adminProfile.role}</strong>
            </div>
          </div>
        </aside>

        <section className="profile-form-panel">
          <div className="profile-form-heading">
            <div>
              <span>Account details</span>
              <h2>Profile information</h2>
            </div>
            <button className="profile-edit-button" type="submit">
              Edit profile
            </button>
          </div>

          <div className="profile-fields">
            <form className="profile-form">
              {profileFields.map((field) => (
                <div className={`profile-field ${field.tone}`} key={field.id}>
                  {/* ----- nhãn ----- */}
                  <label className="profile-field-label" htmlFor={field.id}>
                    <span className="profile-field-icon">{field.icon}</span>
                    {field.label}
                  </label>

                  {/* ------- input tuỳ chọn có thể là select hoặc input -------- */}
                  {field.inputType === "select" ? (
                    <select
                      id={field.id}
                      name={field.id}
                      defaultValue={field.value || ""}
                      className={`profile-field-input ${field.readOnly ? "read-only" : ""}`}
                      readOnly={field.readOnly}
                    >
                      {field.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      id={field.id}
                      name={field.id}
                      defaultValue={field.value || ""}
                      className={`profile-field-input ${field.readOnly ? "read-only" : ""}`}
                      readOnly={field.readOnly}
                    />
                  )}
                </div>
              ))}
            </form>
          </div>
        </section>
      </section>
    </main>
  );
}
