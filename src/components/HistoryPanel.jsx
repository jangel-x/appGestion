import { useMemo, useState } from "react";
import { parseISO, isBefore, startOfDay, format } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, ChevronDown, ChevronUp } from "lucide-react";

const CAT_EMOJI = { cita: "✂️", reunion: "🤝", personal: "👤", otro: "📌" };

export default function HistoryPanel({ appointments, onAppointmentClick, memberColors, currentUserId }) {
  const [showAll, setShowAll] = useState(false);
  const today = startOfDay(new Date());

  const past = useMemo(() =>
    appointments
      .filter((a) => { try { return isBefore(parseISO(a.date), today); } catch { return false; } })
      .sort((a, b) => b.date.localeCompare(a.date)),
    [appointments]
  );

  const visible = showAll ? past : past.slice(0, 15);

  const grouped = useMemo(() => {
    const map = {};
    visible.forEach((a) => {
      const key = format(parseISO(a.date), "MMMM yyyy", { locale: es });
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });
    return Object.entries(map);
  }, [visible]);

  if (past.length === 0) {
    return (
      <div className="hist-empty">
        <Clock size={28} style={{ opacity: 0.3 }} />
        <p>Sin historial todavía</p>
      </div>
    );
  }

  return (
    <div className="hist-panel">
      <div className="hist-count">{past.length} cita{past.length !== 1 ? "s" : ""} en el historial</div>

      {grouped.map(([month, apps]) => (
        <div key={month} className="hist-month">
          <div className="hist-month-header">{month}</div>
          {apps.map((a) => {
            const color = memberColors?.[a.createdBy] || "#4ade80";
            return (
              <div key={a.id} className="hist-item" style={{ borderLeft: `3px solid ${color}44` }}
                onClick={() => onAppointmentClick(a)}>
                <div className="hi-top">
                  <span className="hi-emoji">{CAT_EMOJI[a.category] || "📌"}</span>
                  <span className="hi-title">{a.title}</span>
                  <span className="hi-date">{format(parseISO(a.date), "d MMM", { locale: es })}</span>
                </div>
                {(a.clientName || a.time) && (
                  <div className="hi-meta">
                    {a.clientName && <span>👤 {a.clientName}</span>}
                    {a.time && <span>🕐 {a.time}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {past.length > 15 && (
        <button className="hist-more" onClick={() => setShowAll(!showAll)}>
          {showAll ? <><ChevronUp size={14} /> Ver menos</> : <><ChevronDown size={14} /> Ver todas ({past.length - 15} más)</>}
        </button>
      )}

      <style>{`
        .hist-panel { display: flex; flex-direction: column; gap: 14px; font-family: 'DM Sans', sans-serif; }
        .hist-count { font-size: 0.75rem; color: var(--text-muted); }
        .hist-month { display: flex; flex-direction: column; gap: 5px; }
        .hist-month-header { font-size: 0.73rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px; border-bottom: 1px solid var(--border); text-transform: capitalize; }
        .hist-item { background: var(--bg-hover); border-radius: 8px; padding: 8px 10px; cursor: pointer; transition: opacity 0.15s; display: flex; flex-direction: column; gap: 3px; }
        .hist-item:hover { opacity: 0.75; }
        .hi-top { display: flex; align-items: center; gap: 6px; }
        .hi-emoji { font-size: 0.85rem; flex-shrink: 0; }
        .hi-title { flex: 1; font-size: 0.84rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .hi-date { font-size: 0.73rem; color: var(--text-muted); flex-shrink: 0; }
        .hi-meta { display: flex; gap: 10px; font-size: 0.75rem; color: var(--text-muted); }
        .hist-more { display: flex; align-items: center; gap: 6px; justify-content: center; background: var(--bg-hover); border: 1.5px solid var(--border); border-radius: 10px; padding: 9px; font-size: 0.84rem; color: var(--text-secondary); cursor: pointer; font-family: 'DM Sans', sans-serif; font-weight: 500; transition: all 0.15s; }
        .hist-more:hover { border-color: var(--accent); color: var(--accent); }
        .hist-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 32px 20px; color: var(--text-muted); text-align: center; }
        .hist-empty p { font-size: 0.88rem; }
      `}</style>
    </div>
  );
}
