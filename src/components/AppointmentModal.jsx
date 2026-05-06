import { useState, useEffect } from "react";
import { X, Lock, Globe, Clock, FileText, User } from "lucide-react";

const CATEGORIES = [
  { value: "cita", label: "Cita cliente" },
  { value: "reunion", label: "Reunión" },
  { value: "personal", label: "Personal" },
  { value: "otro", label: "Otro" },
];

export default function AppointmentModal({ date, appointment, readOnly, onSave, onClose, onDelete }) {
  const isEdit = !!appointment;
  const [form, setForm] = useState({
    title: "",
    date: date || new Date().toISOString().split("T")[0],
    time: "09:00",
    duration: 30,
    category: "cita",
    notes: "",
    clientName: "",
    visibility: "public",
  });

  useEffect(() => {
    if (appointment) {
      setForm({
        title: appointment.title || "",
        date: appointment.date || "",
        time: appointment.time || "09:00",
        duration: appointment.duration || 30,
        category: appointment.category || "cita",
        notes: appointment.notes || "",
        clientName: appointment.clientName || "",
        visibility: appointment.visibility || "public",
      });
    }
  }, [appointment]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = () => {
    if (!form.title.trim() || !form.date) return;
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>

        <div className="modal-header">
          <h2>{isEdit ? "Editar cita" : "Nueva cita"}</h2>
          <button className="m-icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          {readOnly && (
            <div className="readonly-banner">Solo lectura — no eres el creador de esta cita</div>
          )}

          <div className="field">
            <label className="field-label">Título *</label>
            <input className="m-input" placeholder="Ej: Corte de pelo, Consulta, Reunión..."
              value={form.title} onChange={(e) => set("title", e.target.value)} disabled={readOnly} />
          </div>

          <div className="field">
            <label className="field-label"><User size={13} /> Nombre del cliente / persona</label>
            <input className="m-input" placeholder="Opcional"
              value={form.clientName} onChange={(e) => set("clientName", e.target.value)} disabled={readOnly} />
          </div>

          <div className="field-row">
            <div className="field">
              <label className="field-label">Fecha *</label>
              <input className="m-input" type="date" value={form.date}
                onChange={(e) => set("date", e.target.value)} disabled={readOnly} />
            </div>
            <div className="field">
              <label className="field-label"><Clock size={13} /> Hora</label>
              <input className="m-input" type="time" value={form.time}
                onChange={(e) => set("time", e.target.value)} disabled={readOnly} />
            </div>
            <div className="field dur-field">
              <label className="field-label">Duración (min)</label>
              <input className="m-input" type="number" min={5} step={5} value={form.duration}
                onChange={(e) => set("duration", +e.target.value)} disabled={readOnly} />
            </div>
          </div>

          <div className="field">
            <label className="field-label">Categoría</label>
            <div className="category-grid">
              {CATEGORIES.map((c) => (
                <button key={c.value}
                  className={`cat-btn ${form.category === c.value ? "active" : ""}`}
                  onClick={() => !readOnly && set("category", c.value)}
                  disabled={readOnly}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label className="field-label"><FileText size={13} /> Notas</label>
            <textarea className="m-input" rows={3} placeholder="Observaciones, detalles..."
              value={form.notes} onChange={(e) => set("notes", e.target.value)} disabled={readOnly} />
          </div>

          <div className="field">
            <label className="field-label">Visibilidad</label>
            <div className="vis-toggle">
              <button className={`vis-btn ${form.visibility === "public" ? "active" : ""}`}
                onClick={() => !readOnly && set("visibility", "public")} disabled={readOnly}>
                <Globe size={14} /> Pública
              </button>
              <button className={`vis-btn ${form.visibility === "private" ? "active" : ""}`}
                onClick={() => !readOnly && set("visibility", "private")} disabled={readOnly}>
                <Lock size={14} /> Privada
              </button>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          {isEdit && !readOnly && (
            <button className="delete-btn" onClick={onDelete}>Eliminar</button>
          )}
          <div className="footer-right">
            <button className="cancel-btn" onClick={onClose}>Cancelar</button>
            {!readOnly && (
              <button className="save-btn" onClick={handleSubmit}>
                {isEdit ? "Guardar cambios" : "Crear cita"}
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.4);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; backdrop-filter: blur(6px);
          font-family: 'DM Sans', sans-serif;
          animation: mFadeIn 0.15s ease;
          padding: 16px;
        }
        @keyframes mFadeIn { from{opacity:0} to{opacity:1} }

        .modal-card {
          background: var(--bg-card);
          border: 1.5px solid var(--border);
          border-radius: 20px;
          width: 100%; max-width: 540px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.25);
          animation: mSlideUp 0.2s ease;
          max-height: 92vh; overflow-y: auto;
        }
        @keyframes mSlideUp {
          from{opacity:0;transform:translateY(14px)}
          to{opacity:1;transform:translateY(0)}
        }

        .modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 22px 22px 0;
          position: sticky; top: 0;
          background: var(--bg-card);
          z-index: 2;
          padding-bottom: 16px;
          border-bottom: 1.5px solid var(--border);
        }
        .modal-header h2 {
          font-family: 'DM Serif Display', serif;
          font-size: 1.35rem; color: var(--text-primary); margin: 0;
        }
        .m-icon-btn {
          background: var(--bg-hover); border: 1.5px solid var(--border);
          border-radius: 8px; padding: 6px; cursor: pointer;
          color: var(--text-muted); display: flex; transition: all 0.15s;
        }
        .m-icon-btn:hover { background: #fef2f2; color: #ef4444; border-color: #fecaca; }

        .modal-body {
          padding: 18px 22px;
          display: flex; flex-direction: column; gap: 14px;
        }

        .modal-footer {
          padding: 14px 22px 22px;
          display: flex; align-items: center;
          border-top: 1.5px solid var(--border);
          gap: 8px;
        }
        .footer-right { display: flex; gap: 8px; margin-left: auto; }

        .field { display: flex; flex-direction: column; gap: 5px; }
        .field-label {
          font-size: 0.8rem; font-weight: 600;
          color: var(--text-secondary);
          display: flex; align-items: center; gap: 5px;
        }
        .field-row { display: flex; gap: 10px; }
        .field-row .field { flex: 1; }
        .dur-field { max-width: 110px; }

        .m-input {
          border: 1.5px solid var(--border);
          border-radius: 10px;
          padding: 9px 12px;
          font-size: 0.9rem;
          font-family: 'DM Sans', sans-serif;
          color: var(--text-primary);
          background: var(--bg-input);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          width: 100%; box-sizing: border-box;
          resize: vertical;
        }
        .m-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-light);
        }
        .m-input:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Fix date/time inputs in dark mode */
        .m-input[type="date"]::-webkit-calendar-picker-indicator,
        .m-input[type="time"]::-webkit-calendar-picker-indicator {
          filter: var(--icon-filter, none);
          cursor: pointer;
          opacity: 0.6;
        }

        .category-grid { display: flex; flex-wrap: wrap; gap: 7px; }
        .cat-btn {
          padding: 7px 14px; border-radius: 8px;
          border: 1.5px solid var(--border);
          background: var(--bg-hover);
          font-size: 0.84rem; color: var(--text-secondary);
          cursor: pointer; transition: all 0.15s;
          font-family: 'DM Sans', sans-serif; font-weight: 500;
        }
        .cat-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
        .cat-btn.active {
          border-color: var(--accent);
          background: var(--accent-light);
          color: var(--accent); font-weight: 600;
        }
        .cat-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .vis-toggle { display: flex; gap: 8px; }
        .vis-btn {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px;
          padding: 10px; border-radius: 10px;
          border: 1.5px solid var(--border);
          background: var(--bg-hover);
          font-size: 0.84rem; color: var(--text-secondary);
          cursor: pointer; transition: all 0.15s;
          font-family: 'DM Sans', sans-serif; font-weight: 500;
        }
        .vis-btn:hover:not(:disabled) { border-color: var(--accent); }
        .vis-btn.active {
          border-color: var(--accent);
          background: var(--accent-light);
          color: var(--accent); font-weight: 600;
        }
        .vis-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .save-btn {
          background: var(--accent); color: white;
          border: none; border-radius: 10px;
          padding: 10px 20px; font-size: 0.9rem; font-weight: 600;
          cursor: pointer; transition: all 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .save-btn:hover { background: var(--accent-dark); transform: translateY(-1px); }

        .cancel-btn {
          background: var(--bg-hover); color: var(--text-muted);
          border: 1.5px solid var(--border); border-radius: 10px;
          padding: 10px 16px; font-size: 0.9rem;
          cursor: pointer; transition: all 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .cancel-btn:hover { border-color: var(--text-muted); }

        .delete-btn {
          background: none; color: #ef4444;
          border: 1.5px solid #fecaca; border-radius: 10px;
          padding: 10px 16px; font-size: 0.9rem;
          cursor: pointer; transition: all 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .delete-btn:hover { background: #fef2f2; }

        .readonly-banner {
          background: var(--bg-hover);
          border: 1.5px solid var(--border);
          border-radius: 10px; padding: 10px 14px;
          font-size: 0.84rem; color: var(--text-muted);
          display: flex; align-items: center; gap: 8px;
        }

        @media (max-width: 540px) {
          .modal-card { border-radius: 16px; max-height: 96vh; }
          .field-row { flex-direction: column; }
          .dur-field { max-width: 100%; }
          .vis-toggle { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}
