import { useState, useEffect } from "react";
import { X, Lock, Globe, Clock, FileText, User } from "lucide-react";

const CATEGORIES = [
  { value: "cita", label: "Cita cliente", emoji: "✂️" },
  { value: "reunion", label: "Reunión", emoji: "🤝" },
  { value: "personal", label: "Personal", emoji: "👤" },
  { value: "otro", label: "Otro", emoji: "📌" },
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
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          {readOnly && (
            <div className="readonly-banner">👁️ Solo lectura — no eres el creador de esta cita</div>
          )}
          {/* Title */}
          <div className="field">
            <label>Título *</label>
            <input
              className="input"
              placeholder="Ej: Corte de pelo, Consulta, Reunión..."
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          {/* Client name */}
          <div className="field">
            <label><User size={13} style={{marginRight:4}}/>Nombre del cliente / persona</label>
            <input
              className="input"
              placeholder="Opcional"
              value={form.clientName}
              onChange={(e) => set("clientName", e.target.value)}
            />
          </div>

          {/* Date & Time */}
          <div className="field-row">
            <div className="field">
              <label>Fecha *</label>
              <input className="input" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
            </div>
            <div className="field">
              <label><Clock size={13} style={{marginRight:4}}/>Hora</label>
              <input className="input" type="time" value={form.time} onChange={(e) => set("time", e.target.value)} />
            </div>
            <div className="field" style={{maxWidth:100}}>
              <label>Duración (min)</label>
              <input className="input" type="number" min={5} step={5} value={form.duration} onChange={(e) => set("duration", +e.target.value)} />
            </div>
          </div>

          {/* Category */}
          <div className="field">
            <label>Categoría</label>
            <div className="category-grid">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  className={`cat-btn ${form.category === c.value ? "active" : ""}`}
                  onClick={() => set("category", c.value)}
                >
                  <span>{c.emoji}</span> {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="field">
            <label><FileText size={13} style={{marginRight:4}}/>Notas</label>
            <textarea
              className="input"
              rows={3}
              placeholder="Observaciones, detalles..."
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>

          {/* Visibility */}
          <div className="field">
            <label>Visibilidad</label>
            <div className="visibility-toggle">
              <button
                className={`vis-btn ${form.visibility === "public" ? "active" : ""}`}
                onClick={() => set("visibility", "public")}
              >
                <Globe size={15} /> Pública (todos la ven)
              </button>
              <button
                className={`vis-btn ${form.visibility === "private" ? "active" : ""}`}
                onClick={() => set("visibility", "private")}
              >
                <Lock size={15} /> Privada (solo yo)
              </button>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          {isEdit && (
            <button className="delete-btn" onClick={onDelete}>Eliminar</button>
          )}
          <div style={{display:"flex", gap:8, marginLeft:"auto"}}>
            <button className="cancel-btn" onClick={onClose}>Cancelar</button>
            <button className="save-btn" onClick={handleSubmit} disabled={readOnly} style={readOnly ? {opacity:0.4,cursor:"not-allowed"} : {}}>
              {isEdit ? "Guardar cambios" : "Crear cita"}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.3);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; backdrop-filter: blur(4px);
          font-family: 'DM Sans', sans-serif;
          animation: fadeIn 0.15s ease;
        }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }

        .modal-card {
          background: #fff;
          border-radius: 20px;
          width: 100%; max-width: 560px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          animation: slideUp 0.2s ease;
          max-height: 90vh; overflow-y: auto;
        }
        @keyframes slideUp {
          from{opacity:0;transform:translateY(16px)}
          to{opacity:1;transform:translateY(0)}
        }

        .modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 24px 24px 0;
        }
        .modal-header h2 {
          font-family: 'DM Serif Display', serif;
          font-size: 1.4rem; color: #14532d; margin: 0;
        }
        .modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }
        .modal-footer {
          padding: 16px 24px 24px;
          display: flex; align-items: center;
          border-top: 1px solid #f0fdf4;
        }

        .field { display: flex; flex-direction: column; gap: 6px; }
        .field label { font-size: 0.82rem; font-weight: 500; color: #4b5563; display: flex; align-items: center; }
        .field-row { display: flex; gap: 12px; }
        .field-row .field { flex: 1; }

        .input {
          border: 1.5px solid #d1fae5;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 0.92rem;
          font-family: 'DM Sans', sans-serif;
          color: #1f2937;
          outline: none;
          transition: border-color 0.2s;
          width: 100%; box-sizing: border-box;
          resize: vertical;
        }
        .input:focus { border-color: #4ade80; box-shadow: 0 0 0 3px rgba(74,222,128,0.15); }

        .category-grid { display: flex; flex-wrap: wrap; gap: 8px; }
        .cat-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 8px;
          border: 1.5px solid #d1fae5; background: #f9fafb;
          font-size: 0.85rem; color: #4b5563;
          cursor: pointer; transition: all 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .cat-btn:hover { border-color: #4ade80; background: #f0fdf4; }
        .cat-btn.active { border-color: #4ade80; background: #dcfce7; color: #166534; font-weight: 600; }

        .visibility-toggle { display: flex; gap: 8px; }
        .vis-btn {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 10px; border-radius: 10px;
          border: 1.5px solid #d1fae5; background: #f9fafb;
          font-size: 0.85rem; color: #4b5563;
          cursor: pointer; transition: all 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .vis-btn:hover { border-color: #4ade80; }
        .vis-btn.active { border-color: #4ade80; background: #dcfce7; color: #166534; font-weight: 600; }

        .icon-btn {
          background: none; border: none; cursor: pointer;
          color: #9ca3af; padding: 6px; border-radius: 8px;
          transition: all 0.15s; display: flex;
        }
        .icon-btn:hover { background: #f0fdf4; color: #16a34a; }

        .save-btn {
          background: #16a34a; color: white;
          border: none; border-radius: 10px;
          padding: 10px 20px; font-size: 0.9rem; font-weight: 600;
          cursor: pointer; transition: all 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .save-btn:hover { background: #15803d; transform: translateY(-1px); }

        .cancel-btn {
          background: #f9fafb; color: #6b7280;
          border: 1.5px solid #e5e7eb; border-radius: 10px;
          padding: 10px 16px; font-size: 0.9rem;
          cursor: pointer; transition: all 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .cancel-btn:hover { border-color: #d1d5db; background: #f3f4f6; }

        .delete-btn {
          background: none; color: #ef4444;
          border: 1.5px solid #fecaca; border-radius: 10px;
          padding: 10px 16px; font-size: 0.9rem;
          cursor: pointer; transition: all 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .delete-btn:hover { background: #fef2f2; }
        .readonly-banner { background: #fef9c3; border: 1.5px solid #fde68a; border-radius: 10px; padding: 10px 14px; font-size: 0.85rem; color: #854d0e; }
      `}</style>
    </div>
  );
}
