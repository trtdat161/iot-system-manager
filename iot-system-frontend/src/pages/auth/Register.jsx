import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/Auth.css";
import { GetLanguages } from "../../api/languageApi";
import { RegisterAction } from "../../api/authApi";
import { useTranslation } from "react-i18next";

export function Register() {
  const { t, i18n } = useTranslation("register_login"); // t("key") => trả ra string theo ngôn ngữ hiện tại

  // hook
  const [languages, setLanguages] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullname: "",
    email: "",
    password: "",
    languageId: 0,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    /*
    tương đương khi thao tác
    e.target.name  = "languageId"
    e.target.value = "2"
    */
    setForm({
      ...form,
      [name]: value,
    });
  };

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await GetLanguages();
        console.log("data: " + response.data);
        setLanguages(response.data);
      } catch (err) {
        console.log("error: " + err.message);
        setLanguages([]);
      }
    };
    fetchLanguages();
  }, []);

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

    if (!form.password) {
      newErrors.password = t("errors.password_required");
    } else if (form.password.length < 6) {
      newErrors.password = t("errors.password_min");
    } else if (!/(?=.*[a-z])/.test(form.password)) {
      newErrors.password = t("errors.password_lowercase");
    } else if (!/(?=.*[A-Z])/.test(form.password)) {
      newErrors.password = t("errors.password_uppercase");
    } else if (!/(?=.*\d)/.test(form.password)) {
      newErrors.password = t("errors.number");
    }

    if (!form.languageId) {
      newErrors.languageId = "Vui lòng chọn ngôn ngữ";
    }

    setErrors(newErrors); // set lỗi nếu có
    return Object.keys(newErrors).length === 0; // trả về boolean nếu newErrors = {}; thì là true
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      return; // check lại nếu có lỗi thì return lun
    }
    setLoading(true);
    try {
      const response = await RegisterAction(form); // thuộc tính data từ object response
      const user = response.data;
      console.log("user response:", user);
      i18n.changeLanguage(user.languageCode); // languageCode là hàm mặc định của i18n
      localStorage.setItem("lang", user.languageCode);
      navigate("/login"); // sau này vô dashboard
    } catch (err) {
      console.log("error:", { form: err.message });
      setErrors({ form: "Đăng nhập thất bại" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            {/* Header */}
            <div className="auth-header">
              <h1 className="auth-title">DTECH</h1>
              <p className="auth-subtitle">{t("new_account")}</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="auth-form">
              {/* Fullname */}
              <div className="form-group">
                <label htmlFor="fullname" className="form-label">
                  {t("fullname")}
                </label>
                <input
                  id="fullname"
                  type="text"
                  name="fullname"
                  className={`form-control ${errors.fullname ? "is-invalid" : ""}`}
                  placeholder="your name"
                  value={form.fullname}
                  onChange={handleChange}
                />
                {errors.fullname && (
                  <div className="form-error">{errors.fullname}</div>
                )}
              </div>

              {/* Email */}
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  {t("email")}
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  className={`form-control ${errors.email ? "is-invalid" : ""}`}
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={handleChange}
                />
                {errors.email && (
                  <div className="form-error">{errors.email}</div>
                )}
              </div>

              {/* Password */}
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  {t("password")}
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  className={`form-control ${errors.password ? "is-invalid" : ""}`}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                />
                {errors.password && (
                  <div className="form-error">{errors.password}</div>
                )}
              </div>

              {/* Language --------- Key chỉ dành cho react! ----------
            Giúp biết phần tử nào thay đổi khi render lại
            value : giá trị thật đc gửi đi */}
              <div className="form-group">
                <label htmlFor="languageId" className="form-label">
                  {t("language")}
                </label>
                <select
                  name="languageId"
                  id="languageId"
                  value={form.languageId}
                  onChange={handleChange}
                >
                  <option value={0} className="text-center">
                    Chọn ngôn ngữ
                  </option>
                  {languages.map((lang) => (
                    <option
                      key={lang.id}
                      value={lang.id}
                      className="text-center"
                    >
                      {lang.code}
                    </option>
                  ))}
                </select>
                {errors.languageId && (
                  <div className="form-error">{errors.languageId}</div>
                )}
              </div>

              {/* Form Error */}
              {errors.form && (
                <div className="alert alert-danger">{errors.form}</div>
              )}

              {/* Submit Button */}
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? t("loading") : t("login")}
              </button>
            </form>

            {/* Footer */}
            <div className="auth-footer">
              <p className="text-center text-light mb-3">
                {t("have_account")}
                <button
                  onClick={() => navigate("/login")}
                  className="auth-link"
                >
                  {t("login")}
                </button>
              </p>
              <div className="contact-info">
                <p className="small text-light text-center">
                  {t("support")}
                  <a
                    href="mailto:trtdat161@gmail.com"
                    className="auth-contact-link"
                  >
                    <span className="p-1">trtdat161@gmail.com</span>
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
