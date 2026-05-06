import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval,
         startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday,
         addMonths, subMonths, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";

const CAT_EMOJI = { cita: "✂️", reunion: "🤝", personal: "👤", otro: "📌" };

export default function Calendar({ appointments, onDayClick, onAppointmentClick, memberColors, currentUserId }) {
  const [current, setCurrent] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null); // para móvil: día seleccionado

  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getAppsForDay = (day) =>
    appointments.filter((a) => {
      try { return isSameDay(parseISO(a.date), day); } catch { return false; }
    });

  const weekDays = ["L", "M", "X", "J", "V", "S", "D"];
  const weekDaysFull = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  const handleDayClick = (day) => {
    const dateStr = format(day, "yyyy-MM-dd");
    // En móvil, si el día tiene citas lo seleccionamos para ver el mini panel
    // En desktop delegamos directamente
    setSelectedDay((prev) => (prev === dateStr ? null : dateStr));
    onDayClick(dateStr);
  };

  const selectedApps = selectedDay ? getAppsForDay(parseISO(selectedDay)) : [];

  return (
    <div className="calendar">
      {/* ── Header ── */}
      <div className="cal-header">
        <button className="nav-btn" onClick={() => setCurrent(subMonths(current, 1))}>
          <ChevronLeft size={18} />
        </button>
        <h2 className="cal-title">
          {format(current, "MMMM yyyy", { locale: es })}
        </h2>
        <button className="nav-btn" onClick={() => setCurrent(addMonths(current, 1))}>
          <ChevronRight size={18} />
        </button>
        <button className="nav-btn today-btn" onClick={() => { setCurrent(new Date()); setSelectedDay(null); }}>
          Hoy
        </button>
      </div>

      {/* ── Weekday labels ── */}
      <div className="cal-weekdays">
        {weekDaysFull.map((d, i) => (
          <div key={d} className="weekday">
            <span className="wd-full">{d}</span>
            <span className="wd-short">{weekDays[i]}</span>
          </div>
        ))}
      </div>

      {/* ── Grid ── */}
      <div className="cal-grid">
        {days.map((day) => {
          const apps = getAppsForDay(day);
          const inMonth = isSameMonth(day, current);
          const today = isToday(day);
          const dateStr = format(day, "yyyy-MM-dd");
          const hasApps = apps.length > 0;

          return (
            <div
              key={day.toISOString()}
              className={`cal-day ${!inMonth ? "other-month" : ""} ${today ? "today" : ""} ${hasApps ? "has-apps" : ""}`}
              onClick={() => handleDayClick(day)}
            >
              <div className="day-header">
                <span className={`day-num ${today ? "today-num" : ""}`}>{format(day, "d")}</span>
                {/* Punto indicador en móvil cuando hay citas */}
                {hasApps && inMonth && <span className="day-dot-mobile" />}
              </div>

              {/* Chips de citas — solo en desktop */}
              <div className="day-apps desktop-apps">
                {apps.slice(0, 3).map((app) => {
                  const color = memberColors?.[app.createdBy] || "#4ade80";
                  return (
                    <div key={app.id} className="app-chip"
                      style={{ backgroundColor: color + "22", borderLeft: `3px solid ${color}` }}
                      onClick={(e) => { e.stopPropagation(); onAppointmentClick(app); }}>
                      <span className="app-emoji">{CAT_EMOJI[app.category] || "📌"}</span>
                      <span className="app-title">{app.title}</span>
                      {app.visibility === "private" && app.createdBy === currentUserId && (
                        <Lock size={9} style={{ marginLeft: "auto", opacity: 0.5, flexShrink: 0 }} />
                      )}
                    </div>
                  );
                })}
                {apps.length > 3 && (
                  <div className="more-apps">+{apps.length - 3} más</div>
                )}
              </div>

              {/* En móvil: barras de color compactas */}
              <div className="day-bars mobile-bars">
                {apps.slice(0, 3).map((app) => {
                  const color = memberColors?.[app.createdBy] || "#4ade80";
                  return (
                    <div key={app.id} className="day-bar" style={{ background: color }} />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .calendar { display: flex; flex-direction: column; width: 100%; font-family: 'DM Sans', sans-serif; }

        .cal-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
        .cal-title {
          font-family: 'DM Serif Display', serif;
          font-size: 1.3rem; color: var(--text-primary);
          margin: 0; text-transform: capitalize; flex: 1;
        }
        .nav-btn {
          background: var(--accent-light); border: 1.5px solid var(--accent-border);
          border-radius: 8px; padding: 6px 10px; cursor: pointer; color: var(--accent);
          display: flex; align-items: center; font-size: 0.85rem; font-weight: 500;
          transition: all 0.15s; font-family: 'DM Sans', sans-serif; flex-shrink: 0;
        }
        .nav-btn:hover { background: var(--accent-light2); }
        .today-btn { padding: 6px 14px; }

        .cal-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); margin-bottom: 4px; }
        .weekday {
          text-align: center; font-size: 0.72rem; font-weight: 600;
          color: var(--text-muted); padding: 4px 0;
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .wd-short { display: none; }

        .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }

        .cal-day {
          min-height: 100px; padding: 6px;
          border-radius: 8px; cursor: pointer;
          transition: background 0.15s;
          border: 1.5px solid transparent;
        }
        .cal-day:hover { background: var(--bg-hover); border-color: var(--accent-border); }
        .cal-day.other-month { opacity: 0.3; pointer-events: none; }
        .cal-day.today { background: var(--accent-light); border-color: var(--accent-border); }
        .cal-day.today:hover { border-color: var(--accent); }

        .day-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
        .day-num { font-size: 0.82rem; font-weight: 600; color: var(--text-primary); line-height: 1; }
        .today-num {
          background: var(--accent); color: white;
          border-radius: 50%; width: 22px; height: 22px;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.74rem;
        }
        .day-dot-mobile { display: none; }

        .day-apps { display: flex; flex-direction: column; gap: 2px; }
        .mobile-bars { display: none; }

        .app-chip {
          display: flex; align-items: center; gap: 4px;
          padding: 2px 5px; border-radius: 4px;
          font-size: 0.68rem; cursor: pointer;
          transition: opacity 0.15s; overflow: hidden;
        }
        .app-chip:hover { opacity: 0.75; }
        .app-emoji { font-size: 0.7rem; flex-shrink: 0; }
        .app-title {
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          color: var(--text-primary); font-weight: 500;
        }
        .more-apps { font-size: 0.67rem; color: var(--text-muted); padding: 1px 5px; cursor: pointer; }

        /* ── MOBILE ── */
        @media (max-width: 768px) {
          .cal-header { margin-bottom: 8px; }
          .cal-title { font-size: 1.05rem; }
          .nav-btn { padding: 5px 8px; }
          .today-btn { padding: 5px 10px; font-size: 0.8rem; }

          .wd-full { display: none; }
          .wd-short { display: inline; }
          .weekday { font-size: 0.65rem; letter-spacing: 0; }

          .cal-grid { gap: 1px; }

          .cal-day {
            min-height: 0;
            height: 48px;
            padding: 4px 3px 3px;
            border-radius: 6px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
          }
          .cal-day.has-apps { border-color: var(--accent-border); }

          .day-header {
            flex-direction: column;
            align-items: center;
            justify-content: center;
            margin-bottom: 2px;
            gap: 2px;
            width: 100%;
          }
          .day-num { font-size: 0.78rem; text-align: center; }
          .today-num { width: 24px; height: 24px; font-size: 0.72rem; }

          /* Punto indicador de citas en móvil */
          .day-dot-mobile {
            display: block;
            width: 4px; height: 4px;
            border-radius: 50%;
            background: var(--accent);
            flex-shrink: 0;
          }

          /* Ocultar chips de citas en móvil */
          .desktop-apps { display: none; }

          /* Mostrar barras de color compactas */
          .mobile-bars {
            display: flex;
            gap: 2px;
            width: 100%;
            justify-content: center;
          }
          .day-bar {
            height: 3px;
            flex: 1;
            max-width: 10px;
            border-radius: 2px;
            opacity: 0.85;
          }
        }
      `}</style>
    </div>
  );
}
