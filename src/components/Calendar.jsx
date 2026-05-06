import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval,
         startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday,
         addMonths, subMonths, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Lock } from "lucide-react";

export default function Calendar({ appointments, onDayClick, onAppointmentClick, memberColors, currentUserId }) {
  const [current, setCurrent] = useState(new Date());

  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getAppsForDay = (day) =>
    appointments.filter((a) => {
      try { return isSameDay(parseISO(a.date), day); } catch { return false; }
    });

  const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  return (
    <div className="calendar">
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
        <button className="nav-btn today-btn" onClick={() => setCurrent(new Date())}>
          Hoy
        </button>
      </div>

      <div className="cal-weekdays">
        {weekDays.map((d) => (
          <div key={d} className="weekday">{d}</div>
        ))}
      </div>

      <div className="cal-grid">
        {days.map((day) => {
          const apps = getAppsForDay(day);
          const inMonth = isSameMonth(day, current);
          const today = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={`cal-day ${!inMonth ? "other-month" : ""} ${today ? "today" : ""}`}
              onClick={() => onDayClick(format(day, "yyyy-MM-dd"))}
            >
              <div className="day-header">
                <span className={`day-num ${today ? "today-num" : ""}`}>{format(day, "d")}</span>
                {inMonth && (
                  <button className="add-day-btn"
                    onClick={(e) => { e.stopPropagation(); onDayClick(format(day, "yyyy-MM-dd")); }}>
                    <Plus size={11} />
                  </button>
                )}
              </div>

              <div className="day-apps">
                {apps.slice(0, 3).map((app) => {
                  const color = memberColors?.[app.createdBy] || "#4ade80";
                  const isPrivate = app.visibility === "private";
                  const isOwn = app.createdBy === currentUserId;
                  return (
                    <div key={app.id} className="app-chip"
                      style={{ backgroundColor: color + "22", borderLeft: `3px solid ${color}` }}
                      onClick={(e) => { e.stopPropagation(); onAppointmentClick(app); }}>
                      <span className="app-emoji">{{"cita":"✂️","reunion":"🤝","personal":"👤","otro":"📌"}[app.category] || "📌"}</span>
                      <span className="app-title">{app.title}</span>
                      {isPrivate && isOwn && <Lock size={9} style={{ marginLeft: "auto", opacity: 0.5, flexShrink: 0 }} />}
                    </div>
                  );
                })}
                {apps.length > 3 && (
                  <div className="more-apps">+{apps.length - 3} más</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .calendar { display: flex; flex-direction: column; width: 100%; font-family: 'DM Sans', sans-serif; }

        .cal-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .cal-title {
          font-family: 'DM Serif Display', serif;
          font-size: 1.3rem; color: var(--text-primary);
          margin: 0; text-transform: capitalize; flex: 1;
        }
        .nav-btn {
          background: var(--accent-light); border: 1.5px solid var(--accent-border);
          border-radius: 8px; padding: 6px 10px; cursor: pointer; color: var(--accent);
          display: flex; align-items: center; font-size: 0.85rem; font-weight: 500;
          transition: all 0.15s; font-family: 'DM Sans', sans-serif;
        }
        .nav-btn:hover { background: var(--accent-light2); }
        .today-btn { padding: 6px 14px; }

        .cal-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); margin-bottom: 4px; }
        .weekday {
          text-align: center; font-size: 0.72rem; font-weight: 600;
          color: var(--text-muted); padding: 4px 0;
          text-transform: uppercase; letter-spacing: 0.5px;
        }

        .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }

        .cal-day {
          min-height: 100px; padding: 6px;
          border-radius: 8px; cursor: pointer;
          transition: background 0.15s;
          border: 1.5px solid transparent;
        }
        .cal-day:hover { background: var(--bg-hover); border-color: var(--accent-border); }
        .cal-day:hover .add-day-btn { opacity: 1; }
        .cal-day.other-month { opacity: 0.3; }
        .cal-day.today { background: var(--accent-light); border-color: var(--accent); }

        .day-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 3px; }
        .day-num { font-size: 0.82rem; font-weight: 600; color: var(--text-primary); }
        .today-num {
          background: var(--accent); color: white;
          border-radius: 50%; width: 20px; height: 20px;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.74rem;
        }

        .add-day-btn {
          opacity: 0; background: var(--accent-light2); border: none;
          border-radius: 4px; padding: 2px; cursor: pointer;
          color: var(--accent); display: flex; transition: opacity 0.15s;
        }

        .day-apps { display: flex; flex-direction: column; gap: 2px; }
        .app-chip {
          display: flex; align-items: center; gap: 4px;
          padding: 2px 5px; border-radius: 3px;
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

        @media (max-width: 768px) {
          .cal-title { font-size: 1.1rem; }
          .cal-day { min-height: 60px; padding: 3px; }
          .day-num { font-size: 0.75rem; }
          .today-num { width: 18px; height: 18px; font-size: 0.68rem; }
          .app-chip { font-size: 0.62rem; padding: 1px 4px; }
          .weekday { font-size: 0.62rem; }
          .add-day-btn { display: none; }
        }
      `}</style>
    </div>
  );
}
