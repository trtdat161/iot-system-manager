import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/Auth.css";

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validation
    if (!email || !password) {
      setError("Vui lòng điền tất cả các trường");
      setLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Email không hợp lệ");
      setLoading(false);
      return;
    }

    // TODO: Gửi request đăng nhập
    try {
      console.log("Logging in...", { email, password });
      // const res = await api.post('/auth/login', { email, password });
      // localStorage.setItem('token', res.data.token);
      // navigate('/dashboard');
    } catch (err) {
      setError(err.message || "Đăng nhập thất bại");
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
            <p className="auth-subtitle">Đăng nhập vào hệ thống</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Email */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="form-control"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Mật khẩu
              </label>
              <input
                id="password"
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Error */}
            {error && <div className="alert alert-danger">{error}</div>}

            {/* Submit Button */}
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? "Đang xử lý..." : "Đăng nhập"}
            </button>
          </form>

          {/* Footer */}
          <div className="auth-footer">
            <p className="text-center text-muted mb-3">
              Chưa có tài khoản?{" "}
              <button
                onClick={() => navigate("/register")}
                className="auth-link"
              >
                Đăng ký ngay
              </button>
            </p>
            <div className="contact-info">
              <p className="small text-muted text-center">
                Cần hỗ trợ? Liên hệ{" "}
                <a href="tel:0374757256" className="auth-contact-link">
                  0374 757 256
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
