import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/Auth.css";
import { useTranslation } from "react-i18next";
import { LoginAction } from "../../api/authApi";

export function Login() {
  const { t, i18n } = useTranslation("register_login");

  // hook
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value,
    });
  };

  // validate
  // Validation
  const validate = () => {
    const newErrors = {};

    if (!form.email.trim()) {
      newErrors.email = t("errors.email_required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = t("errors.email_invalid");
    }

    if (!form.password.trim()) {
      newErrors.password = t("errors.password_required");
    }

    setErrors(newErrors); // set lỗi nếu có
    return Object.keys(newErrors).length === 0; // trả về boolean nếu newErrors = {}; thì là true
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }
    setLoading(true);
    try {
      const response = await LoginAction(form); // form
      const user = response.data;
      i18n.changeLanguage(user.languageCode);
      localStorage.setItem("lang", user.languageCode);
      navigate("/dashboard");
      /*
      login cũng phải set lại vì
      User đăng ký chọn tiếng Anh => localStorage lưu "en-US" ok
      User xoá cache / dùng máy khác / mở tab ẩn danh
      => localStorage trống => i18n fallback "vi-VN" X
      User login => BE trả về languageCode "en-US"
      => set lại localStorage =? đúng ngôn ngữ 
      */
    } catch (err) {
      console.log("error:", form);
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
              <p className="auth-subtitle">{t("login_subtitle")}</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="auth-form">
              {/* Email */}
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  {t("email")}
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  className="form-control"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={handleChange}
                />
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
                  className="form-control"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                />
              </div>

              {/* Error */}
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
              <p className="text-center text-muted mb-3">
                {t("dont_have_account")}
                <button
                  onClick={() => navigate("/register")}
                  className="auth-link"
                >
                  {t("register_now")}
                </button>
              </p>
              <div className="contact-info">
                <p className="small text-muted text-center">
                  {t("support")}
                  <a href="tel:0374757256" className="auth-contact-link">
                    0374 757 256
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
