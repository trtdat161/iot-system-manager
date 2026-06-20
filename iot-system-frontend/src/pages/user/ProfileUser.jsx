import {
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaGlobe,
  FaIdBadge,
  FaKey,
  FaShieldAlt,
  FaUserCircle,
} from "react-icons/fa";
import "../../css/user/ProfileUser.css";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { GetUserProfile, UpdateUserProfile } from "../../api/user/profileApi";
import { useTranslation } from "react-i18next";

const languageCodeById = {
  1: "vi-VN",
  2: "en-US",
};

export function ProfileUser() {
  const { t, i18n } = useTranslation("user_profile");

  // const [profile, setProfile] = useState(null);
  const [errors, setErrors] = useState({});
  const [load, setLoad] = useState("");
  const [done, setDone] = useState("");
  const [originalForm, setOriginalForm] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    fullname: "",
    email: "",
    password: "",
    languageId: 0,
    role: null,
    status: null,
    createdAt: "",
  });

  /*
  cách xịn hơn cho nút nhấn disable
  JSON.stringify chuyển object thành chuỗi để so sánh

  form là user đang nhập / originalForm là từ server
  nếu 2 object này mà như nhau thì isChanged = false -> button disabled
  */
  const isChanged = JSON.stringify(form) !== JSON.stringify(originalForm); // 2 này phải giống nhau về từng field... thì mới so sánh đc

  const profileFields = [
    {
      id: "fullname",
      label: t("fields.fullname"),
      value: form.fullname,
      type: "text",
      icon: <FaUserCircle />,
      tone: "cyan",
    },
    {
      id: "email",
      label: t("fields.email"),
      value: form.email,
      type: "email",
      icon: <FaEnvelope />,
      tone: "blue",
    },
    {
      id: "password",
      label: t("fields.password"),
      value: form.password,
      type: "password",
      icon: <FaKey />,
      tone: "amber",
      content: t("new_password"),
    },
    {
      id: "languageId",
      label: t("fields.language"),
      value: form.languageId,
      // ---- lặp qua ngôn ngữ ----
      inputType: "select",
      options: [
        { value: 1, label: t("languages.vietnamese") },
        { value: 2, label: t("languages.english") },
      ],
      type: "text",
      icon: <FaGlobe />,
      tone: "amber",
    },
  ];

  // handle change form lấy giá trị từ input và cập nhật vào state form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "languageId" ? Number(value) : value,
    }));
  };

  // validate
  const validate = () => {
    const newErrors = {};

    if (!form.fullname.trim()) {
      newErrors.fullname = t("errors.fullname_required"); // trỏ đến tên key trong file translation.json
    }

    if (!form.email.trim()) {
      newErrors.email = t("errors.email_required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = t("errors.email_invalid");
    }

    // nếu có password thì mới validate
    if (form.password.trim() !== "") {
      if (form.password.length < 6) {
        newErrors.password = t("errors.password_min");
      } else if (!/(?=.*[a-z])/.test(form.password)) {
        newErrors.password = t("errors.password_lowercase");
      } else if (!/(?=.*[A-Z])/.test(form.password)) {
        newErrors.password = t("errors.password_uppercase");
      } else if (!/(?=.*\d)/.test(form.password)) {
        newErrors.password = t("errors.password_number");
      }
    }

    setErrors(newErrors); // set lỗi nếu có
    return Object.keys(newErrors).length === 0; // trả về boolean, nếu newErrors = {}; thì là true
  };

  // gọi api update profile
  const updateProfile = async (e) => {
    e.preventDefault();
    // check lại nếu hàm validate trả về false thì return lun
    if (!validate()) {
      return;
    }
    try {
      // lọc password trước khi gửi
      const payload = {
        fullname: form.fullname,
        email: form.email,
        languageId: Number(form.languageId),
      };
      // chi thêm pass nếu người dùng có nhập
      if (form.password.trim() !== "") {
        payload.password = form.password;
      }

      const response = await UpdateUserProfile(payload);
      if (!response?.data) {
        setErrors({ form: t("errors.update_failed") });
        return;
      }

      console.log("Profile updated successfully:", response.data);
      // setProfile(response.data);
      setShowPassword(false);
      const nextForm = {
        ...form,
        fullname: response.data.fullname,
        email: response.data.email,
        password: "", // put lên rồi thì lear tiếp, đảm bảo ko show pass trên UI
        languageId: Number(response.data.languageId ?? form.languageId),
        role: response.data.role ?? form.role,
        status: response.data.status ?? form.status,
        createdAt: response.data.createdAt
          ? dayjs(response.data.createdAt).format("DD/MM/YYYY")
          : form.createdAt,
      };
      setForm(nextForm);
      setOriginalForm(nextForm);

      const nextLanguage =
        response.data.languageCode ?? languageCodeById[nextForm.languageId];
      if (nextLanguage) {
        await i18n.changeLanguage(nextLanguage);
        localStorage.setItem("lang", nextLanguage);
      }

      setDone(i18n.t("user_profile:messages.update_success"));
      // sau khi set done thì đợi 2s set về chuỗi rỗng
      setTimeout(() => {
        setDone("");
      }, 2000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setErrors({ form: t("errors.update_failed") });
    }
  };

  useEffect(() => {
    let isMounted = true;

    GetUserProfile()
      .then((response) => {
        if (!isMounted) {
          return;
        }

        if (!response?.data) {
          setLoad(i18n.t("user_profile:errors.profile_unavailable"));
          return;
        }

        console.log("User profile response:", response.data);
        // formData chung gọi 1 lần tránh lặp code
        const formData = {
          fullname: response.data.fullname,
          email: response.data.email,
          password: "",
          languageId: Number(response.data.languageId),
          role: response.data.role,
          status: response.data.status,
          createdAt: response.data.createdAt
            ? dayjs(response.data.createdAt).format("DD/MM/YYYY")
            : "",
        };

        setForm(formData);
        setOriginalForm(formData);
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        console.error("Error fetching profile:", error);
        setLoad(i18n.t("user_profile:errors.load_failed"));
      });

    return () => {
      isMounted = false;
    };
  }, [i18n]);

  return (
    <main className="user-dashboard user-profile">
      {load ? <span className="alert  text-center bg-danger">{load}</span> : ""}
      {done ? <span className="alert text-center bg-success">{done}</span> : ""}
      <section className="profile-card glass-panel">
        <aside className="profile-summary">
          {/* <div className="profile-avatar">
            <FaIdBadge />
          </div> */}

          <div className="profile-summary-content">
            <span className="profile-badge">
              <span className="live-dot"></span>
              {form.status ? t("status.active") : t("status.inactive")}
            </span>
            <h1>{form.fullname}</h1>
            <p>{form.email}</p>
          </div>

          <div className="profile-access">
            <FaShieldAlt />
            <div>
              <span>{t("summary.current_access")}</span>
              <strong>
                {form.role ? t("roles.user") : t("roles.no_data")}
              </strong>
            </div>
          </div>

          <div className="profile-access">
            <FaIdBadge />
            <div>
              <span>{t("summary.created_at")}</span>
              <strong>{form.createdAt}</strong>
            </div>
          </div>
        </aside>

        <section className="profile-form-panel">
          <div className="profile-form-heading">
            <div>
              <span>{t("heading.account_details")}</span>
              <h2>{t("heading.profile_information")}</h2>
            </div>
            {/* ---------- gọi đến profileForm trong id của form ---------- */}
          </div>

          <div className="profile-fields">
            {/* ---------- dùng id để button có thể ko cần trong form mà vẫn submit được ---------- */}
            <form className="profile-form" onSubmit={updateProfile}>
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
                      name={field.id}
                      value={form[field.id] ?? ""}
                      onChange={handleChange}
                    >
                      {field.options.map((option) => (
                        <option
                          key={option.value}
                          value={option.value}
                          className=" text-center"
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div
                      className={
                        field.id === "password"
                          ? "profile-password-control"
                          : "profile-input-control"
                      }
                    >
                      <input
                        type={
                          field.id === "password" && showPassword
                            ? "text"
                            : field.type
                        }
                        id={field.id}
                        name={field.id}
                        value={form[field.id] || ""}
                        onChange={handleChange}
                        placeholder={field.content}
                      />
                      {field.id === "password" && (
                        <button
                          type="button"
                          className="profile-password-toggle"
                          aria-label={
                            showPassword
                              ? t("actions.hide_password")
                              : t("actions.show_password")
                          }
                          onClick={() => setShowPassword((prev) => !prev)}
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      )}
                    </div>
                  )}
                  {/* field.id chính là đag trỏ đến name, bung profileFields ra sẽ thấy */}
                  {errors[field.id] && (
                    <span className="text-danger">{errors[field.id]}</span>
                  )}
                </div>
              ))}
              <button
                className="profile-edit-button"
                type="submit"
                disabled={!isChanged}
              >
                {t("actions.save")}
              </button>
            </form>
            {errors.form && (
              <span className="text-danger text-center">{errors.form}</span>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
