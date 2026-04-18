import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/Auth.css";
import { GetLanguages } from "../../api/languageApi";
import { RegisterAction } from "../../api/authApi";

export function Register() {
  const [languages, setLanguages] = useState([]);
  const [done, setDone] = useState(false);
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
  // gọi danh sách ngôn ngữ ra
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
      newErrors.fullname = "Vui lòng nhập tên đầy đủ";
    }

    if (!form.email.trim()) {
      newErrors.email = "Vui lòng nhập email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Email không hợp lệ";
    }

    if (!form.password) {
      newErrors.password = "Vui lòng nhập mật khẩu";
    } else if (form.password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
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
      const result = response.data;
      setDone(true);
      navigate("/login"); // sau này vô dashboard
    } catch (err) {
      console.log("error:", { form: err.message });
      setErrors("Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          {/* Header */}
          <div className="auth-header">
            <h1 className="auth-title">DTECH</h1>
            <p className="auth-subtitle">Tạo tài khoản mới</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Fullname */}
            <div className="form-group">
              <label htmlFor="fullname" className="form-label">
                Tên đầy đủ
              </label>
              <input
                id="fullname"
                type="text"
                name="fullname"
                className={`form-control ${errors.fullname ? "is-invalid" : ""}`}
                placeholder="Nguyễn Văn A"
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
                Email
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
              {errors.email && <div className="form-error">{errors.email}</div>}
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Mật khẩu
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
                Ngôn ngữ
              </label>
              <select
                name="languageId"
                id="languageId"
                value={form.languageId}
                onChange={handleChange}
              >
                <option value={0}>-- Chọn ngôn ngữ --</option>
                {languages.map((lang) => (
                  <option key={lang.id} value={lang.id}>
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
              {loading ? "Đang xử lý..." : "Đăng ký"}
            </button>
            {/* hiện thông báo done */}
            {done && (
              <div
                className="alert alert-success mt-3 text-center"
                role="alert"
              >
                Register successful!
              </div>
            )}
          </form>

          {/* Footer */}
          <div className="auth-footer">
            <p className="text-center text-light mb-3">
              Đã có tài khoản?{" "}
              <button onClick={() => navigate("/login")} className="auth-link">
                Đăng nhập
              </button>
            </p>
            <div className="contact-info">
              <p className="small text-light text-center">
                Cần hỗ trợ? Liên hệ{" "}
                <a
                  href="mailto:trtdat161@gmail.com"
                  className="auth-contact-link"
                >
                  trtdat161@gmail.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
