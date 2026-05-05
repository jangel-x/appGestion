import { X, Plus, Lock, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

const CATEGORY_EMOJI = { cita: "✂️", reunion: "🤝", personal: "👤", otro: "📌" };

export default function DayView({ date, appointments, onClose, onAdd, onAppointmentClick, memberColors, currentUserId }) {
  const dateObj = (() => { try { return parseISO(date); } catch { return new Date(); } })();
  const dayApps = appointments
    .filter((a) => a.date === date)
    .sort((a, b) => (a.time || "").localeCompare(b.time || ""));

  return (
    <div className="dayview-overlay" onClick={onClose}>
      <div className="dayview-card" onClick={(e) => e.stopPropagation()}>
        <div className="dv-header">
          <div>
            <div className="dv-weekday">{format(dateObj, "EEEE", { locale: es })}</div>
            <div className="dv-date">{format(dateObj, "d 'de' MMMM yyyy", { locale: es })}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="dv-add-btn" onClick={() => { onClose(); onAdd(date); }}>
              <Plus size={16} /> Nueva cita
            </button>
            <button className="dv-close-btn" onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        <div className="dv-body">
          {dayApps.length === 0 ? (
            <div className="dv-empty">
              <span>📭</span>
              <p>No hay citas este día</p>
              <button className="dv-add-btn-big" onClick={() => { onClose(); onAdd(date); }}>
                <Plus size={14} /> Añadir cita
              </button>
            </div>
          ) : (
            dayApps.map((a) => {
              const color = memberColors?.[a.createdBy] || "#4ade80";
              const isOwn = a.createdBy === currentUserId;
              return (
                <div
                  key={a.id}
                  className="dv-item"
                  style={{ borderLeft: `4px solid ${color}`, background: color + "10" }}
                  onClick={() => { onClose(); onAppointmentClick(a); }}
                >
                  <div className="dv-item-top">
                    <span className="dv-emoji">{CATEGORY_EMOJI[a.category] || "📌"}</span>
                    <span className="dv-title">{a.title}</span>
                    {a.visibility === "private" && isOwn && (
                      <span className="dv-private"><Lock size={11} /> Privada</span>
                    )}
                  </div>
                  <div className="dv-item-meta">
                    {a.time && (
                      <span><Clock size={11} /> {a.time}{a.duration ? ` · ${a.duration} min` : ""}</span>
                    )}
                    {a.clientName && <span>👤 {a.clientName}</span>}
                    <span style={{ color, fontWeight: 600 }}>
                      {isOwn ? "Yo" : a.createdByName || "Compañero"}
                    </span>
                  </div>
                  {a.notes && <div className="dv-notes">{a.notes}</div>}
                </div>
              );
            })
          )}
        </div>
      </div>

      <style>{`
        .dayview-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.3);
          display: flex; align-items: center; justify-content: center;
          z-index: 999; backdrop-filter: blur(4px);
          font-family: 'DM Sans', sans-serif;
          animation: fadeIn 0.15s ease;
          padding: 16px;
        }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }

        .dayview-card {
          background: var(--bg-card); border-radius: 20px;
          width: 100%; max-width: 480px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          max-height: 85vh; display: flex; flex-direction: column;
          animation: slideUp 0.2s ease;
        }
        @keyframes slideUp {
          from{opacity:0;transform:translateY(16px)}
          to{opacity:1;transform:translateY(0)}
        }

        .dv-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          padding: 24px 24px 16px; border-bottom: 1.5px solid #f0fdf4;
          flex-shrink: 0;
        }
        .dv-weekday {
          font-size: 0.8rem; text-transform: capitalize;
          color: var(--text-muted); font-weight: 500; margin-bottom: 2px;
        }
        .dv-date {
          font-family: 'DM Serif Display', serif;
          font-size: 1.3rem; color: var(--text-primary); text-transform: capitalize;
        }

        .dv-add-btn {
          display: flex; align-items: center; gap: 6px;
          background: #16a34a; color: white;
          border: none; border-radius: 10px;
          padding: 8px 14px; font-size: 0.85rem; font-weight: 600;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: all 0.15s;
        }
        .dv-add-btn:hover { background: #15803d; }
        .dv-close-btn {
          background: #f9fafb; border: 1.5px solid #e5e7eb;
          border-radius: 10px; padding: 8px; cursor: pointer;
          color: var(--text-muted); display: flex; transition: all 0.15s;
        }
        .dv-close-btn:hover { background: #fef2f2; color: #ef4444; border-color: #fecaca; }

        .dv-body { padding: 16px 24px 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }

        .dv-empty {
          display: flex; flex-direction: column; align-items: center;
          gap: 10px; padding: 40px 20px; color: #9ca3af;
        }
        .dv-empty span { font-size: 2rem; }
        .dv-empty p { font-size: 0.9rem; }
        .dv-add-btn-big {
          display: flex; align-items: center; gap: 6px;
          background: #f0fdf4; color: #16a34a;
          border: 1.5px solid #bbf7d0; border-radius: 10px;
          padding: 8px 16px; font-size: 0.88rem; font-weight: 600;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
        }

        .dv-item {
          border-radius: 10px; padding: 12px 14px;
          cursor: pointer; transition: opacity 0.15s;
          display: flex; flex-direction: column; gap: 6px;
        }
        .dv-item:hover { opacity: 0.85; }
        .dv-item-top { display: flex; align-items: center; gap: 8px; }
        .dv-emoji { font-size: 1rem; }
        .dv-title { font-weight: 600; color: var(--text-primary); font-size: 0.95rem; flex: 1; }
        .dv-private {
          display: flex; align-items: center; gap: 3px;
          font-size: 0.72rem; color: #9ca3af; background: #f3f4f6;
          padding: 2px 7px; border-radius: 100px;
        }
        .dv-item-meta {
          display: flex; align-items: center; gap: 12px;
          font-size: 0.78rem; color: var(--text-muted);
        }
        .dv-item-meta span { display: flex; align-items: center; gap: 4px; }
        .dv-notes {
          font-size: 0.8rem; color: var(--text-muted);
          background: rgba(255,255,255,0.6); border-radius: 6px;
          padding: 6px 8px; line-height: 1.4;
        }
      `}</style>
    </div>
  );
}
