import { useState } from "react";
import { X, Sun, Moon, User, Bell, Info, Shield, Palette } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

export default function SettingsModal({ onClose, inline }) {
  const { theme, setTheme } = useTheme();
  const { user, updateUserName } = useAuth();
  const [activeSection, setActiveSection] = useState("appearance");
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved | error

  const handleSaveName = async () => {
    if (!displayName.trim()) return;
    setSaveStatus("saving");
    try {
      await updateUserName(displayName.trim());
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 2500);
    }
  };

  const sections = [
    { id: "appearance", label: "Apariencia", icon: <Palette size={15} /> },
    { id: "profile", label: "Perfil", icon: <User size={15} /> },
    { id: "notifications", label: "Avisos", icon: <Bell size={15} /> },
    { id: "about", label: "Acerca de", icon: <Info size={15} /> },
  ];

  const saveBtnLabel = {
    idle: "Guardar",
    saving: "Guardando...",
    saved: "Guardado",
    error: "Error, reintentar",
  }[saveStatus];

  const content = (
    <div className={`settings-wrap ${inline ? "inline" : ""}`}>
      <div className="settings-nav">
        {sections.map((s) => (
          <button key={s.id} className={`s-nav-item ${activeSection === s.id ? "active" : ""}`}
            onClick={() => setActiveSection(s.id)}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      <div className="settings-content">
        {activeSection === "appearance" && (
          <div className="s-section">
            <h3>Apariencia</h3>
            <p className="s-desc">Elige cómo quieres que se vea la app.</p>
            <div className="theme-options">
              {[
                { value: "light", label: "Claro", icon: <Sun size={20} />, desc: "Verde pastel" },
                { value: "dark", label: "Oscuro", icon: <Moon size={20} />, desc: "Descansa la vista" },
                { value: "system", label: "Sistema", icon: <Palette size={20} />, desc: "Automático" },
              ].map((t) => (
                <button key={t.value} className={`theme-option ${theme === t.value ? "active" : ""}`}
                  onClick={() => setTheme(t.value)}>
                  <div className="theme-icon">{t.icon}</div>
                  <div className="theme-label">{t.label}</div>
                  <div className="theme-desc">{t.desc}</div>
                  {theme === t.value && <div className="theme-check">✓</div>}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeSection === "profile" && (
          <div className="s-section">
            <h3>Perfil</h3>
            <div className="profile-avatar-row">
              {user?.photo && <img src={user.photo} alt="avatar" className="profile-avatar" />}
              <div>
                <div className="profile-name">{user?.name}</div>
                <div className="profile-email">{user?.email}</div>
              </div>
            </div>
            <div className="s-divider" />
            <label className="s-label">Nombre para mostrar</label>
            <p className="s-desc">Este nombre aparece en las citas que creas y en el grupo.</p>
            <div className="s-input-row">
              <input className="s-input" value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                placeholder="Tu nombre" />
              <button className={`s-save-btn ${saveStatus}`} onClick={handleSaveName}
                disabled={saveStatus === "saving"}>
                {saveBtnLabel}
              </button>
            </div>
          </div>
        )}

        {activeSection === "notifications" && (
          <div className="s-section">
            <h3>Avisos</h3>
            <p className="s-desc">Configura cuándo quieres recibir recordatorios.</p>
            <div className="s-toggle-list">
              {[
                { label: "Citas del día", desc: "Aviso cada mañana con tus citas de hoy" },
                { label: "Nueva cita de compañero", desc: "Cuando alguien añade una cita pública" },
                { label: "Recordatorio 1h antes", desc: "Aviso 60 min antes de cada cita" },
              ].map((n, i) => (
                <div key={i} className="s-toggle-item">
                  <div>
                    <div className="s-toggle-label">{n.label}</div>
                    <div className="s-toggle-desc">{n.desc}</div>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" defaultChecked={i === 0} />
                    <span className="toggle-slider" />
                  </label>
                </div>
              ))}
            </div>
            <p className="s-hint">Requiere permiso del navegador para funcionar.</p>
          </div>
        )}

        {activeSection === "about" && (
          <div className="s-section">
            <h3>Acerca de</h3>
            <div className="about-logo">
              <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
                <rect width="48" height="48" rx="14" fill="#bbf7d0"/>
                <path d="M14 24h6m0 0v-6m0 6v6m0-6h14" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round"/>
                <circle cx="34" cy="18" r="4" fill="#4ade80"/>
                <circle cx="34" cy="30" r="4" fill="#86efac"/>
              </svg>
              <div className="about-app-name">Agenda Equipo</div>
              <div className="about-version">Versión 1.0.0</div>
            </div>
            <div className="about-info">
              <div className="about-row"><Shield size={13} /> App de agenda colaborativa para equipos</div>
              <div className="about-row"><User size={13} /> Desarrollada por Juan Ángel</div>
            </div>
            <div className="s-divider" />
            <div className="copyright">
              © 2026 Juan Ángel. Todos los derechos reservados.<br />
              <span>Hecho con ❤️ para Agenda Equipo</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (inline) return content;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-card" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Ajustes</h2>
          <button className="s-close-btn" onClick={onClose}><X size={18} /></button>
        </div>
        {content}
      </div>

      <style>{`
        .settings-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.35);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; backdrop-filter: blur(4px);
          font-family: 'DM Sans', sans-serif; padding: 16px;
          animation: fadeIn 0.15s ease;
        }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        .settings-card {
          background: var(--bg-card); border-radius: 20px;
          width: 100%; max-width: 620px; max-height: 88vh;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
          display: flex; flex-direction: column;
          animation: slideUp 0.2s ease; overflow: hidden;
          border: 1.5px solid var(--border);
        }
        @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .settings-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 24px; border-bottom: 1.5px solid var(--border); flex-shrink: 0;
        }
        .settings-header h2 { font-family: 'DM Serif Display', serif; font-size: 1.25rem; color: var(--text-primary); margin: 0; }
        .s-close-btn { background: var(--bg-hover); border: 1.5px solid var(--border); border-radius: 8px; padding: 6px; cursor: pointer; color: var(--text-muted); display: flex; transition: all 0.15s; }
        .s-close-btn:hover { background: #fef2f2; color: #ef4444; border-color: #fecaca; }

        .settings-wrap { display: flex; flex: 1; overflow: hidden; min-height: 0; }
        .settings-wrap.inline { flex-direction: column; }

        .settings-nav {
          width: 150px; flex-shrink: 0; padding: 14px 10px;
          border-right: 1.5px solid var(--border);
          display: flex; flex-direction: column; gap: 2px; background: var(--bg-card);
        }
        .settings-wrap.inline .settings-nav {
          width: 100%; flex-direction: row; border-right: none;
          border-bottom: 1.5px solid var(--border); padding: 10px 16px;
          overflow-x: auto; gap: 6px;
        }
        .s-nav-item {
          display: flex; align-items: center; gap: 7px; padding: 9px 11px;
          border-radius: 9px; border: none; background: none; cursor: pointer;
          font-size: 0.84rem; color: var(--text-secondary); font-family: 'DM Sans', sans-serif;
          font-weight: 500; text-align: left; transition: all 0.15s; white-space: nowrap;
        }
        .s-nav-item:hover { background: var(--bg-hover); color: var(--text-primary); }
        .s-nav-item.active { background: var(--accent-light); color: var(--accent); }

        .settings-content { flex: 1; padding: 24px; overflow-y: auto; background: var(--bg-card); }

        .s-section { display: flex; flex-direction: column; gap: 14px; }
        .s-section h3 { font-family: 'DM Serif Display', serif; font-size: 1.15rem; color: var(--text-primary); margin: 0; }
        .s-desc { font-size: 0.83rem; color: var(--text-muted); margin: 0; line-height: 1.5; }
        .s-hint { font-size: 0.78rem; color: var(--text-muted); }
        .s-divider { border: none; border-top: 1.5px solid var(--border); }
        .s-label { font-size: 0.82rem; font-weight: 600; color: var(--text-secondary); }

        .theme-options { display: flex; gap: 10px; flex-wrap: wrap; }
        .theme-option {
          flex: 1; min-width: 110px; padding: 14px 10px;
          border: 2px solid var(--border); border-radius: 12px;
          background: var(--bg-hover); cursor: pointer;
          display: flex; flex-direction: column; align-items: center; gap: 5px;
          font-family: 'DM Sans', sans-serif; position: relative;
          transition: all 0.15s; color: var(--text-secondary);
        }
        .theme-option:hover { border-color: var(--accent); }
        .theme-option.active { border-color: var(--accent); background: var(--accent-light); color: var(--accent); }
        .theme-icon { color: inherit; }
        .theme-label { font-size: 0.88rem; font-weight: 600; color: var(--text-primary); }
        .theme-desc { font-size: 0.72rem; text-align: center; color: var(--text-muted); }
        .theme-check { position: absolute; top: 7px; right: 9px; font-size: 0.75rem; color: var(--accent); font-weight: 700; }

        .profile-avatar-row { display: flex; align-items: center; gap: 14px; }
        .profile-avatar { width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid var(--accent-border); }
        .profile-name { font-weight: 600; font-size: 1rem; color: var(--text-primary); }
        .profile-email { font-size: 0.82rem; color: var(--text-muted); }

        .s-input-row { display: flex; gap: 8px; }
        .s-input {
          flex: 1; border: 1.5px solid var(--border); border-radius: 10px;
          padding: 9px 12px; font-size: 0.9rem; font-family: 'DM Sans', sans-serif;
          background: var(--bg-input); color: var(--text-primary); outline: none; transition: border-color 0.15s;
        }
        .s-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-light); }
        .s-save-btn {
          background: var(--accent); color: white; border: none; border-radius: 10px;
          padding: 9px 16px; font-size: 0.85rem; font-weight: 600;
          cursor: pointer; font-family: 'DM Sans', sans-serif; white-space: nowrap; transition: all 0.15s;
        }
        .s-save-btn:hover { background: var(--accent-dark); }
        .s-save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .s-save-btn.saved { background: #15803d; }
        .s-save-btn.error { background: #ef4444; }

        .s-toggle-list { display: flex; flex-direction: column; gap: 6px; }
        .s-toggle-item { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; background: var(--bg-hover); border-radius: 10px; border: 1.5px solid var(--border); }
        .s-toggle-label { font-size: 0.88rem; font-weight: 600; color: var(--text-primary); }
        .s-toggle-desc { font-size: 0.76rem; color: var(--text-muted); margin-top: 2px; }

        .toggle { position: relative; display: inline-block; width: 40px; height: 22px; flex-shrink: 0; }
        .toggle input { opacity: 0; width: 0; height: 0; }
        .toggle-slider { position: absolute; cursor: pointer; inset: 0; background: var(--border); border-radius: 100px; transition: 0.2s; }
        .toggle-slider:before { content: ""; position: absolute; width: 16px; height: 16px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: 0.2s; }
        .toggle input:checked + .toggle-slider { background: var(--accent); }
        .toggle input:checked + .toggle-slider:before { transform: translateX(18px); }

        .about-logo { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 20px; background: var(--bg-hover); border-radius: 14px; border: 1.5px solid var(--border); }
        .about-app-name { font-family: 'DM Serif Display', serif; font-size: 1.3rem; color: var(--text-primary); }
        .about-version { font-size: 0.78rem; color: var(--text-muted); }
        .about-info { display: flex; flex-direction: column; gap: 8px; }
        .about-row { display: flex; align-items: center; gap: 8px; font-size: 0.88rem; color: var(--text-secondary); }
        .copyright { font-size: 0.8rem; color: var(--text-muted); line-height: 2; }
        .copyright span { font-size: 0.78rem; }

        @media (max-width: 540px) {
          .theme-options { flex-direction: column; }
          .s-input-row { flex-direction: column; }
          .s-save-btn { width: 100%; }
        }
      `}</style>
    </div>
  );
}
