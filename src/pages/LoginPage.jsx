import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { loginWithGoogle } = useAuth();

  return (
    <div className="login-root">
      <div className="login-bg">
        <div className="blob blob1" />
        <div className="blob blob2" />
        <div className="blob blob3" />
      </div>

      <div className="login-card">
        <div className="login-logo">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="14" fill="#bbf7d0"/>
            <path d="M14 24h6m0 0v-6m0 6v6m0-6h14" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="34" cy="18" r="4" fill="#4ade80"/>
            <circle cx="34" cy="30" r="4" fill="#86efac"/>
          </svg>
        </div>
        <h1 className="login-title">Agenda Equipo</h1>
        <p className="login-subtitle">
          Organiza tus citas y compártelas<br />con tu equipo en tiempo real
        </p>

        <div className="login-features">
          <div className="feature-pill">📅 Calendario compartido</div>
          <div className="feature-pill">🔒 Citas privadas</div>
          <div className="feature-pill">👥 Trabajo en equipo</div>
        </div>

        <button className="google-btn" onClick={loginWithGoogle}>
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuar con Google
        </button>

        <p className="login-footer">
          Tus datos se sincronizan de forma segura en la nube
        </p>
      </div>

      <style>{`
        .login-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f0fdf4;
          position: relative;
          overflow: hidden;
          font-family: 'DM Sans', sans-serif;
        }
        .login-bg { position: absolute; inset: 0; pointer-events: none; }
        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.4;
        }
        .blob1 { width: 500px; height: 500px; background: #86efac; top: -150px; left: -150px; }
        .blob2 { width: 400px; height: 400px; background: #bbf7d0; bottom: -100px; right: -100px; }
        .blob3 { width: 300px; height: 300px; background: #4ade80; top: 50%; left: 50%; transform: translate(-50%,-50%); }

        .login-card {
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(187,247,208,0.6);
          border-radius: 24px;
          padding: 48px 40px;
          width: 100%;
          max-width: 420px;
          text-align: center;
          box-shadow: 0 8px 40px rgba(74,222,128,0.15);
          position: relative;
          z-index: 1;
          animation: slideUp 0.5s ease;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .login-logo { margin-bottom: 16px; }
        .login-title {
          font-family: 'DM Serif Display', serif;
          font-size: 2rem;
          color: #14532d;
          margin: 0 0 8px;
          letter-spacing: -0.5px;
        }
        .login-subtitle {
          color: #4b7c5a;
          font-size: 0.95rem;
          line-height: 1.6;
          margin: 0 0 28px;
        }

        .login-features {
          display: flex;
          gap: 8px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 32px;
        }
        .feature-pill {
          background: #dcfce7;
          color: #166534;
          padding: 6px 14px;
          border-radius: 100px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .google-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          width: 100%;
          padding: 14px 24px;
          background: #fff;
          border: 1.5px solid #d1fae5;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 500;
          color: #1f2937;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .google-btn:hover {
          background: #f0fdf4;
          border-color: #4ade80;
          box-shadow: 0 4px 16px rgba(74,222,128,0.2);
          transform: translateY(-1px);
        }

        .login-footer {
          margin-top: 20px;
          font-size: 0.78rem;
          color: #9ca3af;
        }
      `}</style>
    </div>
  );
}
