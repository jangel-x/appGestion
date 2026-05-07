import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useGroups, useAppointments } from "../hooks/useFirestore";
import Calendar from "../components/Calendar";
import WeekView from "../components/WeekView";
import GroupPanel from "../components/GroupPanel";
import GroupNotes from "../components/GroupNotes";
import StatsPanel from "../components/StatsPanel";
import HistoryPanel from "../components/HistoryPanel";
import AppointmentModal from "../components/AppointmentModal";
import DayView from "../components/DayView";
import SettingsModal from "../components/SettingsModal";
import MobileNav from "../components/MobileNav";
import { LogOut, Calendar as CalIcon, Plus, Users, Search, X, BarChart2, CalendarDays, Clock, Filter, Grid, AlignJustify } from "lucide-react";
import { format, parseISO, isAfter, startOfDay } from "date-fns";
import { es } from "date-fns/locale";

// ── Animación suave entre vistas ──────────────────────────────────────────────
function FadePanel({ id, activeId, children }) {
  const isActive = id === activeId;
  return (
    <div style={{
      opacity: isActive ? 1 : 0,
      transform: isActive ? "translateX(0)" : "translateX(10px)",
      pointerEvents: isActive ? "auto" : "none",
      position: isActive ? "relative" : "absolute",
      inset: isActive ? "auto" : 0,
      transition: "opacity 0.2s ease, transform 0.2s ease",
      display: "flex", flexDirection: "column",
      flex: isActive ? 1 : undefined,
      minHeight: 0, overflow: "hidden",
    }}>
      {children}
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, type = "success", onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return <div className={`toast toast-${type}`}>{message}</div>;
}

// ── Sidebar tabs desktop ──────────────────────────────────────────────────────
const SIDE_TABS = [
  { id: "groups",  label: "Grupos",      icon: <Users size={15} /> },
  { id: "stats",   label: "Estadísticas",icon: <BarChart2 size={15} /> },
  { id: "history", label: "Historial",   icon: <Clock size={15} /> },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const { groups, createGroup, joinGroup, leaveGroup, deleteGroup, propagateNameUpdate } = useGroups();

  const [activeGroup, setActiveGroup]   = useState(null);
  const [filter, setFilter]             = useState("all");
  const [calView, setCalView]           = useState("month"); // month | week
  const [modalState, setModalState]     = useState(null);
  const [dayView, setDayView]           = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [mobileTab, setMobileTab]       = useState("calendar");
  const [sideTab, setSideTab]           = useState("groups");
  const [toast, setToast]               = useState(null);
  const [searchQuery, setSearchQuery]   = useState("");
  const [showSearch, setShowSearch]     = useState(false);
  const [dayFilter, setDayFilter]       = useState(null); // "yyyy-MM-dd" | null
  const searchRef = useRef(null);

  const showToast = useCallback((msg, type = "success") => setToast({ message: msg, type, key: Date.now() }), []);

  // Cargamos TODAS las citas sin filtro de miembro para estadísticas e historial
  const { appointments: allAppointments } = useAppointments(activeGroup?.id, "all");
  const { appointments, loading, addAppointment, updateAppointment, deleteAppointment } =
    useAppointments(activeGroup?.id, filter);

  const memberColors = useMemo(() => {
    if (!activeGroup?.memberDetails) return {};
    const map = {};
    Object.entries(activeGroup.memberDetails).forEach(([uid, m]) => { map[uid] = m.color || "#4ade80"; });
    return map;
  }, [activeGroup]);

  const canEdit = (a) => {
    if (!a || !user) return false;
    return a.createdBy === user.uid || activeGroup?.ownerId === user.uid || (activeGroup?.leaders || []).includes(user.uid);
  };

  // Búsqueda
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !activeGroup) return [];
    const q = searchQuery.toLowerCase();
    return allAppointments.filter((a) =>
      a.title?.toLowerCase().includes(q) ||
      a.clientName?.toLowerCase().includes(q) ||
      a.notes?.toLowerCase().includes(q) ||
      a.createdByName?.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [searchQuery, allAppointments, activeGroup]);

  // Próximas (solo futuras/hoy), con filtro de día opcional
  const upcoming = useMemo(() => {
    const now = startOfDay(new Date());
    let list = allAppointments.filter((a) => {
      try { return !isAfter(now, parseISO(a.date)); } catch { return false; }
    });
    if (dayFilter) list = list.filter((a) => a.date === dayFilter);
    return list;
  }, [allAppointments, dayFilter]);

  const upcomingGrouped = useMemo(() => {
    const map = {};
    upcoming.forEach((a) => { if (!map[a.date]) map[a.date] = []; map[a.date].push(a); });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [upcoming]);

  // Días que tienen citas (para el date picker del filtro)
  const daysWithApps = useMemo(() => {
    const now = startOfDay(new Date());
    return [...new Set(
      allAppointments
        .filter((a) => { try { return !isAfter(now, parseISO(a.date)); } catch { return false; } })
        .map((a) => a.date)
    )].sort();
  }, [allAppointments]);

  const handleDayClick = (date) => {
    const dayApps = appointments.filter((a) => a.date === date);
    if (dayApps.length > 0) setDayView(date);
    else setModalState({ date });
  };

  const handleAppointmentClick = (a) => setModalState({ appointment: a, readOnly: !canEdit(a) });

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
    const base = [{ value: "all", label: "Todas" }, { value: "mine", label: "Mis citas" }];
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

  useEffect(() => { if (showSearch && searchRef.current) searchRef.current.focus(); }, [showSearch]);

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

  // Compartir cita (Web Share API o copiar al portapapeles)
  const shareAppointment = async (a) => {
    const text = [
      `📅 ${a.title}`,
      a.clientName ? `👤 ${a.clientName}` : null,
      `🗓️ ${a.date && (() => { try { return format(parseISO(a.date), "EEEE d 'de' MMMM yyyy", { locale: es }); } catch { return a.date; } })()}`,
      a.time ? `🕐 ${a.time}${a.duration ? ` (${a.duration} min)` : ""}` : null,
      a.notes ? `📝 ${a.notes}` : null,
    ].filter(Boolean).join("\n");

    if (navigator.share) {
      try { await navigator.share({ title: a.title, text }); return; } catch {}
    }
    await navigator.clipboard.writeText(text);
    showToast("Cita copiada al portapapeles 📋");
  };

  // ── Render próximas (móvil + desktop sidebar) ────────────────────────────
  const renderUpcomingList = (isMobile = false) => (
    <div className={isMobile ? "upcoming-section" : "sidebar-upcoming-list"}>
      {/* Filtro por día */}
      {activeGroup && daysWithApps.length > 0 && (
        <div className="day-filter-bar">
          <button className={`day-chip ${!dayFilter ? "active" : ""}`} onClick={() => setDayFilter(null)}>
            Todos los días
          </button>
          {daysWithApps.slice(0, 10).map((d) => (
            <button key={d} className={`day-chip ${dayFilter === d ? "active" : ""}`}
              onClick={() => setDayFilter(dayFilter === d ? null : d)}>
              {format(parseISO(d), "d MMM", { locale: es })}
            </button>
          ))}
        </div>
      )}

      {!activeGroup ? (
        <div className="mobile-empty">
          <div>📅</div><p>Selecciona un grupo primero</p>
          <button className="mobile-go-btn" onClick={() => setMobileTab("groups")}><Users size={16} /> Ver mis grupos</button>
        </div>
      ) : upcoming.length === 0 ? (
        <div className="mobile-empty">
          <div>🗓️</div>
          <p>{dayFilter ? "Sin citas ese día" : "No hay próximas citas"}</p>
          {dayFilter && <button className="mobile-go-btn secondary" onClick={() => setDayFilter(null)}>Ver todos los días</button>}
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
                <span className="uc-emoji">{{ cita:"✂️",reunion:"🤝",personal:"👤",otro:"📌" }[a.category]||"📌"}</span>
                <span className="uc-title">{a.title}</span>
                <button className="uc-share" onClick={(e) => { e.stopPropagation(); shareAppointment(a); }} title="Compartir">⬆️</button>
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

  // ── Render búsqueda ──────────────────────────────────────────────────────
  const renderSearch = (onClickResult) => (
    <div className="search-results">
      {searchQuery.trim() === "" ? (
        <div className="search-hint">Escribe para buscar citas, clientes o notas...</div>
      ) : searchResults.length === 0 ? (
        <div className="search-hint">Sin resultados para «{searchQuery}»</div>
      ) : searchResults.map((a) => (
        <div key={a.id} className="upcoming-card"
          style={{ borderLeft: `4px solid ${memberColors[a.createdBy] || "#4ade80"}` }}
          onClick={() => { handleAppointmentClick(a); onClickResult?.(); }}>
          <div className="uc-top">
            <span className="uc-emoji">{{ cita:"✂️",reunion:"🤝",personal:"👤",otro:"📌" }[a.category]||"📌"}</span>
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

  // ── Filtros de calendario ────────────────────────────────────────────────
  const renderFilterBar = (isMobile = false) => (
    <div className={`filter-bar ${isMobile ? "mobile-filter-bar" : ""}`}>
      {!isMobile && <span className="filter-label"><Filter size={13} /> Filtrar:</span>}
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
      {/* Toggle vista mes/semana */}
      <div className="view-toggle">
        <button className={`vt-btn ${calView === "month" ? "active" : ""}`} onClick={() => setCalView("month")} title="Vista mensual"><Grid size={14} /></button>
        <button className={`vt-btn ${calView === "week" ? "active" : ""}`} onClick={() => setCalView("week")} title="Vista semanal"><AlignJustify size={14} /></button>
      </div>
      {!isMobile && (
        <button className="new-btn" onClick={() => setModalState({ date: format(new Date(), "yyyy-MM-dd") })}>
          + Nueva cita
        </button>
      )}
    </div>
  );

  const renderCalendar = () => loading ? (
    <div className="loading"><div className="spinner" />Cargando...</div>
  ) : calView === "week" ? (
    <div className="cal-wrapper">
      <WeekView appointments={appointments} onDayClick={handleDayClick}
        onAppointmentClick={handleAppointmentClick} memberColors={memberColors} currentUserId={user?.uid} />
    </div>
  ) : (
    <div className="cal-wrapper">
      <Calendar appointments={appointments} onDayClick={handleDayClick}
        onAppointmentClick={handleAppointmentClick} memberColors={memberColors} currentUserId={user?.uid} />
    </div>
  );

  return (
    <div className={`dashboard theme-${theme}`}>

      {/* ── TOPBAR ── */}
      <header className="topbar">
        {showSearch ? (
          <div className="search-bar">
            <Search size={16} className="search-icon-inline" />
            <input ref={searchRef} className="search-input" placeholder="Buscar citas, clientes, notas..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setShowSearch(false)} />
            <button className="search-close" onClick={() => { setShowSearch(false); setSearchQuery(""); }}><X size={16} /></button>
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
              {activeGroup && <div className="group-badge"><CalIcon size={13}/><span>{activeGroup.name}</span></div>}
            </div>
            <div className="topbar-right">
              {activeGroup && (
                <button className="icon-action-btn desktop-only" onClick={() => setShowSearch(true)} title="Buscar">
                  <Search size={17} />
                </button>
              )}
              {user?.photo && <img src={user.photo} alt={user.name} className="user-avatar" />}
              <span className="user-name">{user?.name?.split(" ")[0]}</span>
              <button className="icon-action-btn desktop-only" onClick={() => setShowSettings(true)} title="Ajustes">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              </button>
              <button className="icon-action-btn logout" onClick={logout} title="Cerrar sesión"><LogOut size={17} /></button>
            </div>
          </>
        )}
      </header>

      {/* Search overlay desktop */}
      {showSearch && activeGroup && (
        <>
          <div className="search-backdrop desktop-only" onClick={() => { setShowSearch(false); setSearchQuery(""); }} />
          <div className="search-overlay desktop-only">
            {renderSearch(() => setShowSearch(false))}
          </div>
        </>
      )}

      <div className="main-layout">

        {/* ── DESKTOP SIDEBAR ── */}
        <aside className="sidebar">
          {/* Sidebar tab switcher */}
          <div className="side-tabs">
            {SIDE_TABS.map((t) => (
              <button key={t.id} className={`side-tab ${sideTab === t.id ? "active" : ""}`}
                onClick={() => setSideTab(t.id)}>
                {t.icon} <span>{t.label}</span>
              </button>
            ))}
          </div>

          <div className="side-content">
            <FadePanel id="groups" activeId={sideTab}>
              <GroupPanel groups={groups} activeGroup={activeGroup} onSelectGroup={handleSelectGroup}
                onCreateGroup={createGroup} onJoinGroup={joinGroup} onLeaveGroup={handleLeaveGroup}
                onDeleteGroup={handleDeleteGroup} appointments={allAppointments} />
              {activeGroup && <GroupNotes groupId={activeGroup.id} />}
            </FadePanel>

            <FadePanel id="stats" activeId={sideTab}>
              {activeGroup ? (
                <StatsPanel appointments={allAppointments} memberDetails={activeGroup.memberDetails} currentUserId={user?.uid} />
              ) : (
                <div className="side-empty">Selecciona un grupo para ver estadísticas</div>
              )}
            </FadePanel>

            <FadePanel id="history" activeId={sideTab}>
              {activeGroup ? (
                <HistoryPanel appointments={allAppointments} onAppointmentClick={handleAppointmentClick}
                  memberColors={memberColors} currentUserId={user?.uid} />
              ) : (
                <div className="side-empty">Selecciona un grupo para ver el historial</div>
              )}
            </FadePanel>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="content">

          {/* Desktop: próximas + calendario */}
          <div className="desktop-area">
            {!activeGroup ? (
              <div className="empty-state">
                <div className="empty-icon">📅</div>
                <h2>Selecciona un grupo</h2>
                <p>Elige un grupo en el panel lateral para ver y añadir citas.</p>
              </div>
            ) : (
              <div className="desktop-two-col">
                {/* Próximas lateral */}
                <div className="desktop-upcoming">
                  <div className="du-header">
                    <span className="du-title">Próximas</span>
                    <button className="du-search-btn" onClick={() => setShowSearch(true)} title="Buscar">
                      <Search size={14} />
                    </button>
                  </div>
                  {renderUpcomingList(false)}
                </div>

                {/* Calendario */}
                <div className="desktop-cal">
                  {renderFilterBar(false)}
                  {renderCalendar()}
                </div>
              </div>
            )}
          </div>

          {/* ── MÓVIL: tabs ── */}
          <div className="mobile-tabs-container">

            <FadePanel id="calendar" activeId={mobileTab}>
              {!activeGroup ? (
                <div className="empty-state">
                  <div className="empty-icon">📅</div>
                  <h2>Selecciona un grupo</h2>
                  <p>Elige un grupo para ver y añadir citas.</p>
                  <button className="empty-cta" onClick={() => setMobileTab("groups")}><Users size={16} /> Ver mis grupos</button>
                </div>
              ) : (
                <div className="mobile-cal-inner">
                  {renderFilterBar(true)}
                  {renderCalendar()}
                </div>
              )}
            </FadePanel>

            <FadePanel id="groups" activeId={mobileTab}>
              <div className="mobile-panel">
                <GroupPanel groups={groups} activeGroup={activeGroup} onSelectGroup={handleSelectGroup}
                  onCreateGroup={createGroup} onJoinGroup={joinGroup} onLeaveGroup={handleLeaveGroup}
                  onDeleteGroup={handleDeleteGroup} appointments={allAppointments} isMobile />
                {activeGroup && <GroupNotes groupId={activeGroup.id} />}
              </div>
            </FadePanel>

            <FadePanel id="upcoming" activeId={mobileTab}>
              {/* Búsqueda SOLO en esta pestaña en móvil */}
              <div className="upcoming-header-bar">
                <span className="upbar-title">Próximas citas</span>
                {activeGroup && (
                  showSearch ? (
                    <div className="upbar-search">
                      <Search size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                      <input ref={searchRef} className="upbar-input" placeholder="Buscar..."
                        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus />
                      <button className="upbar-close" onClick={() => { setShowSearch(false); setSearchQuery(""); }}><X size={14} /></button>
                    </div>
                  ) : (
                    <button className="upbar-search-btn" onClick={() => setShowSearch(true)}><Search size={16} /></button>
                  )
                )}
              </div>
              {showSearch ? (
                <div className="search-results-mobile">{renderSearch()}</div>
              ) : (
                renderUpcomingList(true)
              )}
            </FadePanel>

            <FadePanel id="stats" activeId={mobileTab}>
              <div className="mobile-panel">
                {activeGroup ? (
                  <>
                    <StatsPanel appointments={allAppointments} memberDetails={activeGroup.memberDetails} currentUserId={user?.uid} />
                    <div style={{ height: 24 }} />
                    <HistoryPanel appointments={allAppointments} onAppointmentClick={handleAppointmentClick}
                      memberColors={memberColors} currentUserId={user?.uid} />
                  </>
                ) : (
                  <div className="mobile-empty"><div>📊</div><p>Selecciona un grupo primero</p></div>
                )}
              </div>
            </FadePanel>

            <FadePanel id="settings" activeId={mobileTab}>
              <div className="mobile-panel">
                <SettingsModal inline onClose={() => setMobileTab("calendar")} propagateName={propagateNameUpdate} />
              </div>
            </FadePanel>

          </div>
        </main>
      </div>

      {/* FAB */}
      {activeGroup && mobileTab === "calendar" && (
        <button className="fab" onClick={() => setModalState({ date: format(new Date(), "yyyy-MM-dd") })}>
          <Plus size={22} />
        </button>
      )}

      <MobileNav activeTab={mobileTab} onTabChange={(tab) => { setMobileTab(tab); if (tab !== "upcoming") { setShowSearch(false); setSearchQuery(""); } }} />

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
          --accent:#16a34a; --accent-dark:#15803d; --accent-light:#f0fdf4; --accent-light2:#bbf7d0;
          --accent-border:#bbf7d0; --bg:#f9fafb; --bg-card:#ffffff; --bg-hover:#f0fdf4;
          --bg-input:#ffffff; --border:#dcfce7; --text-primary:#1f2937;
          --text-secondary:#374151; --text-muted:#6b7280; --nav-h:60px; --topbar-h:54px;
        }
        .dashboard.theme-dark {
          --accent:#4ade80; --accent-dark:#22c55e; --accent-light:#14532d22; --accent-light2:#14532d44;
          --accent-border:#166534; --bg:#0f1117; --bg-card:#1a1f2e; --bg-hover:#1f2937;
          --bg-input:#111827; --border:#1f2937; --text-primary:#f9fafb;
          --text-secondary:#d1d5db; --text-muted:#6b7280;
        }
        .dashboard { display:flex; flex-direction:column; height:100dvh; background:var(--bg); font-family:'DM Sans',sans-serif; overflow:hidden; }

        /* TOPBAR */
        .topbar { display:flex; align-items:center; padding:0 20px; height:var(--topbar-h); background:var(--bg-card); border-bottom:1.5px solid var(--border); flex-shrink:0; gap:10px; box-shadow:0 1px 8px rgba(0,0,0,0.05); z-index:50; }
        .topbar-left { display:flex; align-items:center; flex-shrink:0; }
        .topbar-center { flex:1; display:flex; justify-content:center; min-width:0; padding:0 6px; overflow:hidden; }
        .topbar-right { display:flex; align-items:center; gap:4px; flex-shrink:0; }
        .logo { display:flex; align-items:center; gap:8px; }
        .logo-text { font-family:'DM Serif Display',serif; font-size:1.15rem; color:var(--text-primary); white-space:nowrap; }
        .group-badge { display:flex; align-items:center; gap:5px; background:var(--accent-light); border:1.5px solid var(--accent-border); padding:4px 11px; border-radius:100px; font-size:0.83rem; font-weight:500; color:var(--accent); max-width:170px; }
        .group-badge span { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .user-avatar { width:28px; height:28px; border-radius:50%; object-fit:cover; }
        .user-name { font-size:0.84rem; font-weight:500; color:var(--text-secondary); white-space:nowrap; }
        .icon-action-btn { background:none; border:none; cursor:pointer; color:var(--text-muted); padding:6px; border-radius:8px; display:flex; align-items:center; justify-content:center; transition:all 0.15s; flex-shrink:0; }
        .icon-action-btn:hover { color:var(--accent); background:var(--accent-light); }
        .icon-action-btn.logout:hover { color:#ef4444; background:#fef2f2; }
        .search-bar { display:flex; align-items:center; gap:8px; flex:1; background:var(--bg-hover); border-radius:10px; padding:0 12px; border:1.5px solid var(--accent-border); animation:fade-in 0.15s ease; }
        .search-icon-inline { color:var(--text-muted); flex-shrink:0; }
        .search-input { flex:1; border:none; background:none; outline:none; font-family:'DM Sans',sans-serif; font-size:0.92rem; color:var(--text-primary); padding:9px 0; }
        .search-input::placeholder { color:var(--text-muted); }
        .search-close { background:none; border:none; cursor:pointer; color:var(--text-muted); padding:4px; display:flex; border-radius:6px; transition:all 0.15s; }
        .search-close:hover { color:var(--text-primary); }
        .search-overlay { position:fixed; top:calc(var(--topbar-h) + 6px); right:20px; width:360px; max-height:65vh; background:var(--bg-card); border:1.5px solid var(--border); border-radius:14px; box-shadow:0 16px 48px rgba(0,0,0,0.18); z-index:200; overflow-y:auto; animation:s-drop 0.18s ease; }
        .search-results { padding:12px; display:flex; flex-direction:column; gap:8px; }
        .search-hint { padding:24px 20px; text-align:center; color:var(--text-muted); font-size:0.88rem; }
        .search-backdrop { position:fixed; inset:0; z-index:199; }
        @keyframes s-drop { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fade-in { from{opacity:0} to{opacity:1} }

        /* LAYOUT */
        .main-layout { display:flex; flex:1; overflow:hidden; min-height:0; }
        .content { flex:1; overflow:hidden; display:flex; flex-direction:column; min-width:0; position:relative; }

        /* SIDEBAR */
        .sidebar { width:280px; flex-shrink:0; background:var(--bg-card); border-right:1.5px solid var(--border); display:flex; flex-direction:column; overflow:hidden; }
        .side-tabs { display:flex; gap:2px; padding:10px 10px 0; flex-shrink:0; border-bottom:1.5px solid var(--border); }
        .side-tab { flex:1; display:flex; align-items:center; justify-content:center; gap:5px; padding:8px 4px; border:none; background:none; cursor:pointer; font-size:0.74rem; font-family:'DM Sans',sans-serif; font-weight:600; color:var(--text-muted); border-radius:8px 8px 0 0; transition:all 0.15s; border-bottom:2px solid transparent; white-space:nowrap; }
        .side-tab:hover { color:var(--text-primary); background:var(--bg-hover); }
        .side-tab.active { color:var(--accent); border-bottom-color:var(--accent); background:var(--accent-light); }
        .side-content { flex:1; overflow-y:auto; padding:16px 14px; position:relative; display:flex; flex-direction:column; }
        .side-empty { font-size:0.84rem; color:var(--text-muted); text-align:center; padding:32px 16px; }

        /* DESKTOP TWO COL */
        .desktop-area { display:flex; flex-direction:column; flex:1; overflow:hidden; min-height:0; }
        .mobile-tabs-container { display:none; }
        .desktop-two-col { display:flex; flex:1; overflow:hidden; min-height:0; }

        /* Próximas desktop */
        .desktop-upcoming { width:260px; flex-shrink:0; border-right:1.5px solid var(--border); display:flex; flex-direction:column; overflow:hidden; }
        .du-header { display:flex; align-items:center; justify-content:space-between; padding:12px 14px 8px; flex-shrink:0; border-bottom:1.5px solid var(--border); }
        .du-title { font-size:0.73rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.6px; }
        .du-search-btn { background:none; border:none; cursor:pointer; color:var(--text-muted); padding:4px; border-radius:6px; display:flex; transition:all 0.15s; }
        .du-search-btn:hover { color:var(--accent); background:var(--accent-light); }
        .sidebar-upcoming-list { flex:1; overflow-y:auto; padding:8px 10px; display:flex; flex-direction:column; gap:6px; }

        /* Calendario desktop */
        .desktop-cal { flex:1; display:flex; flex-direction:column; overflow:hidden; min-width:0; }

        /* Filter bar */
        .filter-bar { display:flex; align-items:center; gap:7px; padding:8px 16px; background:var(--bg-card); border-bottom:1.5px solid var(--border); flex-shrink:0; }
        .mobile-filter-bar { padding:6px 10px; }
        .filter-label { display:flex; align-items:center; gap:4px; font-size:0.76rem; color:var(--text-muted); font-weight:500; white-space:nowrap; flex-shrink:0; }
        .filter-chips { display:flex; gap:5px; overflow-x:auto; flex:1; }
        .filter-chip { display:flex; align-items:center; gap:4px; padding:4px 10px; border-radius:100px; border:1.5px solid var(--border); background:var(--bg-hover); font-size:0.79rem; cursor:pointer; color:var(--text-secondary); transition:all 0.15s; font-family:'DM Sans',sans-serif; font-weight:500; white-space:nowrap; flex-shrink:0; }
        .filter-chip:hover { border-color:var(--accent); }
        .filter-chip.active { border-color:var(--accent); background:var(--accent-light); color:var(--accent); }
        .chip-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
        .view-toggle { display:flex; gap:2px; background:var(--bg-hover); border:1.5px solid var(--border); border-radius:8px; padding:2px; flex-shrink:0; }
        .vt-btn { background:none; border:none; cursor:pointer; color:var(--text-muted); padding:4px 7px; border-radius:6px; display:flex; align-items:center; transition:all 0.15s; }
        .vt-btn:hover { color:var(--text-primary); }
        .vt-btn.active { background:var(--accent); color:white; }
        .new-btn { background:var(--accent); color:white; border:none; border-radius:100px; padding:6px 14px; font-size:0.82rem; font-weight:600; cursor:pointer; transition:background 0.15s; white-space:nowrap; font-family:'DM Sans',sans-serif; margin-left:auto; flex-shrink:0; }
        .new-btn:hover { background:var(--accent-dark); }

        /* Day filter */
        .day-filter-bar { display:flex; gap:5px; overflow-x:auto; padding:8px 10px; flex-shrink:0; border-bottom:1.5px solid var(--border); }
        .day-chip { display:flex; align-items:center; padding:4px 10px; border-radius:100px; border:1.5px solid var(--border); background:var(--bg-hover); font-size:0.78rem; cursor:pointer; color:var(--text-secondary); transition:all 0.15s; font-family:'DM Sans',sans-serif; font-weight:500; white-space:nowrap; flex-shrink:0; }
        .day-chip:hover { border-color:var(--accent); }
        .day-chip.active { border-color:var(--accent); background:var(--accent-light); color:var(--accent); font-weight:600; }

        /* Cal wrapper */
        .cal-wrapper { flex:1; padding:14px 18px; overflow-y:auto; min-height:0; }

        /* Empty */
        .empty-state { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; color:var(--text-muted); padding:32px 20px; text-align:center; }
        .empty-icon { font-size:2.8rem; }
        .empty-state h2 { font-family:'DM Serif Display',serif; color:var(--text-secondary); font-size:1.35rem; }
        .empty-state p { max-width:240px; line-height:1.6; font-size:0.87rem; }
        .empty-cta { display:flex; align-items:center; gap:8px; background:var(--accent); color:white; border:none; border-radius:12px; padding:11px 22px; font-size:0.92rem; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:background 0.15s; }
        .empty-cta:hover { background:var(--accent-dark); }

        /* Loading */
        .loading { flex:1; display:flex; align-items:center; justify-content:center; gap:10px; color:var(--text-muted); font-size:0.88rem; }
        .spinner { width:18px; height:18px; border:2px solid var(--border); border-top-color:var(--accent); border-radius:50%; animation:spin 0.7s linear infinite; flex-shrink:0; }
        @keyframes spin { to { transform:rotate(360deg); } }

        /* Upcoming cards */
        .upcoming-section { padding:0 10px 10px; display:flex; flex-direction:column; gap:6px; overflow-y:auto; flex:1; min-height:0; padding-bottom:calc(var(--nav-h) + 10px); }
        .upcoming-group { display:flex; flex-direction:column; gap:5px; }
        .upcoming-date-header { display:flex; align-items:baseline; gap:8px; padding:10px 2px 4px; }
        .udh-label { font-family:'DM Serif Display',serif; font-size:0.98rem; color:var(--text-primary); text-transform:capitalize; }
        .udh-full { font-size:0.73rem; color:var(--text-muted); }
        .upcoming-card { background:var(--bg-card); border-radius:10px; padding:10px 12px; cursor:pointer; transition:opacity 0.15s; box-shadow:0 1px 4px rgba(0,0,0,0.06); }
        .upcoming-card:active { opacity:0.8; }
        .uc-top { display:flex; align-items:center; gap:6px; margin-bottom:4px; }
        .uc-emoji { font-size:0.88rem; flex-shrink:0; }
        .uc-title { font-weight:600; color:var(--text-primary); flex:1; font-size:0.9rem; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .uc-share { background:none; border:none; cursor:pointer; font-size:0.75rem; padding:2px 4px; border-radius:4px; transition:all 0.15s; opacity:0.5; flex-shrink:0; }
        .uc-share:hover { opacity:1; background:var(--bg-hover); }
        .uc-who { font-size:0.73rem; font-weight:600; flex-shrink:0; }
        .uc-meta { display:flex; gap:10px; font-size:0.76rem; color:var(--text-muted); flex-wrap:wrap; }

        /* Upcoming header bar móvil */
        .upcoming-header-bar { display:flex; align-items:center; justify-content:space-between; padding:10px 12px 0; flex-shrink:0; gap:8px; }
        .upbar-title { font-family:'DM Serif Display',serif; font-size:1.05rem; color:var(--text-primary); }
        .upbar-search-btn { background:none; border:none; cursor:pointer; color:var(--text-muted); padding:6px; border-radius:8px; display:flex; transition:all 0.15s; }
        .upbar-search-btn:hover { color:var(--accent); background:var(--accent-light); }
        .upbar-search { display:flex; align-items:center; gap:6px; flex:1; background:var(--bg-hover); border:1.5px solid var(--accent-border); border-radius:10px; padding:0 10px; animation:fade-in 0.15s ease; }
        .upbar-input { flex:1; border:none; background:none; outline:none; font-family:'DM Sans',sans-serif; font-size:0.88rem; color:var(--text-primary); padding:7px 0; }
        .upbar-input::placeholder { color:var(--text-muted); }
        .upbar-close { background:none; border:none; cursor:pointer; color:var(--text-muted); padding:3px; display:flex; border-radius:5px; }
        .search-results-mobile { flex:1; overflow-y:auto; padding:10px 12px; display:flex; flex-direction:column; gap:8px; padding-bottom:calc(var(--nav-h) + 10px); }

        /* Mobile */
        .mobile-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; padding:48px 24px; color:var(--text-muted); text-align:center; flex:1; }
        .mobile-empty div { font-size:2.4rem; }
        .mobile-empty p { font-size:0.9rem; line-height:1.5; }
        .mobile-go-btn { display:flex; align-items:center; gap:8px; background:var(--accent); color:white; border:none; border-radius:12px; padding:11px 22px; font-size:0.92rem; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; }
        .mobile-go-btn.secondary { background:var(--bg-hover); color:var(--text-secondary); border:1.5px solid var(--border); }
        .mobile-panel { padding:14px; overflow-y:auto; flex:1; min-height:0; padding-bottom:calc(var(--nav-h) + 10px); display:flex; flex-direction:column; gap:14px; }
        .mobile-cal-inner { display:flex; flex-direction:column; flex:1; min-height:0; overflow:hidden; }
        .mobile-cal-inner .cal-wrapper { padding:8px; padding-bottom:calc(var(--nav-h) + 56px); }

        /* FAB */
        .fab { display:none; position:fixed; bottom:calc(var(--nav-h) + 14px); right:16px; width:50px; height:50px; border-radius:50%; background:var(--accent); color:white; border:none; cursor:pointer; box-shadow:0 4px 18px rgba(22,163,74,0.4); align-items:center; justify-content:center; transition:all 0.2s; z-index:100; }
        .fab:active { transform:scale(0.94); }

        /* Toast */
        .toast { position:fixed; bottom:calc(var(--nav-h) + 10px); left:50%; transform:translateX(-50%); padding:9px 20px; border-radius:100px; font-size:0.85rem; font-weight:600; z-index:9999; animation:toast-in 0.2s ease, toast-out 0.3s ease 2.7s forwards; white-space:nowrap; box-shadow:0 4px 18px rgba(0,0,0,0.15); font-family:'DM Sans',sans-serif; pointer-events:none; }
        .toast-success { background:#16a34a; color:white; }
        .toast-info { background:#374151; color:#f9fafb; }
        .toast-error { background:#ef4444; color:white; }
        @keyframes toast-in { from{opacity:0;transform:translateX(-50%) translateY(8px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes toast-out { from{opacity:1} to{opacity:0} }

        /* MOBILE MEDIA */
        @media (max-width: 768px) {
          .sidebar { display:none; }
          .desktop-only { display:none !important; }
          .desktop-area { display:none; }
          .mobile-tabs-container { display:flex; flex-direction:column; flex:1; overflow:hidden; min-height:0; position:relative; }
          .fab { display:flex; }
          .topbar { padding:0 10px; height:48px; }
          .logo svg { width:22px; height:22px; }
          .logo-text { font-size:0.92rem; }
          .user-name { display:none; }
          .icon-action-btn { padding:5px; }
          .group-badge { max-width:130px; font-size:0.78rem; padding:3px 9px; }
          .empty-state { padding:28px 16px; gap:12px; }
          .empty-icon { font-size:2rem; }
          .empty-state h2 { font-size:1.1rem; }
          .empty-state p { font-size:0.83rem; }
        }
      `}</style>
    </div>
  );
}
