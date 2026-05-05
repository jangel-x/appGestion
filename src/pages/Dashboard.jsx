import { useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useGroups, useAppointments } from "../hooks/useFirestore";
import Calendar from "../components/Calendar";
import GroupPanel from "../components/GroupPanel";
import AppointmentModal from "../components/AppointmentModal";
import DayView from "../components/DayView";
import { LogOut, Filter, Calendar as CalIcon, Plus } from "lucide-react";
import { format, parseISO, isAfter, startOfDay } from "date-fns";
import { es } from "date-fns/locale";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { groups, createGroup, joinGroup, leaveGroup } = useGroups();

  const [activeGroup, setActiveGroup] = useState(null);
  const [filter, setFilter] = useState("all");
  const [modalState, setModalState] = useState(null);
  const [dayView, setDayView] = useState(null); // date string

  const { appointments, loading, addAppointment, updateAppointment, deleteAppointment } =
    useAppointments(activeGroup?.id, filter);

  const memberColors = useMemo(() => {
    if (!activeGroup?.memberDetails) return {};
    const map = {};
    Object.entries(activeGroup.memberDetails).forEach(([uid, m]) => { map[uid] = m.color || "#4ade80"; });
    return map;
  }, [activeGroup]);

  // Check if current user can edit an appointment
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
      .slice(0, 6);
  }, [appointments]);

  // When clicking a day: if it has appointments, show DayView, else open new appointment modal
  const handleDayClick = (date) => {
    const dayApps = appointments.filter((a) => a.date === date);
    if (dayApps.length > 0) {
      setDayView(date);
    } else {
      setModalState({ date });
    }
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

  const CATEGORY_EMOJI = { cita: "✂️", reunion: "🤝", personal: "👤", otro: "📌" };

  // Sync activeGroup with latest group data (for leaders updates)
  const handleSelectGroup = (g) => {
    setActiveGroup(g);
    setFilter("all");
  };

  // Keep activeGroup in sync when groups update
  useMemo(() => {
    if (activeGroup) {
      const updated = groups.find((g) => g.id === activeGroup.id);
      if (updated) setActiveGroup(updated);
    }
  }, [groups]);

  return (
    <div className="dashboard">
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
          {activeGroup && (
            <div className="group-badge"><CalIcon size={14} /><span>{activeGroup.name}</span></div>
          )}
        </div>
        <div className="topbar-right">
          {user?.photo && <img src={user.photo} alt={user.name} className="user-avatar" title={user.name} />}
          <span className="user-name">{user?.name?.split(" ")[0]}</span>
          <button className="logout-btn" onClick={logout} title="Cerrar sesión"><LogOut size={16} /></button>
        </div>
      </header>

      <div className="main-layout">
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
              {upcoming.map((a) => (
                <div
                  key={a.id}
                  className="upcoming-item"
                  style={{ borderLeft: `3px solid ${memberColors[a.createdBy] || "#4ade80"}` }}
                  onClick={() => handleAppointmentClick(a)}
                >
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

        <main className="content">
          {!activeGroup ? (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <h2>Selecciona un grupo</h2>
              <p>Elige un grupo en el panel izquierdo o crea uno nuevo para empezar a añadir citas.</p>
            </div>
          ) : (
            <>
              <div className="filter-bar">
                <div className="filter-label"><Filter size={14} /> Filtrar:</div>
                <div className="filter-chips">
                  {filterOptions.map((opt) => (
                    <button
                      key={opt.value}
                      className={`filter-chip ${filter === opt.value ? "active" : ""}`}
                      onClick={() => setFilter(opt.value)}
                      style={filter === opt.value && memberColors[opt.value]
                        ? { background: memberColors[opt.value] + "22", borderColor: memberColors[opt.value] }
                        : {}}
                    >
                      {opt.value !== "all" && opt.value !== "mine" && (
                        <span className="chip-dot" style={{ background: memberColors[opt.value] || "#4ade80" }} />
                      )}
                      {opt.label}
                    </button>
                  ))}
                </div>
                <button className="new-btn" onClick={() => setModalState({ date: format(new Date(), "yyyy-MM-dd") })}>
                  + Nueva cita
                </button>
              </div>

              {loading ? (
                <div className="loading">Cargando citas...</div>
              ) : (
                <div className="cal-wrapper">
                  <Calendar
                    appointments={appointments}
                    onDayClick={handleDayClick}
                    onAppointmentClick={handleAppointmentClick}
                    memberColors={memberColors}
                    currentUserId={user?.uid}
                  />
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* FAB for mobile */}
      {activeGroup && (
        <button className="fab" onClick={() => setModalState({ date: format(new Date(), "yyyy-MM-dd") })}>
          <Plus size={24} />
        </button>
      )}

      {/* Day view modal */}
      {dayView && (
        <DayView
          date={dayView}
          appointments={appointments}
          onClose={() => setDayView(null)}
          onAdd={(date) => setModalState({ date })}
          onAppointmentClick={handleAppointmentClick}
          memberColors={memberColors}
          currentUserId={user?.uid}
        />
      )}

      {/* Appointment modal */}
      {modalState && (
        <AppointmentModal
          date={modalState.date}
          appointment={modalState.appointment}
          readOnly={modalState.readOnly}
          onSave={handleSave}
          onClose={() => setModalState(null)}
          onDelete={handleDelete}
        />
      )}

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .dashboard { display: flex; flex-direction: column; height: 100vh; background: #f9fafb; font-family: 'DM Sans', sans-serif; overflow: hidden; }

        .topbar { display: flex; align-items: center; padding: 0 24px; height: 58px; background: white; border-bottom: 1.5px solid #dcfce7; flex-shrink: 0; gap: 16px; box-shadow: 0 1px 8px rgba(0,0,0,0.04); }
        .topbar-left, .topbar-right { display: flex; align-items: center; gap: 12px; min-width: 180px; }
        .topbar-right { justify-content: flex-end; }
        .topbar-center { flex: 1; display: flex; justify-content: center; }
        .logo { display: flex; align-items: center; gap: 10px; }
        .logo-text { font-family: 'DM Serif Display', serif; font-size: 1.2rem; color: #14532d; }
        .group-badge { display: flex; align-items: center; gap: 6px; background: #f0fdf4; border: 1.5px solid #bbf7d0; padding: 5px 14px; border-radius: 100px; font-size: 0.88rem; font-weight: 500; color: #166534; }
        .user-avatar { width: 30px; height: 30px; border-radius: 50%; object-fit: cover; }
        .user-name { font-size: 0.88rem; font-weight: 500; color: #374151; }
        .logout-btn { background: none; border: none; cursor: pointer; color: #9ca3af; padding: 6px; border-radius: 8px; display: flex; transition: all 0.15s; }
        .logout-btn:hover { color: #ef4444; background: #fef2f2; }

        .main-layout { display: flex; flex: 1; overflow: hidden; }

        .sidebar { width: 260px; flex-shrink: 0; background: white; border-right: 1.5px solid #dcfce7; padding: 20px 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; }

        .upcoming { border-top: 1.5px solid #f0fdf4; padding-top: 16px; }
        .upcoming-title { font-size: 0.78rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
        .upcoming-item { display: flex; align-items: flex-start; gap: 8px; padding: 8px; border-radius: 8px; cursor: pointer; transition: background 0.15s; margin-bottom: 4px; background: #fafafa; }
        .upcoming-item:hover { background: #f0fdf4; }
        .up-emoji { font-size: 1rem; margin-top: 1px; }
        .up-info { flex: 1; min-width: 0; }
        .up-title { font-size: 0.83rem; font-weight: 600; color: #1f2937; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .up-meta { display: flex; flex-direction: column; gap: 1px; }
        .up-client { font-size: 0.75rem; color: #4b5563; }
        .up-date { font-size: 0.75rem; color: #9ca3af; }
        .up-who { font-size: 0.72rem; font-weight: 600; margin-top: 2px; }

        .content { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
        .cal-wrapper { flex: 1; padding: 20px 24px; overflow-y: auto; }

        .filter-bar { display: flex; align-items: center; gap: 10px; padding: 12px 24px; background: white; border-bottom: 1.5px solid #dcfce7; flex-shrink: 0; flex-wrap: wrap; }
        .filter-label { display: flex; align-items: center; gap: 5px; font-size: 0.8rem; color: #6b7280; font-weight: 500; white-space: nowrap; }
        .filter-chips { display: flex; gap: 6px; flex-wrap: wrap; flex: 1; }
        .filter-chip { display: flex; align-items: center; gap: 5px; padding: 5px 12px; border-radius: 100px; border: 1.5px solid #e5e7eb; background: #f9fafb; font-size: 0.82rem; cursor: pointer; color: #4b5563; transition: all 0.15s; font-family: 'DM Sans', sans-serif; font-weight: 500; }
        .filter-chip:hover { border-color: #4ade80; background: #f0fdf4; }
        .filter-chip.active { border-color: #4ade80; background: #dcfce7; color: #166534; }
        .chip-dot { width: 7px; height: 7px; border-radius: 50%; }
        .new-btn { background: #16a34a; color: white; border: none; border-radius: 100px; padding: 7px 16px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.15s; white-space: nowrap; font-family: 'DM Sans', sans-serif; margin-left: auto; }
        .new-btn:hover { background: #15803d; transform: translateY(-1px); }

        .empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: #9ca3af; padding: 40px; }
        .empty-icon { font-size: 3rem; }
        .empty-state h2 { font-family: 'DM Serif Display', serif; color: #6b7280; font-size: 1.4rem; }
        .empty-state p { text-align: center; max-width: 300px; line-height: 1.6; font-size: 0.9rem; }
        .loading { flex: 1; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 0.9rem; }

        /* FAB - floating action button for mobile */
        .fab {
          display: none;
          position: fixed; bottom: 24px; right: 24px;
          width: 56px; height: 56px; border-radius: 50%;
          background: #16a34a; color: white;
          border: none; cursor: pointer;
          box-shadow: 0 4px 20px rgba(22,163,74,0.4);
          align-items: center; justify-content: center;
          transition: all 0.2s; z-index: 100;
        }
        .fab:hover { background: #15803d; transform: scale(1.05); }

        @media (max-width: 768px) {
          .sidebar { display: none; }
          .new-btn { display: none; }
          .fab { display: flex; }
          .topbar { padding: 0 16px; }
          .topbar-left .logo-text { display: none; }
          .topbar-right .user-name { display: none; }
          .filter-bar { padding: 10px 16px; }
          .cal-wrapper { padding: 12px; }
        }
      `}</style>
    </div>
  );
}
