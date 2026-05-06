import { Calendar, Users, Clock, Settings } from "lucide-react";

export default function MobileNav({ activeTab, onTabChange }) {
  const tabs = [
    { id: "calendar", label: "Agenda",   icon: <Calendar size={21} /> },
    { id: "groups",   label: "Grupos",   icon: <Users    size={21} /> },
    { id: "upcoming", label: "Próximas", icon: <Clock    size={21} /> },
    { id: "settings", label: "Ajustes",  icon: <Settings size={21} /> },
  ];

  return (
    <nav className="mobile-nav">
      {tabs.map((t) => (
        <button
          key={t.id}
          className={`mobile-nav-btn ${activeTab === t.id ? "active" : ""}`}
          onClick={() => onTabChange(t.id)}
        >
          <div className={`nav-icon-wrap ${activeTab === t.id ? "active" : ""}`}>
            {t.icon}
          </div>
          <span>{t.label}</span>
        </button>
      ))}

      <style>{`
        .mobile-nav {
          display: none;
          position: fixed; bottom: 0; left: 0; right: 0;
          background: var(--bg-card);
          border-top: 1.5px solid var(--border);
          /* 60px de barra + safe area de iOS */
          padding-bottom: env(safe-area-inset-bottom, 0px);
          height: calc(60px + env(safe-area-inset-bottom, 0px));
          z-index: 200;
          box-shadow: 0 -2px 16px rgba(0,0,0,0.07);
          grid-template-columns: repeat(4, 1fr);
          align-items: center;
        }

        .mobile-nav-btn {
          display: flex; flex-direction: column; align-items: center; gap: 3px;
          background: none; border: none; cursor: pointer;
          padding: 6px 4px; color: var(--text-muted);
          font-family: 'DM Sans', sans-serif; font-size: 0.68rem;
          font-weight: 500; transition: color 0.15s;
          height: 100%; justify-content: center;
        }
        .mobile-nav-btn.active { color: var(--accent); }

        .nav-icon-wrap {
          display: flex; align-items: center; justify-content: center;
          width: 38px; height: 28px; border-radius: 100px;
          transition: background 0.15s;
        }
        .nav-icon-wrap.active {
          background: var(--accent-light);
        }

        @media (max-width: 768px) {
          .mobile-nav { display: grid; }
        }
      `}</style>
    </nav>
  );
}
