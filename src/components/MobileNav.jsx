import { Calendar, Users, Clock, Settings } from "lucide-react";

export default function MobileNav({ activeTab, onTabChange }) {
  const tabs = [
    { id: "calendar", label: "Agenda", icon: <Calendar size={20} /> },
    { id: "groups", label: "Grupos", icon: <Users size={20} /> },
    { id: "upcoming", label: "Próximas", icon: <Clock size={20} /> },
    { id: "settings", label: "Ajustes", icon: <Settings size={20} /> },
  ];

  return (
    <nav className="mobile-nav">
      {tabs.map((t) => (
        <button
          key={t.id}
          className={`mobile-nav-btn ${activeTab === t.id ? "active" : ""}`}
          onClick={() => onTabChange(t.id)}
        >
          {t.icon}
          <span>{t.label}</span>
        </button>
      ))}

      <style>{`
        .mobile-nav {
          display: none;
          position: fixed; bottom: 0; left: 0; right: 0;
          background: var(--bg-card);
          border-top: 1.5px solid var(--border);
          padding: 8px 0 env(safe-area-inset-bottom, 8px);
          z-index: 200;
          box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
        }
        .mobile-nav { display: none; grid-template-columns: repeat(4, 1fr); }

        .mobile-nav-btn {
          display: flex; flex-direction: column; align-items: center; gap: 3px;
          background: none; border: none; cursor: pointer;
          padding: 6px 4px; color: var(--text-muted);
          font-family: 'DM Sans', sans-serif; font-size: 0.7rem;
          font-weight: 500; transition: all 0.15s;
        }
        .mobile-nav-btn.active { color: var(--accent); }
        .mobile-nav-btn:hover { color: var(--accent); }

        @media (max-width: 768px) {
          .mobile-nav { display: grid; }
        }
      `}</style>
    </nav>
  );
}
