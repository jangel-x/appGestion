import { X, Plus, Lock, Clock, User } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export default function DayView({ date, appointments, onClose, onAdd, onAppointmentClick, memberColors, currentUserId }) {
  const dateObj = (() => { try { return parseISO(date); } catch { return new Date(); } })();
  const dayApps = appointments
    .filter((a) => a.date === date)
    .sort((a, b) => (a.time || "").localeCompare(b.time || ""));

  const CATEGORY_LABEL = { cita: "Cita", reunion: "Reunión", personal: "Personal", otro: "Otro" };

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
              <Plus size={15} /> Nueva cita
            </button>
            <button className="dv-close-btn" onClick={onClose}><X size={17} /></button>
          </div>
        </div>

        <div className="dv-body">
          {dayApps.length === 0 ? (
            <div className="dv-empty">
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
                <div key={a.id} className="dv-item"
                  style={{ borderLeft: `4px solid ${color}`, background: color + "12" }}
                  onClick={() => { onClose(); onAppointmentClick(a); }}>
                  <div className="dv-item-top">
                    <span className="dv-category-tag" style={{ background: color + "22", color }}>
                      {CATEGORY_LABEL[a.category] || "Cita"}
                    </span>
                    <span className="dv-title">{a.title}</span>
                    {a.visibility === "private" && isOwn && (
                      <span className="dv-private"><Lock size={10} /> Privada</span>
                    )}
                  </div>
                  <div className="dv-item-meta">
                    {a.time && <span><Clock size={11} /> {a.time}{a.duration ? ` · ${a.duration} min` : ""}</span>}
                    {a.clientName && <span><User size={11} /> {a.clientName}</span>}
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
          font-family: 'DM Sans', sans-serif; padding: 16px;
          animation: fadeIn 0.15s ease;
        }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        .dayview-card {
          background: var(--bg-card); border-radius: 20px;
          width: 100%; max-width: 480px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          max-height: 85vh; display: flex; flex-direction: column;
          animation: slideUp 0.2s ease; border: 1.5px solid var(--border);
        }
        @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .dv-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          padding: 22px 22px 16px; border-bottom: 1.5px solid var(--border); flex-shrink: 0;
        }
        .dv-weekday { font-size: 0.78rem; text-transform: capitalize; color: var(--text-muted); font-weight: 500; margin-bottom: 2px; }
        .dv-date { font-family: 'DM Serif Display', serif; font-size: 1.2rem; color: var(--text-primary); text-transform: capitalize; }
        .dv-add-btn {
          display: flex; align-items: center; gap: 5px;
          background: var(--accent); color: white; border: none; border-radius: 10px;
          padding: 7px 13px; font-size: 0.82rem; font-weight: 600;
          cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s;
        }
        .dv-add-btn:hover { background: var(--accent-dark); }
        .dv-close-btn {
          background: var(--bg-hover); border: 1.5px solid var(--border);
          border-radius: 10px; padding: 7px; cursor: pointer;
          color: var(--text-muted); display: flex; transition: all 0.15s;
        }
        .dv-close-btn:hover { background: #fef2f2; color: #ef4444; border-color: #fecaca; }
        .dv-body { padding: 14px 20px 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
        .dv-empty { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 36px 20px; color: var(--text-muted); }
        .dv-empty p { font-size: 0.9rem; }
        .dv-add-btn-big {
          display: flex; align-items: center; gap: 6px;
          background: var(--accent-light); color: var(--accent);
          border: 1.5px solid var(--accent-border); border-radius: 10px;
          padding: 8px 16px; font-size: 0.88rem; font-weight: 600;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
        }
        .dv-item {
          border-radius: 10px; padding: 12px 14px;
          cursor: pointer; transition: opacity 0.15s;
          display: flex; flex-direction: column; gap: 6px;
        }
        .dv-item:hover { opacity: 0.85; }
        .dv-item-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .dv-category-tag { font-size: 0.72rem; font-weight: 600; padding: 2px 8px; border-radius: 100px; }
        .dv-title { font-weight: 600; color: var(--text-primary); font-size: 0.95rem; flex: 1; }
        .dv-private { display: flex; align-items: center; gap: 3px; font-size: 0.72rem; color: var(--text-muted); background: var(--bg-hover); padding: 2px 7px; border-radius: 100px; }
        .dv-item-meta { display: flex; align-items: center; gap: 12px; font-size: 0.78rem; color: var(--text-muted); flex-wrap: wrap; }
        .dv-item-meta span { display: flex; align-items: center; gap: 4px; }
        .dv-notes { font-size: 0.8rem; color: var(--text-muted); background: var(--bg-hover); border-radius: 6px; padding: 6px 8px; line-height: 1.4; }
      `}</style>
    </div>
  );
}
