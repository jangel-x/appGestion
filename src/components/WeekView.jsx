import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, parseISO, addWeeks, subWeeks } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { useState } from "react";

const CAT_EMOJI = { cita: "✂️", reunion: "🤝", personal: "👤", otro: "📌" };
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7:00 - 20:00

export default function WeekView({ appointments, onDayClick, onAppointmentClick, memberColors, currentUserId }) {
  const [current, setCurrent] = useState(new Date());
  const weekStart = startOfWeek(current, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(current, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getAppsForDay = (day) =>
    appointments.filter((a) => { try { return isSameDay(parseISO(a.date), day); } catch { return false; } })
      .sort((a, b) => (a.time || "").localeCompare(b.time || ""));

  const timeToRow = (time) => {
    if (!time) return 1;
    const [h, m] = time.split(":").map(Number);
    return ((h - 7) * 60 + (m || 0)) + 1;
  };

  const durationToRows = (dur) => Math.max(30, dur || 30);

  return (
    <div className="week-view">
      <div className="wv-header">
        <button className="wv-nav" onClick={() => setCurrent(subWeeks(current, 1))}><ChevronLeft size={17} /></button>
        <div className="wv-title">
          <span>{format(weekStart, "d MMM", { locale: es })}</span>
          <span className="wv-sep">—</span>
          <span>{format(weekEnd, "d MMM yyyy", { locale: es })}</span>
        </div>
        <button className="wv-nav" onClick={() => setCurrent(addWeeks(current, 1))}><ChevronRight size={17} /></button>
        <button className="wv-today" onClick={() => setCurrent(new Date())}>Hoy</button>
      </div>

      <div className="wv-grid-wrap">
        {/* Day headers */}
        <div className="wv-day-headers">
          <div className="wv-time-gutter" />
          {days.map((day) => (
            <div key={day.toISOString()} className={`wv-day-header ${isToday(day) ? "today" : ""}`}
              onClick={() => onDayClick(format(day, "yyyy-MM-dd"))}>
              <span className="wvdh-name">{format(day, "EEE", { locale: es })}</span>
              <span className={`wvdh-num ${isToday(day) ? "today-circle" : ""}`}>{format(day, "d")}</span>
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div className="wv-grid">
          {/* Time gutter */}
          <div className="wv-time-col">
            {HOURS.map((h) => (
              <div key={h} className="wv-hour-label">{String(h).padStart(2, "0")}:00</div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const apps = getAppsForDay(day);
            return (
              <div key={day.toISOString()} className={`wv-day-col ${isToday(day) ? "today-col" : ""}`}
                onClick={() => onDayClick(format(day, "yyyy-MM-dd"))}>
                {/* Hour lines */}
                {HOURS.map((h) => <div key={h} className="wv-hour-line" />)}

                {/* Appointments */}
                {apps.map((a) => {
                  const color = memberColors?.[a.createdBy] || "#4ade80";
                  const top = timeToRow(a.time);
                  const height = durationToRows(a.duration);
                  return (
                    <div key={a.id} className="wv-app"
                      style={{
                        background: color + "22",
                        borderLeft: `3px solid ${color}`,
                        top: `${(top / 60) * 56}px`,
                        minHeight: `${(height / 60) * 56}px`,
                      }}
                      onClick={(e) => { e.stopPropagation(); onAppointmentClick(a); }}>
                      <div className="wva-title">{CAT_EMOJI[a.category] || "📌"} {a.title}</div>
                      {a.time && <div className="wva-time">{a.time}</div>}
                      {a.clientName && <div className="wva-client">👤 {a.clientName}</div>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .week-view { display: flex; flex-direction: column; width: 100%; font-family: 'DM Sans', sans-serif; min-height: 0; flex: 1; }

        .wv-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; flex-shrink: 0; }
        .wv-title { flex: 1; display: flex; align-items: center; gap: 6px; font-family: 'DM Serif Display', serif; font-size: 1.15rem; color: var(--text-primary); }
        .wv-sep { color: var(--text-muted); font-size: 0.9rem; }
        .wv-nav { background: var(--accent-light); border: 1.5px solid var(--accent-border); border-radius: 8px; padding: 5px 8px; cursor: pointer; color: var(--accent); display: flex; align-items: center; transition: background 0.15s; }
        .wv-nav:hover { background: var(--accent-light2); }
        .wv-today { background: var(--accent-light); border: 1.5px solid var(--accent-border); border-radius: 8px; padding: 5px 12px; cursor: pointer; color: var(--accent); font-size: 0.84rem; font-weight: 600; font-family: 'DM Sans', sans-serif; transition: background 0.15s; }
        .wv-today:hover { background: var(--accent-light2); }

        .wv-grid-wrap { flex: 1; overflow: auto; min-height: 0; border: 1.5px solid var(--border); border-radius: 12px; }

        .wv-day-headers { display: flex; position: sticky; top: 0; z-index: 10; background: var(--bg-card); border-bottom: 1.5px solid var(--border); }
        .wv-time-gutter { width: 52px; flex-shrink: 0; }
        .wv-day-header { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 8px 4px; cursor: pointer; transition: background 0.15s; border-left: 1px solid var(--border); }
        .wv-day-header:hover { background: var(--bg-hover); }
        .wv-day-header.today { background: var(--accent-light); }
        .wvdh-name { font-size: 0.68rem; text-transform: capitalize; color: var(--text-muted); font-weight: 600; letter-spacing: 0.3px; }
        .wvdh-num { font-size: 1rem; font-weight: 700; color: var(--text-primary); line-height: 1.4; }
        .today-circle { background: var(--accent); color: white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 0.88rem; }

        .wv-grid { display: flex; position: relative; }
        .wv-time-col { width: 52px; flex-shrink: 0; display: flex; flex-direction: column; }
        .wv-hour-label { height: 56px; display: flex; align-items: flex-start; padding: 2px 6px 0 6px; font-size: 0.64rem; color: var(--text-muted); flex-shrink: 0; border-top: 1px solid var(--border); }

        .wv-day-col { flex: 1; position: relative; border-left: 1px solid var(--border); cursor: pointer; }
        .wv-day-col.today-col { background: var(--accent-light); }
        .wv-hour-line { height: 56px; border-top: 1px solid var(--border); }

        .wv-app { position: absolute; left: 2px; right: 2px; border-radius: 6px; padding: 3px 5px; cursor: pointer; transition: opacity 0.15s; overflow: hidden; z-index: 5; }
        .wv-app:hover { opacity: 0.8; }
        .wva-title { font-size: 0.72rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .wva-time { font-size: 0.65rem; color: var(--text-muted); }
        .wva-client { font-size: 0.65rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        @media (max-width: 768px) {
          .wv-grid-wrap { border-radius: 8px; }
          .wv-time-gutter { width: 36px; }
          .wv-time-col { width: 36px; }
          .wv-hour-label { padding: 2px 3px; font-size: 0.58rem; }
          .wvdh-name { font-size: 0.6rem; }
          .wvdh-num { font-size: 0.85rem; }
          .today-circle { width: 22px; height: 22px; font-size: 0.76rem; }
          .wv-app { padding: 2px 3px; }
          .wva-title { font-size: 0.65rem; }
        }
      `}</style>
    </div>
  );
}
