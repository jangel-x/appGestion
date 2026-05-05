import { useState, useRef, useEffect } from "react";
import { Users, Plus, LogIn, Copy, Check, LogOut, Crown, Shield, Trash2, MoreVertical } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { doc, updateDoc, arrayRemove } from "firebase/firestore";
import { db } from "../firebase/config";

export default function GroupPanel({ groups, activeGroup, onSelectGroup, onCreateGroup, onJoinGroup, onLeaveGroup, isMobile }) {
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [joinId, setJoinId] = useState("");
  const [copied, setCopied] = useState(false);
  const [showMembers, setShowMembers] = useState(true);
  const [memberMenu, setMemberMenu] = useState(null); // uid of member with open menu
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMemberMenu(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleCreate = async () => {
    if (!groupName.trim()) return;
    await onCreateGroup(groupName.trim());
    setGroupName(""); setShowCreate(false);
  };

  const handleJoin = async () => {
    if (!joinId.trim()) return;
    try {
      await onJoinGroup(joinId.trim());
      setJoinId(""); setShowJoin(false);
    } catch {
      alert("Grupo no encontrado. Revisa el ID.");
    }
  };

  const copyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopied(id);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleLeader = async (uid) => {
    if (!activeGroup) return;
    const ref = doc(db, "groups", activeGroup.id);
    const currentLeaders = activeGroup.leaders || [];
    const isLeader = currentLeaders.includes(uid);
    await updateDoc(ref, {
      leaders: isLeader ? currentLeaders.filter((l) => l !== uid) : [...currentLeaders, uid]
    });
    setMemberMenu(null);
  };

  const removeMember = async (uid) => {
    if (!activeGroup) return;
    if (!confirm("¿Eliminar a este miembro del grupo?")) return;
    const ref = doc(db, "groups", activeGroup.id);
    const memberDetails = { ...activeGroup.memberDetails };
    delete memberDetails[uid];
    await updateDoc(ref, {
      members: arrayRemove(uid),
      memberDetails,
    });
    setMemberMenu(null);
  };

  const isOwner = activeGroup?.ownerId === user?.uid;
  const leaders = activeGroup?.leaders || [];

  return (
    <div className="group-panel">
      <div className="gp-header">
        <div className="gp-title"><Users size={16} /> Mis grupos</div>
        <div className="gp-actions">
          <button className="gp-btn" onClick={() => { setShowCreate(!showCreate); setShowJoin(false); }} title="Crear grupo"><Plus size={15} /></button>
          <button className="gp-btn" onClick={() => { setShowJoin(!showJoin); setShowCreate(false); }} title="Unirse a grupo"><LogIn size={15} /></button>
        </div>
      </div>

      {showCreate && (
        <div className="gp-form">
          <input className="gp-input" placeholder="Nombre del grupo" value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()} autoFocus />
          <div className="gp-form-btns">
            <button className="gp-save" onClick={handleCreate}>Crear</button>
            <button className="gp-cancel" onClick={() => setShowCreate(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {showJoin && (
        <div className="gp-form">
          <p className="gp-join-hint">Pide a alguien del grupo que copie su ID y te lo mande.</p>
          <input className="gp-input" placeholder="Pega el ID del grupo aquí" value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()} autoFocus />
          <div className="gp-form-btns">
            <button className="gp-save" onClick={handleJoin}>Unirse</button>
            <button className="gp-cancel" onClick={() => setShowJoin(false)}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="gp-list">
        {groups.length === 0 && (
          <div className="gp-empty">
            <div className="gp-empty-icon">👥</div>
            <p>Sin grupos todavía</p>
            <p>Crea uno o únete con un ID</p>
          </div>
        )}
        {groups.map((g) => {
          const iAmOwner = g.ownerId === user?.uid;
          const memberCount = g.members?.length || 0;
          const isActive = activeGroup?.id === g.id;
          return (
            <div key={g.id} className={`gp-item ${isActive ? "active" : ""}`} onClick={() => onSelectGroup(g)}>
              <div className="gp-item-avatar">{g.name[0].toUpperCase()}</div>
              <div className="gp-item-info">
                <div className="gp-item-name">
                  {g.name}
                  {iAmOwner && <Crown size={11} style={{ color: "#eab308", marginLeft: 4 }} />}
                </div>
                <div className="gp-item-meta">{memberCount} {memberCount === 1 ? "miembro" : "miembros"}</div>
              </div>
              <div className="gp-item-actions" onClick={(e) => e.stopPropagation()}>
                <button className="gp-icon-btn" title="Copiar ID para invitar" onClick={() => copyId(g.id)}>
                  {copied === g.id ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                </button>
                {!iAmOwner && (
                  <button className="gp-icon-btn leave" title="Salir" onClick={() => onLeaveGroup(g.id)}>
                    <LogOut size={13} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Members */}
      {activeGroup && activeGroup.memberDetails && (
        <div className="gp-members">
          <button className="gp-members-title" onClick={() => setShowMembers(!showMembers)}>
            <span>Miembros ({Object.keys(activeGroup.memberDetails).length})</span>
            <span>{showMembers ? "▲" : "▼"}</span>
          </button>

          {showMembers && Object.entries(activeGroup.memberDetails).map(([uid, m]) => {
            const isThisOwner = uid === activeGroup.ownerId;
            const isLeader = leaders.includes(uid);
            const isMe = uid === user?.uid;
            const canManage = (isOwner || leaders.includes(user?.uid)) && !isThisOwner && !isMe;
            const menuOpen = memberMenu === uid;

            return (
              <div key={uid} className="member-row" ref={menuOpen ? menuRef : null}>
                <div className="member-dot" style={{ background: m.color || "#4ade80" }} />
                <span className="member-name">{isMe ? "Yo" : (m.name || m.email)}</span>
                <div className="member-badges">
                  {isThisOwner && <span className="badge owner"><Crown size={10} /> Dueño</span>}
                  {!isThisOwner && isLeader && <span className="badge leader"><Shield size={10} /> Líder</span>}
                </div>

                {canManage && (
                  <div className="member-menu-wrap">
                    <button
                      className="member-menu-btn"
                      onClick={() => setMemberMenu(menuOpen ? null : uid)}
                      title="Opciones"
                    >
                      <MoreVertical size={14} />
                    </button>

                    {menuOpen && (
                      <div className="member-menu">
                        <button className="member-menu-item" onClick={() => toggleLeader(uid)}>
                          <Shield size={13} />
                          {isLeader ? "Quitar líder" : "Dar líder"}
                        </button>
                        {isOwner && (
                          <button className="member-menu-item danger" onClick={() => removeMember(uid)}>
                            <Trash2 size={13} /> Eliminar del grupo
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .group-panel { display: flex; flex-direction: column; gap: 0; font-family: 'DM Sans', sans-serif; height: 100%; }
        .gp-header { display: flex; align-items: center; justify-content: space-between; padding: 0 0 12px; }
        .gp-title { display: flex; align-items: center; gap: 6px; font-size: 0.82rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
        .gp-actions { display: flex; gap: 4px; }
        .gp-btn { background: var(--accent-light); border: 1.5px solid var(--accent-border); border-radius: 6px; padding: 5px; cursor: pointer; color: var(--accent); display: flex; transition: all 0.15s; }
        .gp-btn:hover { background: var(--accent-light2); }

        .gp-form { background: var(--bg-hover); border-radius: 10px; padding: 12px; margin-bottom: 8px; display: flex; flex-direction: column; gap: 8px; border: 1.5px solid var(--accent-border); }
        .gp-join-hint { font-size: 0.78rem; color: var(--text-muted); }
        .gp-input { border: 1.5px solid var(--accent-border); border-radius: 8px; padding: 8px 10px; font-size: 0.88rem; font-family: 'DM Sans', sans-serif; outline: none; width: 100%; box-sizing: border-box; background: var(--bg-input); color: var(--text-primary); }
        .gp-input:focus { border-color: var(--accent); }
        .gp-form-btns { display: flex; gap: 6px; }
        .gp-save { flex: 1; background: var(--accent); color: white; border: none; border-radius: 8px; padding: 7px; font-size: 0.85rem; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .gp-cancel { flex: 1; background: var(--bg-hover); color: var(--text-muted); border: 1.5px solid var(--border); border-radius: 8px; padding: 7px; font-size: 0.85rem; cursor: pointer; font-family: 'DM Sans', sans-serif; }

        .gp-list { display: flex; flex-direction: column; gap: 4px; margin-bottom: 16px; }
        .gp-empty { text-align: center; padding: 24px 16px; color: var(--text-muted); font-size: 0.82rem; line-height: 1.8; }
        .gp-empty-icon { font-size: 2rem; margin-bottom: 4px; }

        .gp-item { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 10px; cursor: pointer; transition: all 0.15s; border: 1.5px solid transparent; }
        .gp-item:hover { background: var(--bg-hover); }
        .gp-item.active { background: var(--accent-light); border-color: var(--accent-border); }
        .gp-item-avatar { width: 34px; height: 34px; border-radius: 10px; background: var(--accent-light2); color: var(--accent-dark); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem; flex-shrink: 0; }
        .gp-item-info { flex: 1; min-width: 0; }
        .gp-item-name { font-size: 0.88rem; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .gp-item-meta { font-size: 0.75rem; color: var(--text-muted); }
        .gp-item-actions { display: flex; gap: 4px; opacity: 0; transition: opacity 0.15s; }
        .gp-item:hover .gp-item-actions { opacity: 1; }
        .gp-icon-btn { background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 4px; border-radius: 6px; display: flex; transition: all 0.15s; }
        .gp-icon-btn:hover { color: var(--accent); background: var(--accent-light); }
        .gp-icon-btn.leave:hover { color: #ef4444; background: #fef2f2; }

        .gp-members { border-top: 1.5px solid var(--border); padding-top: 12px; }
        .gp-members-title { font-size: 0.78rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; background: none; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; padding: 0; display: flex; justify-content: space-between; width: 100%; }

        .member-row { display: flex; align-items: center; gap: 6px; padding: 5px 0; position: relative; }
        .member-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .member-name { font-size: 0.85rem; color: var(--text-primary); flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .member-badges { display: flex; gap: 4px; flex-shrink: 0; }
        .badge { display: flex; align-items: center; gap: 3px; font-size: 0.7rem; padding: 2px 7px; border-radius: 100px; font-weight: 600; }
        .badge.owner { background: #fef9c3; color: #854d0e; }
        .badge.leader { background: #dbeafe; color: #1e40af; }

        .member-menu-wrap { position: relative; flex-shrink: 0; }
        .member-menu-btn { background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 3px; border-radius: 5px; display: flex; transition: all 0.15s; }
        .member-menu-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
        .member-menu {
          position: absolute; right: 0; top: 100%; margin-top: 4px;
          background: var(--bg-card); border: 1.5px solid var(--border);
          border-radius: 10px; padding: 6px; z-index: 100;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12); min-width: 160px;
          animation: fadeIn 0.1s ease;
        }
        @keyframes fadeIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
        .member-menu-item { display: flex; align-items: center; gap: 8px; width: 100%; padding: 8px 10px; border: none; border-radius: 7px; background: none; cursor: pointer; font-size: 0.85rem; color: var(--text-primary); font-family: 'DM Sans', sans-serif; transition: all 0.12s; text-align: left; }
        .member-menu-item:hover { background: var(--bg-hover); }
        .member-menu-item.danger { color: #ef4444; }
        .member-menu-item.danger:hover { background: #fef2f2; }
      `}</style>
    </div>
  );
}
