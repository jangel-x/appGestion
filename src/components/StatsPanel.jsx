import { useMemo } from "react";
import { parseISO, format, startOfMonth, endOfMonth, isWithinInterval, subMonths, getDay } from "date-fns";
import { es } from "date-fns/locale";

const BAR_COLORS = ["#4ade80","#60a5fa","#f472b6","#fb923c","#a78bfa","#34d399","#facc15","#f87171"];

export default function StatsPanel({ appointments, memberDetails, currentUserId }) {
  const now = new Date();
  const thisMonth = { start: startOfMonth(now), end: endOfMonth(now) };
  const lastMonth = { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };

  const inRange = (a, range) => {
    try { return isWithinInterval(parseISO(a.date), range); } catch { return false; }
  };

  const thisMonthApps = useMemo(() => appointments.filter((a) => inRange(a, thisMonth)), [appointments]);
  const lastMonthApps = useMemo(() => appointments.filter((a) => inRange(a, lastMonth)), [appointments]);

  // Por miembro este mes
  const byMember = useMemo(() => {
    const map = {};
    thisMonthApps.forEach((a) => { map[a.createdBy] = (map[a.createdBy] || 0) + 1; });
    return Object.entries(map).sort(([, a], [, b]) => b - a);
  }, [thisMonthApps]);

  // Por día de la semana (histórico)
  const byWeekday = useMemo(() => {
    const days = [0, 0, 0, 0, 0, 0, 0];
    appointments.forEach((a) => { try { days[getDay(parseISO(a.date))]++; } catch {} });
    // Reordenar: Lun-Dom
    return [1,2,3,4,5,6,0].map((d) => ({ label: ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"][d], val: days[d] }));
  }, [appointments]);

  // Por categoría
  const byCategory = useMemo(() => {
    const map = {};
    appointments.forEach((a) => { const c = a.category || "otro"; map[c] = (map[c] || 0) + 1; });
    return Object.entries(map).sort(([, a], [, b]) => b - a);
  }, [appointments]);

  const maxWeekday = Math.max(...byWeekday.map((d) => d.val), 1);
  const maxMember = Math.max(...byMember.map(([, v]) => v), 1);
  const catLabels = { cita: "✂️ Citas", reunion: "🤝 Reuniones", personal: "👤 Personal", otro: "📌 Otro" };
  const diff = thisMonthApps.length - lastMonthApps.length;

  return (
    <div className="stats-panel">
      {/* Resumen */}
      <div className="stat-cards">
        <div className="stat-card">
          <div className="sc-num">{thisMonthApps.length}</div>
          <div className="sc-label">Este mes</div>
          {diff !== 0 && (
            <div className={`sc-diff ${diff > 0 ? "up" : "down"}`}>
              {diff > 0 ? "▲" : "▼"} {Math.abs(diff)} vs mes anterior
            </div>
          )}
        </div>
        <div className="stat-card">
          <div className="sc-num">{appointments.length}</div>
          <div className="sc-label">Total histórico</div>
        </div>
        <div className="stat-card">
          <div className="sc-num">{Object.keys(memberDetails || {}).length}</div>
          <div className="sc-label">Miembros</div>
        </div>
      </div>

      {/* Día de la semana más ocupado */}
      {appointments.length > 0 && (
        <div className="stat-section">
          <div className="stat-section-title">Días más ocupados</div>
          <div className="bar-chart">
            {byWeekday.map(({ label, val }, i) => (
              <div key={label} className="bar-col">
                <div className="bar-track">
                  <div className="bar-fill" style={{ height: `${(val / maxWeekday) * 100}%`, background: BAR_COLORS[i % BAR_COLORS.length] }} />
                </div>
                <div className="bar-label">{label}</div>
                {val > 0 && <div className="bar-val">{val}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Por miembro este mes */}
      {byMember.length > 0 && (
        <div className="stat-section">
          <div className="stat-section-title">Citas por miembro este mes</div>
          <div className="member-bars">
            {byMember.map(([uid, count], i) => {
              const m = memberDetails?.[uid];
              const name = uid === currentUserId ? "Yo" : (m?.name?.split(" ")[0] || "—");
              const color = m?.color || BAR_COLORS[i % BAR_COLORS.length];
              return (
                <div key={uid} className="mb-row">
                  <div className="mb-dot" style={{ background: color }} />
                  <span className="mb-name">{name}</span>
                  <div className="mb-track">
                    <div className="mb-fill" style={{ width: `${(count / maxMember) * 100}%`, background: color }} />
                  </div>
                  <span className="mb-count">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Por categoría */}
      {byCategory.length > 0 && (
        <div className="stat-section">
          <div className="stat-section-title">Por categoría</div>
          <div className="cat-pills">
            {byCategory.map(([cat, count], i) => (
              <div key={cat} className="cat-pill" style={{ borderColor: BAR_COLORS[i % BAR_COLORS.length] + "66", background: BAR_COLORS[i % BAR_COLORS.length] + "11" }}>
                <span>{catLabels[cat] || cat}</span>
                <span className="cat-count" style={{ color: BAR_COLORS[i % BAR_COLORS.length] }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {appointments.length === 0 && (
        <div className="stats-empty">Añade citas para ver estadísticas 📊</div>
      )}

      <style>{`
        .stats-panel { display: flex; flex-direction: column; gap: 18px; font-family: 'DM Sans', sans-serif; }
        .stat-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .stat-card { background: var(--bg-hover); border: 1.5px solid var(--border); border-radius: 12px; padding: 12px 10px; text-align: center; }
        .sc-num { font-family: 'DM Serif Display', serif; font-size: 1.6rem; color: var(--accent); line-height: 1; }
        .sc-label { font-size: 0.72rem; color: var(--text-muted); margin-top: 4px; font-weight: 500; }
        .sc-diff { font-size: 0.68rem; margin-top: 4px; font-weight: 600; }
        .sc-diff.up { color: #16a34a; }
        .sc-diff.down { color: #ef4444; }

        .stat-section { display: flex; flex-direction: column; gap: 10px; }
        .stat-section-title { font-size: 0.73rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }

        .bar-chart { display: flex; gap: 4px; align-items: flex-end; height: 80px; }
        .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; height: 100%; }
        .bar-track { flex: 1; width: 100%; background: var(--border); border-radius: 4px; overflow: hidden; display: flex; align-items: flex-end; }
        .bar-fill { width: 100%; border-radius: 4px; transition: height 0.4s ease; min-height: 2px; }
        .bar-label { font-size: 0.6rem; color: var(--text-muted); font-weight: 600; }
        .bar-val { font-size: 0.6rem; color: var(--text-secondary); font-weight: 700; }

        .member-bars { display: flex; flex-direction: column; gap: 7px; }
        .mb-row { display: flex; align-items: center; gap: 7px; }
        .mb-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .mb-name { font-size: 0.78rem; color: var(--text-secondary); width: 40px; flex-shrink: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .mb-track { flex: 1; height: 6px; background: var(--border); border-radius: 100px; overflow: hidden; }
        .mb-fill { height: 100%; border-radius: 100px; transition: width 0.4s ease; min-width: 4px; }
        .mb-count { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); width: 20px; text-align: right; flex-shrink: 0; }

        .cat-pills { display: flex; flex-wrap: wrap; gap: 6px; }
        .cat-pill { display: flex; align-items: center; gap: 6px; padding: 5px 10px; border-radius: 100px; border: 1.5px solid; font-size: 0.8rem; color: var(--text-secondary); }
        .cat-count { font-weight: 700; font-size: 0.85rem; }

        .stats-empty { text-align: center; padding: 24px; color: var(--text-muted); font-size: 0.88rem; }
      `}</style>
    </div>
  );
}
