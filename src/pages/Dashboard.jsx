import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useGroups, useAppointments } from "../hooks/useFirestore";
import Calendar from "../components/Calendar";
import GroupPanel from "../components/GroupPanel";
import AppointmentModal from "../components/AppointmentModal";
import DayView from "../components/DayView";
import SettingsModal from "../components/SettingsModal";
import MobileNav from "../components/MobileNav";
import { LogOut, Filter, Calendar as CalIcon, Plus, Users, Search, X } from "lucide-react";
import { format, parseISO, isAfter, startOfDay, isBefore, endOfDay } from "date-fns";
import { es } from "date-fns/locale";

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, type = "success", onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  return <div className={`toast toast-${type}`}>{message}</div>;
}

// ── MobileTab (con animación de deslizamiento) ────────────────────────────────
function MobileTab({ id, activeTab, children }) {
  const isActive = activeTab === id;
  return (
    <div
      className="mob-tab-panel"
      style={{
        opacity: isActive ? 1 : 0,
        transform: isActive ? "translateX(0)" : "translateX(12px)",
        pointerEvents: isActive ? "auto" : "none",
        position: isActive ? "relative" : "absolute",
        inset: isActive ? "auto" : 0,
        transition: "opacity 0.22s ease, transform 0.22s ease",
        display: "flex",
        flexDirection: "column",
        flex: isActive ? 1 : undefined,
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const { groups, createGroup, joinGroup, leaveGroup, deleteGroup, propagateNameUpdate } = useGroups();

  const [activeGroup, setActiveGroup] = useState(null);
  const [filter, setFilter] = useState("all");
  const [modalState, setModalState] = useState(null);
  const [dayView, setDayView] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [mobileTab, setMobileTab] = useState("calendar");
  const [toast, setToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type, key: Date.now() });
  }, []);

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

  // Búsqueda en tiempo real
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !activeGroup) return [];
    const q = searchQuery.toLowerCase();
    return appointments.filter((a) =>
      a.title?.toLowerCase().includes(q) ||
      a.clientName?.toLowerCase().includes(q) ||
      a.notes?.toLowerCase().includes(q) ||
      a.createdByName?.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [searchQuery, appointments, activeGroup]);

  const upcoming = useMemo(() => {
    const now = startOfDay(new Date());
    return appointments
      .filter((a) => { try { return !isAfter(now, parseISO(a.date)); } catch { return false; } })
      .slice(0, 20);
  }, [appointments]);

  // Agrupar próximas por fecha
  const upcomingGrouped = useMemo(() => {
    const groups = {};
    upcoming.forEach((a) => {
      const key = a.date;
      if (!groups[key]) groups[key] = [];
      groups[key].push(a);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [upcoming]);

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
      showToast("Cita actualizada ✓");
    } else {
      await addAppointment(activeGroup.id, formData);
      showToast("Cita añadida ✓");
    }
    setModalState(null);
  };

  const handleDelete = async () => {
    if (!activeGroup || !modalState?.appointment) return;
    await deleteAppointment(activeGroup.id, modalState.appointment.id);
    showToast("Cita eliminada", "info");
    setModalState(null);
  };

  const handleDeleteGroup = async (groupId) => {
    await deleteGroup(groupId);
    if (activeGroup?.id === groupId) setActiveGroup(null);
    showToast("Grupo eliminado", "info");
  };

  const handleLeaveGroup = async (groupId) => {
    await leaveGroup(groupId);
    if (activeGroup?.id === groupId) setActiveGroup(null);
    showToast("Has salido del grupo", "info");
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

  useEffect(() => {
    if (activeGroup) {
      const updated = groups.find((g) => g.id === activeGroup.id);
      if (updated) setActiveGroup(updated);
    }
  }, [groups]);

  useEffect(() => {
    if (showSearch && searchRef.current) searchRef.current.focus();
  }, [showSearch]);

  const formatDateHeader = (dateStr) => {
    try {
      const d = parseISO(dateStr);
      const today = startOfDay(new Date());
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
      if (format(d, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")) return "Hoy";
      if (format(d, "yyyy-MM-dd") === format(tomorrow, "yyyy-MM-dd")) return "Mañana";
      return format(d, "EEEE d 'de' MMMM", { locale: es });
    } catch { return dateStr; }
  };

  const renderUpcoming = () => (
    <div className="upcoming-section">
      {!activeGroup ? (
        <div className="mobile-empty">
          <div>📅</div>
          <p>Selecciona un grupo primero</p>
          <button className="mobile-go-btn" onClick={() => setMobileTab("groups")}>
            <Users size={16} /> Ver mis grupos
          </button>
        </div>
      ) : upcoming.length === 0 ? (
        <div className="mobile-empty">
          <div>🗓️</div>
          <p>No hay próximas citas</p>
          <button className="mobile-go-btn" onClick={() => setModalState({ date: format(new Date(), "yyyy-MM-dd") })}>
            + Nueva cita
          </button>
        </div>
      ) : upcomingGrouped.map(([dateStr, apps]) => (
        <div key={dateStr} className="upcoming-group">
          <div className="upcoming-date-header">
            <span className="udh-label">{formatDateHeader(dateStr)}</span>
            <span className="udh-full">{(() => { try { return format(parseISO(dateStr), "d MMM", { locale: es }); } catch { return ""; } })()}</span>
          </div>
          {apps.map((a) => (
            <div key={a.id} className="upcoming-card"
              style={{ borderLeft: `4px solid ${memberColors[a.createdBy] || "#4ade80"}` }}
              onClick={() => handleAppointmentClick(a)}>
              <div className="uc-top">
                <span className="uc-emoji">{{ cita: "✂️", reunion: "🤝", personal: "👤", otro: "📌" }[a.category] || "📌"}</span>
                <span className="uc-title">{a.title}</span>
                <span className="uc-who" style={{ color: memberColors[a.createdBy] || "#4ade80" }}>
                  {a.createdBy === user?.uid ? "Yo" : a.createdByName?.split(" ")[0] || "—"}
                </span>
              </div>
              <div className="uc-meta">
                {a.clientName && <span>👤 {a.clientName}</span>}
                {a.time && <span>🕐 {a.time}{a.duration ? ` · ${a.duration}min` : ""}</span>}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  const renderSearch = () => (
    <div className="search-results">
      {searchQuery.trim() === "" ? (
        <div className="search-hint">Escribe para buscar citas, clientes o notas...</div>
      ) : searchResults.length === 0 ? (
        <div className="search-hint">Sin resultados para «{searchQuery}»</div>
      ) : searchResults.map((a) => (
        <div key={a.id} className="upcoming-card"
          style={{ borderLeft: `4px solid ${memberColors[a.createdBy] || "#4ade80"}` }}
          onClick={() => { handleAppointmentClick(a); setShowSearch(false); }}>
          <div className="uc-top">
            <span className="uc-emoji">{{ cita: "✂️", reunion: "🤝", personal: "👤", otro: "📌" }[a.category] || "📌"}</span>
            <span className="uc-title">{a.title}</span>
            <span className="uc-who" style={{ color: memberColors[a.createdBy] || "#4ade80" }}>
              {a.createdBy === user?.uid ? "Yo" : a.createdByName?.split(" ")[0] || "—"}
            </span>
          </div>
          <div className="uc-meta">
            {a.clientName && <span>👤 {a.clientName}</span>}
            <span>📅 {(() => { try { return format(parseISO(a.date), "d MMM", { locale: es }); } catch { return a.date; } })()}</span>
            {a.time && <span>🕐 {a.time}</span>}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className={`dashboard theme-${theme}`}>

      {/* ── TOPBAR ── */}
      <header className="topbar">
        {showSearch ? (
          // Modo búsqueda — ocupa todo el topbar
          <div className="search-bar">
            <Search size={16} className="search-icon" />
            <input ref={searchRef} className="search-input" placeholder="Buscar citas, clientes..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setShowSearch(false)} />
            <button className="search-close" onClick={() => { setShowSearch(false); setSearchQuery(""); }}>
              <X size={16} />
            </button>
          </div>
        ) : (
          <>
            <div className="topbar-left">
              <div className="logo">
                <svg width="26" height="26" viewBox="0 0 48 48" fill="none">
                  <rect width="48" height="48" rx="12" fill="#bbf7d0"/>
                  <path d="M14 24h6m0 0v-6m0 6v6m0-6h14" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round"/>
                  <circle cx="34" cy="18" r="4" fill="#4ade80"/>
                  <circle cx="34" cy="30" r="4" fill="#86efac"/>
                </svg>
                <span className="logo-text">Naiana</span>
              </div>
            </div>
            <div className="topbar-center">
              {activeGroup && <div className="group-badge"><CalIcon size={13} /><span>{activeGroup.name}</span></div>}
            </div>
            <div className="topbar-right">
              {activeGroup && (
                <button className="icon-action-btn" onClick={() => setShowSearch(true)} title="Buscar">
                  <Search size={17} />
                </button>
              )}
              {user?.photo && <img src={user.photo} alt={user.name} className="user-avatar" title={user.name} />}
              <span className="user-name">{user?.name?.split(" ")[0]}</span>
              {/* Ajustes solo en desktop */}
              <button className="icon-action-btn desktop-only" onClick={() => setShowSettings(true)} title="Ajustes">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              </button>
              <button className="icon-action-btn logout" onClick={logout} title="Cerrar sesión">
                <LogOut size={17} />
              </button>
            </div>
          </>
        )}
      </header>

      {/* ── SEARCH OVERLAY (desktop) ── */}
      {showSearch && activeGroup && (
        <div className="search-overlay desktop-only" onClick={(e) => e.stopPropagation()}>
          {renderSearch()}
        </div>
      )}

      <div className="main-layout">
        {/* ── DESKTOP SIDEBAR ── */}
        <aside className="sidebar">
          <GroupPanel
            groups={groups}
            activeGroup={activeGroup}
            onSelectGroup={handleSelectGroup}
            onCreateGroup={createGroup}
            onJoinGroup={joinGroup}
            onLeaveGroup={handleLeaveGroup}
            onDeleteGroup={handleDeleteGroup}
            appointments={appointments}
          />
          {activeGroup && upcoming.length > 0 && (
            <div className="sidebar-upcoming">
              <div className="upcoming-title">Próximas citas</div>
              {upcoming.slice(0, 8).map((a) => (
                <div key={a.id} className="upcoming-item"
                  style={{ borderLeft: `3px solid ${memberColors[a.createdBy] || "#4ade80"}` }}
                  onClick={() => handleAppointmentClick(a)}>
                  <div className="up-info">
                    <div className="up-title">{a.title}</div>
                    <div className="up-date">
                      {a.date && (() => { try { return format(parseISO(a.date), "d MMM", { locale: es }); } catch { return a.date; } })()}
                      {a.time && ` · ${a.time}`}
                    </div>
                    {a.clientName && <div className="up-client">👤 {a.clientName}</div>}
                    <div className="up-who" style={{ color: memberColors[a.createdBy] || "#4ade80" }}>
                      {a.createdBy === user?.uid ? "Yo" : a.createdByName?.split(" ")[0] || "—"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="content">

          {/* ══ DESKTOP: siempre el calendario ══ */}
          <div className="desktop-cal-area">
            {/* Barra de búsqueda desktop inline si hay resultados */}
            {!activeGroup ? (
              <div className="empty-state">
                <div className="empty-icon">📅</div>
                <h2>Selecciona un grupo</h2>
                <p>Elige un grupo en el panel lateral para ver y añadir citas.</p>
              </div>
            ) : (
              <>
                <div className="filter-bar">
                  <div className="filter-label"><Filter size={13} /> Filtrar:</div>
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
                  <button className="new-btn" onClick={() => setModalState({ date: format(new Date(), "yyyy-MM-dd") })}>
                    + Nueva cita
                  </button>
                </div>
                {loading ? (
                  <div className="loading"><div className="spinner" />Cargando...</div>
                ) : (
                  <div className="cal-wrapper">
                    <Calendar appointments={appointments} onDayClick={handleDayClick}
                      onAppointmentClick={handleAppointmentClick} memberColors={memberColors} currentUserId={user?.uid} />
                  </div>
                )}
              </>
            )}
          </div>

          {/* ══ MÓVIL: tabs con transición ══ */}
          <div className="mobile-tabs-container">

            <MobileTab id="calendar" activeTab={mobileTab}>
              {!activeGroup ? (
                <div className="empty-state">
                  <div className="empty-icon">📅</div>
                  <h2>Selecciona un grupo</h2>
                  <p>Elige un grupo para ver y añadir citas.</p>
                  <button className="empty-cta" onClick={() => setMobileTab("groups")}>
                    <Users size={16} /> Ver mis grupos
                  </button>
                </div>
              ) : (
                <div className="mobile-cal-inner">
                  <div className="filter-bar">
                    <div className="filter-chips" style={{ flex: 1 }}>
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
                  </div>
                  {loading ? (
                    <div className="loading"><div className="spinner" />Cargando...</div>
                  ) : (
                    <div className="cal-wrapper">
                      <Calendar appointments={appointments} onDayClick={handleDayClick}
                        onAppointmentClick={handleAppointmentClick} memberColors={memberColors} currentUserId={user?.uid} />
                    </div>
                  )}
                </div>
              )}
            </MobileTab>

            <MobileTab id="groups" activeTab={mobileTab}>
              <div className="mobile-panel">
                <GroupPanel
                  groups={groups}
                  activeGroup={activeGroup}
                  onSelectGroup={handleSelectGroup}
                  onCreateGroup={createGroup}
                  onJoinGroup={joinGroup}
                  onLeaveGroup={handleLeaveGroup}
                  onDeleteGroup={handleDeleteGroup}
                  appointments={appointments}
                  isMobile
                />
              </div>
            </MobileTab>

            <MobileTab id="upcoming" activeTab={mobileTab}>
              {showSearch ? renderSearch() : renderUpcoming()}
            </MobileTab>

            <MobileTab id="settings" activeTab={mobileTab}>
              <div className="mobile-panel">
                <SettingsModal inline onClose={() => setMobileTab("calendar")} propagateName={propagateNameUpdate} />
              </div>
            </MobileTab>

          </div>

        </main>
      </div>

      {/* FAB */}
      {activeGroup && mobileTab === "calendar" && (
        <button className="fab" onClick={() => setModalState({ date: format(new Date(), "yyyy-MM-dd") })}>
          <Plus size={22} />
        </button>
      )}

      <MobileNav activeTab={mobileTab} onTabChange={(tab) => { setMobileTab(tab); setShowSearch(false); }} />

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
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} propagateName={propagateNameUpdate} />}

      {toast && <Toast key={toast.key} message={toast.message} type={toast.type} onDone={() => setToast(null)} />}

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

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
          --nav-h: 60px;
          --topbar-h: 54px;
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
          display: flex; flex-direction: column;
          height: 100dvh; background: var(--bg);
          font-family: 'DM Sans', sans-serif; overflow: hidden;
        }

        /* ── TOPBAR ── */
        .topbar {
          display: flex; align-items: center; padding: 0 20px;
          height: var(--topbar-h); background: var(--bg-card);
          border-bottom: 1.5px solid var(--border); flex-shrink: 0;
          gap: 10px; box-shadow: 0 1px 8px rgba(0,0,0,0.05); z-index: 50;
        }
        .topbar-left { display: flex; align-items: center; flex-shrink: 0; }
        .topbar-center { flex: 1; display: flex; justify-content: center; min-width: 0; padding: 0 6px; overflow: hidden; }
        .topbar-right { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
        .logo { display: flex; align-items: center; gap: 8px; }
        .logo-text { font-family: 'DM Serif Display', serif; font-size: 1.1rem; color: var(--text-primary); white-space: nowrap; }
        .group-badge { display: flex; align-items: center; gap: 5px; background: var(--accent-light); border: 1.5px solid var(--accent-border); padding: 4px 11px; border-radius: 100px; font-size: 0.83rem; font-weight: 500; color: var(--accent); max-width: 170px; }
        .group-badge span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .user-avatar { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; }
        .user-name { font-size: 0.84rem; font-weight: 500; color: var(--text-secondary); white-space: nowrap; }
        .icon-action-btn { background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 6px; border-radius: 8px; display: flex; align-items: center; justify-content: center; transition: all 0.15s; flex-shrink: 0; }
        .icon-action-btn:hover { color: var(--accent); background: var(--accent-light); }
        .icon-action-btn.logout:hover { color: #ef4444; background: #fef2f2; }

        /* Búsqueda en topbar */
        .search-bar { display: flex; align-items: center; gap: 8px; flex: 1; background: var(--bg-hover); border-radius: 10px; padding: 0 12px; border: 1.5px solid var(--accent-border); }
        .search-icon { color: var(--text-muted); flex-shrink: 0; }
        .search-input { flex: 1; border: none; background: none; outline: none; font-family: 'DM Sans', sans-serif; font-size: 0.92rem; color: var(--text-primary); padding: 8px 0; }
        .search-input::placeholder { color: var(--text-muted); }
        .search-close { background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 4px; display: flex; border-radius: 6px; transition: all 0.15s; }
        .search-close:hover { color: var(--text-primary); background: var(--bg-hover); }

        /* Search overlay desktop */
        .search-overlay { position: fixed; top: var(--topbar-h); right: 20px; width: 360px; max-height: 65vh; background: var(--bg-card); border: 1.5px solid var(--border); border-radius: 14px; box-shadow: 0 16px 48px rgba(0,0,0,0.18); z-index: 200; overflow-y: auto; margin-top: 6px; animation: s-drop 0.18s ease; }
        .search-results { padding: 12px; display: flex; flex-direction: column; gap: 8px; }
        .search-hint { padding: 24px 20px; text-align: center; color: var(--text-muted); font-size: 0.88rem; line-height: 1.5; }
        @keyframes s-drop { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        .search-backdrop { position: fixed; inset: 0; z-index: 199; cursor: default; }

        /* ── LAYOUT ── */
        .main-layout { display: flex; flex: 1; overflow: hidden; min-height: 0; }
        .sidebar { width: 260px; flex-shrink: 0; background: var(--bg-card); border-right: 1.5px solid var(--border); padding: 18px 14px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; }
        .content { flex: 1; overflow: hidden; display: flex; flex-direction: column; min-width: 0; position: relative; }

        /* ── DESKTOP cal area ── */
        .desktop-cal-area { display: flex; flex-direction: column; flex: 1; overflow: hidden; min-height: 0; }
        .mobile-tabs-container { display: none; }

        /* ── SIDEBAR UPCOMING ── */
        .sidebar-upcoming { border-top: 1.5px solid var(--border); padding-top: 14px; }
        .upcoming-title { font-size: 0.73rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 8px; }
        .upcoming-item { padding: 8px; border-radius: 8px; cursor: pointer; transition: background 0.15s; margin-bottom: 4px; background: var(--bg-hover); padding-left: 10px; }
        .upcoming-item:hover { filter: brightness(0.97); }
        .up-info { }
        .up-title { font-size: 0.82rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .up-date { font-size: 0.72rem; color: var(--text-muted); margin-top: 1px; }
        .up-client { font-size: 0.72rem; color: var(--text-secondary); }
        .up-who { font-size: 0.7rem; font-weight: 600; margin-top: 2px; }

        /* ── FILTER BAR ── */
        .filter-bar { display: flex; align-items: center; gap: 7px; padding: 8px 18px; background: var(--bg-card); border-bottom: 1.5px solid var(--border); flex-shrink: 0; }
        .filter-label { display: flex; align-items: center; gap: 4px; font-size: 0.76rem; color: var(--text-muted); font-weight: 500; white-space: nowrap; }
        .filter-chips { display: flex; gap: 5px; overflow-x: auto; }
        .filter-chip { display: flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 100px; border: 1.5px solid var(--border); background: var(--bg-hover); font-size: 0.79rem; cursor: pointer; color: var(--text-secondary); transition: all 0.15s; font-family: 'DM Sans', sans-serif; font-weight: 500; white-space: nowrap; flex-shrink: 0; }
        .filter-chip:hover { border-color: var(--accent); }
        .filter-chip.active { border-color: var(--accent); background: var(--accent-light); color: var(--accent); }
        .chip-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .new-btn { background: var(--accent); color: white; border: none; border-radius: 100px; padding: 6px 14px; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.15s; white-space: nowrap; font-family: 'DM Sans', sans-serif; margin-left: auto; flex-shrink: 0; }
        .new-btn:hover { background: var(--accent-dark); }

        /* ── CAL WRAPPER ── */
        .cal-wrapper { flex: 1; padding: 16px 20px; overflow-y: auto; min-height: 0; }

        /* ── EMPTY STATE ── */
        .empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; color: var(--text-muted); padding: 32px 20px; text-align: center; }
        .empty-icon { font-size: 2.8rem; }
        .empty-state h2 { font-family: 'DM Serif Display', serif; color: var(--text-secondary); font-size: 1.35rem; }
        .empty-state p { max-width: 240px; line-height: 1.6; font-size: 0.87rem; }
        .empty-cta { display: flex; align-items: center; gap: 8px; background: var(--accent); color: white; border: none; border-radius: 12px; padding: 11px 22px; font-size: 0.92rem; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: background 0.15s; }
        .empty-cta:hover { background: var(--accent-dark); }

        /* ── LOADING ── */
        .loading { flex: 1; display: flex; align-items: center; justify-content: center; gap: 10px; color: var(--text-muted); font-size: 0.88rem; }
        .spinner { width: 18px; height: 18px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── FAB ── */
        .fab { display: none; position: fixed; bottom: calc(var(--nav-h) + 14px); right: 16px; width: 50px; height: 50px; border-radius: 50%; background: var(--accent); color: white; border: none; cursor: pointer; box-shadow: 0 4px 18px rgba(22,163,74,0.4); align-items: center; justify-content: center; transition: all 0.2s; z-index: 100; }
        .fab:active { transform: scale(0.94); }

        /* ── TOAST ── */
        .toast { position: fixed; bottom: calc(var(--nav-h) + 10px); left: 50%; transform: translateX(-50%); padding: 9px 20px; border-radius: 100px; font-size: 0.85rem; font-weight: 600; z-index: 9999; animation: toast-in 0.2s ease, toast-out 0.3s ease 2.7s forwards; white-space: nowrap; box-shadow: 0 4px 18px rgba(0,0,0,0.15); font-family: 'DM Sans', sans-serif; pointer-events: none; }
        .toast-success { background: #16a34a; color: white; }
        .toast-info { background: #374151; color: #f9fafb; }
        .toast-error { background: #ef4444; color: white; }
        @keyframes toast-in { from{opacity:0;transform:translateX(-50%) translateY(8px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes toast-out { from{opacity:1} to{opacity:0} }

        /* ── MOBILE PANELS ── */
        .mobile-panel { padding: 14px; overflow-y: auto; flex: 1; min-height: 0; padding-bottom: calc(var(--nav-h) + 10px); display: flex; flex-direction: column; }
        .mob-tab-panel { width: 100%; }

        /* Próximas agrupadas */
        .upcoming-section { padding: 10px 12px; display: flex; flex-direction: column; gap: 6px; overflow-y: auto; flex: 1; min-height: 0; padding-bottom: calc(var(--nav-h) + 10px); }
        .upcoming-group { display: flex; flex-direction: column; gap: 5px; }
        .upcoming-date-header { display: flex; align-items: baseline; gap: 8px; padding: 8px 0 4px; }
        .udh-label { font-family: 'DM Serif Display', serif; font-size: 1rem; color: var(--text-primary); text-transform: capitalize; }
        .udh-full { font-size: 0.75rem; color: var(--text-muted); }
        .upcoming-card { background: var(--bg-card); border-radius: 11px; padding: 11px 13px; cursor: pointer; transition: opacity 0.15s; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
        .upcoming-card:active { opacity: 0.8; }
        .uc-top { display: flex; align-items: center; gap: 7px; margin-bottom: 4px; }
        .uc-emoji { font-size: 0.9rem; flex-shrink: 0; }
        .uc-title { font-weight: 600; color: var(--text-primary); flex: 1; font-size: 0.92rem; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .uc-who { font-size: 0.74rem; font-weight: 600; flex-shrink: 0; }
        .uc-meta { display: flex; gap: 10px; font-size: 0.77rem; color: var(--text-muted); flex-wrap: wrap; }

        .mobile-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 48px 24px; color: var(--text-muted); text-align: center; flex: 1; }
        .mobile-empty div { font-size: 2.4rem; }
        .mobile-empty p { font-size: 0.9rem; line-height: 1.5; }
        .mobile-go-btn { display: flex; align-items: center; gap: 8px; background: var(--accent); color: white; border: none; border-radius: 12px; padding: 11px 22px; font-size: 0.92rem; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; }

        /* ── MOBILE CALENDAR INNER ── */
        .mobile-cal-inner { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }
        .mobile-cal-inner .filter-bar { padding: 6px 10px; }
        .mobile-cal-inner .cal-wrapper { padding: 8px 8px; padding-bottom: calc(var(--nav-h) + 56px); }

        /* ── MEDIA QUERY ── */
        @media (max-width: 768px) {
          .sidebar { display: none; }
          .desktop-only { display: none !important; }
          .desktop-cal-area { display: none; }

          .mobile-tabs-container {
            display: flex;
            flex-direction: column;
            flex: 1;
            overflow: hidden;
            min-height: 0;
            position: relative;
          }

          .fab { display: flex; }

          .topbar { padding: 0 10px; height: 48px; }
          .logo svg { width: 22px; height: 22px; }
          .logo-text { font-size: 0.92rem; }
          .user-name { display: none; }
          .icon-action-btn { padding: 5px; }
          .group-badge { max-width: 130px; font-size: 0.78rem; padding: 3px 9px; }

          .empty-state { padding: 28px 16px; gap: 12px; }
          .empty-icon { font-size: 2rem; }
          .empty-state h2 { font-size: 1.1rem; }
          .empty-state p { font-size: 0.83rem; }
        }
      `}</style>
    </div>
  );
}
