import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval,
         startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday,
         addMonths, subMonths, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Lock } from "lucide-react";

const CATEGORY_EMOJI = { cita: "✂️", reunion: "🤝", personal: "👤", otro: "📌" };

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
      {/* Header */}
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

      {/* Week days */}
      <div className="cal-weekdays">
        {weekDays.map((d) => (
          <div key={d} className="weekday">{d}</div>
        ))}
      </div>

      {/* Days grid */}
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
                <span className="day-num">{format(day, "d")}</span>
                {inMonth && (
                  <button
                    className="add-day-btn"
                    onClick={(e) => { e.stopPropagation(); onDayClick(format(day, "yyyy-MM-dd")); }}
                  >
                    <Plus size={12} />
                  </button>
                )}
              </div>

              <div className="day-apps">
                {apps.slice(0, 3).map((app) => {
                  const color = memberColors?.[app.createdBy] || "#4ade80";
                  const isPrivate = app.visibility === "private";
                  const isOwn = app.createdBy === currentUserId;
                  return (
                    <div
                      key={app.id}
                      className="app-chip"
                      style={{ backgroundColor: color + "22", borderLeft: `3px solid ${color}` }}
                      onClick={(e) => { e.stopPropagation(); onAppointmentClick(app); }}
                    >
                      <span className="app-emoji">{CATEGORY_EMOJI[app.category] || "📌"}</span>
                      <span className="app-title">{app.title}</span>
                      {isPrivate && isOwn && <Lock size={10} style={{ marginLeft: "auto", opacity: 0.6 }} />}
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
        .calendar { display: flex; flex-direction: column; height: 100%; font-family: 'DM Sans', sans-serif; }

        .cal-header {
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 16px;
        }
        .cal-title {
          font-family: 'DM Serif Display', serif;
          font-size: 1.5rem; color: #14532d;
          margin: 0; text-transform: capitalize; flex: 1;
        }

        .nav-btn {
          background: #f0fdf4; border: 1.5px solid #bbf7d0;
          border-radius: 8px; padding: 6px 10px;
          cursor: pointer; color: #16a34a;
          display: flex; align-items: center;
          font-size: 0.85rem; font-weight: 500;
          transition: all 0.15s; font-family: 'DM Sans', sans-serif;
        }
        .nav-btn:hover { background: #dcfce7; border-color: #4ade80; }
        .today-btn { padding: 6px 14px; }

        .cal-weekdays {
          display: grid; grid-template-columns: repeat(7, 1fr);
          margin-bottom: 4px;
        }
        .weekday {
          text-align: center; font-size: 0.78rem;
          font-weight: 600; color: #6b7280;
          padding: 6px 0; text-transform: uppercase; letter-spacing: 0.5px;
        }

        .cal-grid {
          display: grid; grid-template-columns: repeat(7, 1fr);
          gap: 2px; flex: 1;
        }

        .cal-day {
          min-height: 100px; padding: 6px;
          border-radius: 10px; cursor: pointer;
          transition: background 0.15s;
          border: 1.5px solid transparent;
          position: relative;
        }
        .cal-day:hover { background: #f0fdf4; border-color: #bbf7d0; }
        .cal-day:hover .add-day-btn { opacity: 1; }
        .cal-day.other-month { opacity: 0.35; }
        .cal-day.today { background: #f0fdf4; border-color: #4ade80; }

        .day-header {
          display: flex; align-items: center;
          justify-content: space-between; margin-bottom: 4px;
        }
        .day-num {
          font-size: 0.85rem; font-weight: 600; color: #374151;
        }
        .today .day-num {
          background: #16a34a; color: white;
          border-radius: 50%; width: 22px; height: 22px;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.78rem;
        }

        .add-day-btn {
          opacity: 0; background: #dcfce7; border: none;
          border-radius: 4px; padding: 2px; cursor: pointer;
          color: #16a34a; display: flex; transition: opacity 0.15s;
        }

        .day-apps { display: flex; flex-direction: column; gap: 2px; }
        .app-chip {
          display: flex; align-items: center; gap: 4px;
          padding: 2px 6px; border-radius: 4px;
          font-size: 0.72rem; cursor: pointer;
          transition: opacity 0.15s; overflow: hidden;
        }
        .app-chip:hover { opacity: 0.8; }
        .app-emoji { font-size: 0.65rem; flex-shrink: 0; }
        .app-title {
          white-space: nowrap; overflow: hidden;
          text-overflow: ellipsis; color: #1f2937;
          font-weight: 500;
        }
        .more-apps {
          font-size: 0.7rem; color: #6b7280;
          padding: 1px 6px;
        }
      `}</style>
    </div>
  );
}
