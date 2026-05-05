import { useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useGroups, useAppointments } from "../hooks/useFirestore";
import Calendar from "../components/Calendar";
import GroupPanel from "../components/GroupPanel";
import AppointmentModal from "../components/AppointmentModal";
import DayView from "../components/DayView";
import SettingsModal from "../components/SettingsModal";
import MobileNav from "../components/MobileNav";
import { LogOut, Filter, Calendar as CalIcon, Plus, Settings } from "lucide-react";
import { format, parseISO, isAfter, startOfDay } from "date-fns";
import { es } from "date-fns/locale";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const { groups, createGroup, joinGroup, leaveGroup } = useGroups();

  const [activeGroup, setActiveGroup] = useState(null);
  const [filter, setFilter] = useState("all");
  const [modalState, setModalState] = useState(null);
  const [dayView, setDayView] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [mobileTab, setMobileTab] = useState("calendar");

  const { appointments, loading, addAppointment, updateAppointment, deleteAppointment } =
    useAppointments(activeGroup?.id, filter);

  const memberColors = useMemo(() => {
    if (!activeGroup?.memberDetails) return {};
    const map = {};
    Object.entries(activeGroup.memberDetails).forEach(([uid, m]) => { map[uid] = m.color || "#4ade80"; });
    return map;
  }, [activeGroup]);

  const canEdit = (appointment) => {
    if (!appointment || !user) return false;
    if (appointment.createdBy === user.uid) return true;
    if (activeGroup?.ownerId === user.uid) return true;
    if ((activeGroup?.leaders || []).includes(user.uid)) return true;
    return false;
  };

  const upcoming = useMemo(() => {
    const now = startOfDay(new Date());
    return appointments
      .filter((a) => { try { return !isAfter(now, parseISO(a.date)); } catch { return false; } })
      .slice(0, 8);
  }, [appointments]);

  const handleDayClick = (date) => {
    const dayApps = appointments.filter((a) => a.date === date);
    if (dayApps.length > 0) setDayView(date);
    else setModalState({ date });
  };

  const handleAppointmentClick = (appointment) => {
    setModalState({ appointment, readOnly: !canEdit(appointment) });
  };

  const handleSave = async (formData) => {
    if (!activeGroup) return;
    if (modalState?.appointment) {
      await updateAppointment(activeGroup.id, modalState.appointment.id, formData);
    } else {
      await addAppointment(activeGroup.id, formData);
    }
    setModalState(null);
  };

  const handleDelete = async () => {
    if (!activeGroup || !modalState?.appointment) return;
    await deleteAppointment(activeGroup.id, modalState.appointment.id);
    setModalState(null);
  };

  const filterOptions = useMemo(() => {
    const base = [
      { value: "all", label: "Todas" },
      { value: "mine", label: "Mis citas" },
    ];
    if (activeGroup?.memberDetails) {
      Object.entries(activeGroup.memberDetails).forEach(([uid, m]) => {
        if (uid !== user?.uid) base.push({ value: uid, label: m.name?.split(" ")[0] || m.email });
      });
    }
    return base;
  }, [activeGroup, user]);

  const handleSelectGroup = (g) => { setActiveGroup(g); setFilter("all"); setMobileTab("calendar"); };

  useMemo(() => {
    if (activeGroup) {
      const updated = groups.find((g) => g.id === activeGroup.id);
      if (updated) setActiveGroup(updated);
    }
  }, [groups]);

  const CATEGORY_EMOJI = { cita: "✂️", reunion: "🤝", personal: "👤", otro: "📌" };

  const renderUpcoming = () => (
    <div className="upcoming-section">
      {!activeGroup ? (
        <div className="mobile-empty">
          <div>📅</div>
          <p>Selecciona un grupo primero</p>
          <button className="mobile-go-btn" onClick={() => setMobileTab("groups")}>Ir a Grupos →</button>
        </div>
      ) : upcoming.length === 0 ? (
        <div className="mobile-empty">
          <div>📭</div>
          <p>No hay próximas citas</p>
          <button className="mobile-go-btn" onClick={() => setModalState({ date: format(new Date(), "yyyy-MM-dd") })}>+ Nueva cita</button>
        </div>
      ) : upcoming.map((a) => (
        <div key={a.id} className="upcoming-card"
          style={{ borderLeft: `4px solid ${memberColors[a.createdBy] || "#4ade80"}` }}
          onClick={() => handleAppointmentClick(a)}>
          <div className="uc-top">
            <span>{CATEGORY_EMOJI[a.category] || "📌"}</span>
            <span className="uc-title">{a.title}</span>
            <span className="uc-who" style={{ color: memberColors[a.createdBy] || "#4ade80" }}>
              {a.createdBy === user?.uid ? "Yo" : a.createdByName?.split(" ")[0] || "Compañero"}
            </span>
          </div>
          <div className="uc-meta">
            {a.clientName && <span>👤 {a.clientName}</span>}
            <span>📅 {a.date && (() => { try { return format(parseISO(a.date), "d MMM", { locale: es }); } catch { return a.date; } })()}</span>
            {a.time && <span>🕐 {a.time}</span>}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className={`dashboard theme-${theme}`}>
      <header className="topbar">
        <div className="topbar-left">
          <div className="logo">
            <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="12" fill="#bbf7d0"/>
              <path d="M14 24h6m0 0v-6m0 6v6m0-6h14" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="34" cy="18" r="4" fill="#4ade80"/>
              <circle cx="34" cy="30" r="4" fill="#86efac"/>
            </svg>
            <span className="logo-text">Agenda Equipo</span>
          </div>
        </div>
        <div className="topbar-center">
          {activeGroup && <div className="group-badge"><CalIcon size={14} /><span>{activeGroup.name}</span></div>}
        </div>
        <div className="topbar-right">
          {user?.photo && <img src={user.photo} alt={user.name} className="user-avatar" title={user.name} />}
          <span className="user-name">{user?.name?.split(" ")[0]}</span>
          <button className="icon-action-btn" onClick={() => setShowSettings(true)} title="Ajustes"><Settings size={17} /></button>
          <button className="icon-action-btn logout" onClick={logout} title="Cerrar sesión"><LogOut size={17} /></button>
        </div>
      </header>

      <div className="main-layout">
        {/* Desktop sidebar */}
        <aside className="sidebar">
          <GroupPanel
            groups={groups}
            activeGroup={activeGroup}
            onSelectGroup={handleSelectGroup}
            onCreateGroup={createGroup}
            onJoinGroup={joinGroup}
            onLeaveGroup={leaveGroup}
          />
          {activeGroup && upcoming.length > 0 && (
            <div className="upcoming">
              <div className="upcoming-title">Próximas citas</div>
              {upcoming.slice(0, 6).map((a) => (
                <div key={a.id} className="upcoming-item"
                  style={{ borderLeft: `3px solid ${memberColors[a.createdBy] || "#4ade80"}` }}
                  onClick={() => handleAppointmentClick(a)}>
                  <span className="up-emoji">{CATEGORY_EMOJI[a.category] || "📌"}</span>
                  <div className="up-info">
                    <div className="up-title">{a.title}</div>
                    <div className="up-meta">
                      {a.clientName && <span className="up-client">👤 {a.clientName}</span>}
                      <span className="up-date">
                        {a.date && (() => { try { return format(parseISO(a.date), "d MMM", { locale: es }); } catch { return a.date; } })()}
                        {a.time && ` · ${a.time}`}
                      </span>
                    </div>
                    <div className="up-who" style={{ color: memberColors[a.createdBy] || "#4ade80" }}>
                      {a.createdBy === user?.uid ? "Yo" : a.createdByName?.split(" ")[0] || "Compañero"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* Main content */}
        <main className="content">
          {/* Mobile tabs content */}
          <div className="mobile-only">
            {mobileTab === "groups" && (
              <div className="mobile-panel">
                <GroupPanel
                  groups={groups}
                  activeGroup={activeGroup}
                  onSelectGroup={handleSelectGroup}
                  onCreateGroup={createGroup}
                  onJoinGroup={joinGroup}
                  onLeaveGroup={leaveGroup}
                  isMobile
                />
              </div>
            )}
            {mobileTab === "upcoming" && renderUpcoming()}
            {mobileTab === "settings" && (
              <div className="mobile-panel">
                <SettingsModal inline onClose={() => setMobileTab("calendar")} />
              </div>
            )}
          </div>

          {/* Calendar — shown on desktop always, on mobile only when calendar tab active */}
          <div className={`cal-area ${mobileTab !== "calendar" ? "mobile-hidden" : ""}`}>
            {!activeGroup ? (
              <div className="empty-state">
                <div className="empty-icon">📅</div>
                <h2>Selecciona un grupo</h2>
                <p>Elige un grupo para ver y añadir citas.</p>
                <button className="empty-cta" onClick={() => setMobileTab("groups")}>Ver mis grupos →</button>
              </div>
            ) : (
              <>
                <div className="filter-bar">
                  <div className="filter-label"><Filter size={14} /> Filtrar:</div>
                  <div className="filter-chips">
                    {filterOptions.map((opt) => (
                      <button key={opt.value}
                        className={`filter-chip ${filter === opt.value ? "active" : ""}`}
                        onClick={() => setFilter(opt.value)}
                        style={filter === opt.value && memberColors[opt.value]
                          ? { background: memberColors[opt.value] + "22", borderColor: memberColors[opt.value] } : {}}>
                        {opt.value !== "all" && opt.value !== "mine" && (
                          <span className="chip-dot" style={{ background: memberColors[opt.value] || "#4ade80" }} />
                        )}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <button className="new-btn desktop-only" onClick={() => setModalState({ date: format(new Date(), "yyyy-MM-dd") })}>
                    + Nueva cita
                  </button>
                </div>
                {loading ? (
                  <div className="loading">Cargando citas...</div>
                ) : (
                  <div className="cal-wrapper">
                    <Calendar appointments={appointments} onDayClick={handleDayClick}
                      onAppointmentClick={handleAppointmentClick} memberColors={memberColors} currentUserId={user?.uid} />
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* FAB */}
      {activeGroup && mobileTab === "calendar" && (
        <button className="fab" onClick={() => setModalState({ date: format(new Date(), "yyyy-MM-dd") })}>
          <Plus size={24} />
        </button>
      )}

      {/* Mobile nav */}
      <MobileNav activeTab={mobileTab} onTabChange={setMobileTab} />

      {/* Modals */}
      {dayView && (
        <DayView date={dayView} appointments={appointments} onClose={() => setDayView(null)}
          onAdd={(date) => setModalState({ date })} onAppointmentClick={handleAppointmentClick}
          memberColors={memberColors} currentUserId={user?.uid} />
      )}
      {modalState && (
        <AppointmentModal date={modalState.date} appointment={modalState.appointment}
          readOnly={modalState.readOnly} onSave={handleSave} onClose={() => setModalState(null)} onDelete={handleDelete} />
      )}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── THEME VARIABLES ── */
        .dashboard {
          --accent: #16a34a;
          --accent-dark: #15803d;
          --accent-light: #f0fdf4;
          --accent-light2: #bbf7d0;
          --accent-border: #bbf7d0;
          --bg: #f9fafb;
          --bg-card: #ffffff;
          --bg-hover: #f0fdf4;
          --bg-input: #ffffff;
          --border: #dcfce7;
          --text-primary: #1f2937;
          --text-secondary: #374151;
          --text-muted: #6b7280;
        }
        .dashboard.theme-dark {
          --accent: #4ade80;
          --accent-dark: #22c55e;
          --accent-light: #14532d22;
          --accent-light2: #14532d44;
          --accent-border: #166534;
          --bg: #0f1117;
          --bg-card: #1a1f2e;
          --bg-hover: #1f2937;
          --bg-input: #111827;
          --border: #1f2937;
          --text-primary: #f9fafb;
          --text-secondary: #d1d5db;
          --text-muted: #6b7280;
        }

        .dashboard {
          display: flex; flex-direction: column; height: 100vh;
          background: var(--bg); font-family: 'DM Sans', sans-serif; overflow: hidden;
        }

        .topbar {
          display: flex; align-items: center; padding: 0 24px; height: 58px;
          background: var(--bg-card); border-bottom: 1.5px solid var(--border);
          flex-shrink: 0; gap: 16px; box-shadow: 0 1px 8px rgba(0,0,0,0.06);
          z-index: 50;
        }
        .topbar-left, .topbar-right { display: flex; align-items: center; gap: 10px; min-width: 160px; }
        .topbar-right { justify-content: flex-end; }
        .topbar-center { flex: 1; display: flex; justify-content: center; }
        .logo { display: flex; align-items: center; gap: 10px; }
        .logo-text { font-family: 'DM Serif Display', serif; font-size: 1.2rem; color: var(--text-primary); }
        .group-badge { display: flex; align-items: center; gap: 6px; background: var(--accent-light); border: 1.5px solid var(--accent-border); padding: 5px 14px; border-radius: 100px; font-size: 0.88rem; font-weight: 500; color: var(--accent); }
        .user-avatar { width: 30px; height: 30px; border-radius: 50%; object-fit: cover; }
        .user-name { font-size: 0.88rem; font-weight: 500; color: var(--text-secondary); }
        .icon-action-btn { background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 6px; border-radius: 8px; display: flex; transition: all 0.15s; }
        .icon-action-btn:hover { color: var(--accent); background: var(--accent-light); }
        .icon-action-btn.logout:hover { color: #ef4444; background: #fef2f2; }

        .main-layout { display: flex; flex: 1; overflow: hidden; }

        .sidebar { width: 260px; flex-shrink: 0; background: var(--bg-card); border-right: 1.5px solid var(--border); padding: 20px 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; }

        .upcoming { border-top: 1.5px solid var(--border); padding-top: 16px; }
        .upcoming-title { font-size: 0.78rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
        .upcoming-item { display: flex; align-items: flex-start; gap: 8px; padding: 8px; border-radius: 8px; cursor: pointer; transition: background 0.15s; margin-bottom: 4px; background: var(--bg-hover); }
        .upcoming-item:hover { filter: brightness(0.97); }
        .up-emoji { font-size: 1rem; margin-top: 1px; }
        .up-info { flex: 1; min-width: 0; }
        .up-title { font-size: 0.83rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .up-meta { display: flex; flex-direction: column; gap: 1px; }
        .up-client { font-size: 0.75rem; color: var(--text-secondary); }
        .up-date { font-size: 0.75rem; color: var(--text-muted); }
        .up-who { font-size: 0.72rem; font-weight: 600; margin-top: 2px; }

        .content { flex: 1; overflow: hidden; display: flex; flex-direction: column; position: relative; }

        .cal-area { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
        .cal-wrapper { flex: 1; padding: 20px 24px; overflow-y: auto; }

        .filter-bar { display: flex; align-items: center; gap: 10px; padding: 12px 24px; background: var(--bg-card); border-bottom: 1.5px solid var(--border); flex-shrink: 0; flex-wrap: wrap; }
        .filter-label { display: flex; align-items: center; gap: 5px; font-size: 0.8rem; color: var(--text-muted); font-weight: 500; white-space: nowrap; }
        .filter-chips { display: flex; gap: 6px; flex-wrap: wrap; flex: 1; }
        .filter-chip { display: flex; align-items: center; gap: 5px; padding: 5px 12px; border-radius: 100px; border: 1.5px solid var(--border); background: var(--bg-hover); font-size: 0.82rem; cursor: pointer; color: var(--text-secondary); transition: all 0.15s; font-family: 'DM Sans', sans-serif; font-weight: 500; }
        .filter-chip:hover { border-color: var(--accent); }
        .filter-chip.active { border-color: var(--accent); background: var(--accent-light); color: var(--accent); }
        .chip-dot { width: 7px; height: 7px; border-radius: 50%; }
        .new-btn { background: var(--accent); color: white; border: none; border-radius: 100px; padding: 7px 16px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.15s; white-space: nowrap; font-family: 'DM Sans', sans-serif; margin-left: auto; }
        .new-btn:hover { background: var(--accent-dark); transform: translateY(-1px); }

        .empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: var(--text-muted); padding: 40px; }
        .empty-icon { font-size: 3rem; }
        .empty-state h2 { font-family: 'DM Serif Display', serif; color: var(--text-secondary); font-size: 1.4rem; }
        .empty-state p { text-align: center; max-width: 300px; line-height: 1.6; font-size: 0.9rem; }
        .empty-cta { background: var(--accent-light); color: var(--accent); border: 1.5px solid var(--accent-border); border-radius: 10px; padding: 10px 20px; font-size: 0.9rem; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; }

        .loading { flex: 1; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 0.9rem; }

        .fab { display: none; position: fixed; bottom: 80px; right: 20px; width: 56px; height: 56px; border-radius: 50%; background: var(--accent); color: white; border: none; cursor: pointer; box-shadow: 0 4px 20px rgba(22,163,74,0.4); align-items: center; justify-content: center; transition: all 0.2s; z-index: 100; }
        .fab:hover { background: var(--accent-dark); transform: scale(1.05); }

        /* Mobile-specific */
        .mobile-only { display: none; }
        .mobile-panel { padding: 16px; overflow-y: auto; flex: 1; }
        .upcoming-section { padding: 16px; display: flex; flex-direction: column; gap: 10px; overflow-y: auto; flex: 1; padding-bottom: 80px; }
        .upcoming-card { background: var(--bg-card); border-radius: 12px; padding: 14px; cursor: pointer; transition: all 0.15s; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
        .upcoming-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .uc-top { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
        .uc-title { font-weight: 600; color: var(--text-primary); flex: 1; font-size: 0.95rem; }
        .uc-who { font-size: 0.78rem; font-weight: 600; }
        .uc-meta { display: flex; gap: 12px; font-size: 0.8rem; color: var(--text-muted); flex-wrap: wrap; }
        .mobile-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 60px 20px; color: var(--text-muted); text-align: center; flex: 1; }
        .mobile-empty div { font-size: 2.5rem; }
        .mobile-go-btn { background: var(--accent-light); color: var(--accent); border: 1.5px solid var(--accent-border); border-radius: 10px; padding: 10px 20px; font-size: 0.9rem; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; }

        @media (max-width: 768px) {
          .sidebar { display: none; }
          .desktop-only { display: none; }
          .mobile-only { display: flex; flex-direction: column; }
          .mobile-hidden { display: none !important; }
          .fab { display: flex; }
          .topbar { padding: 0 16px; }
          .logo-text { font-size: 1rem; }
          .user-name { display: none; }
          .filter-bar { padding: 10px 16px; }
          .cal-wrapper { padding: 10px 12px; padding-bottom: 80px; }
          .cal-area { display: flex; flex-direction: column; }
        }
      `}</style>
    </div>
  );
}
