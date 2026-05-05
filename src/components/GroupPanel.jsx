import { useState } from "react";
import { Users, Plus, LogIn, Copy, Check, LogOut, Crown, Shield } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";

export default function GroupPanel({ groups, activeGroup, onSelectGroup, onCreateGroup, onJoinGroup, onLeaveGroup }) {
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [joinId, setJoinId] = useState("");
  const [copied, setCopied] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

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
    } catch (e) {
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
  };

  const isOwner = activeGroup?.ownerId === user?.uid;
  const leaders = activeGroup?.leaders || [];

  return (
    <div className="group-panel">
      <div className="gp-header">
        <div className="gp-title"><Users size={16} /> Mis grupos</div>
        <div className="gp-actions">
          <button className="gp-btn" onClick={() => { setShowCreate(true); setShowJoin(false); }} title="Crear grupo"><Plus size={15} /></button>
          <button className="gp-btn" onClick={() => { setShowJoin(true); setShowCreate(false); }} title="Unirse a grupo"><LogIn size={15} /></button>
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
          <input className="gp-input" placeholder="ID del grupo" value={joinId}
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
          <div className="gp-empty"><p>Sin grupos todavía.</p><p>Crea uno o únete con un ID.</p></div>
        )}
        {groups.map((g) => {
          const iAmOwner = g.ownerId === user?.uid;
          const memberCount = g.members?.length || 0;
          const isActive = activeGroup?.id === g.id;
          return (
            <div key={g.id} className={`gp-item ${isActive ? "active" : ""}`} onClick={() => onSelectGroup(g)}>
              <div className="gp-item-avatar">{g.name[0].toUpperCase()}</div>
              <div className="gp-item-info">
                <div className="gp-item-name">{g.name}{iAmOwner && <Crown size={11} style={{ color: "#eab308", marginLeft: 4 }} />}</div>
                <div className="gp-item-meta">{memberCount} {memberCount === 1 ? "miembro" : "miembros"}</div>
              </div>
              <div className="gp-item-actions" onClick={(e) => e.stopPropagation()}>
                <button className="gp-icon-btn" title="Copiar ID" onClick={() => copyId(g.id)}>
                  {copied === g.id ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                </button>
                {!iAmOwner && (
                  <button className="gp-icon-btn leave" title="Salir" onClick={() => onLeaveGroup(g.id)}><LogOut size={13} /></button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {activeGroup && activeGroup.memberDetails && (
        <div className="gp-members">
          <button className="gp-members-title" onClick={() => setShowMembers(!showMembers)}>
            Miembros {showMembers ? "▲" : "▼"}
          </button>
          {showMembers && Object.entries(activeGroup.memberDetails).map(([uid, m]) => {
            const isThisOwner = uid === activeGroup.ownerId;
            const isLeader = leaders.includes(uid);
            const isMe = uid === user?.uid;
            return (
              <div key={uid} className="member-row">
                <div className="member-dot" style={{ background: m.color || "#4ade80" }} />
                <span className="member-name">{isMe ? "Yo" : (m.name || m.email)}</span>
                <div className="member-badges">
                  {isThisOwner && <span className="badge owner"><Crown size={10} /> Dueño</span>}
                  {!isThisOwner && isLeader && <span className="badge leader"><Shield size={10} /> Líder</span>}
                </div>
                {isOwner && !isThisOwner && !isMe && (
                  <button className={`promote-btn ${isLeader ? "demote" : ""}`} onClick={() => toggleLeader(uid)}>
                    {isLeader ? "Quitar líder" : "Dar líder"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .group-panel { display: flex; flex-direction: column; gap: 0; font-family: 'DM Sans', sans-serif; height: 100%; }
        .gp-header { display: flex; align-items: center; justify-content: space-between; padding: 0 0 12px; }
        .gp-title { display: flex; align-items: center; gap: 6px; font-size: 0.82rem; font-weight: 600; color: #4b5563; text-transform: uppercase; letter-spacing: 0.5px; }
        .gp-actions { display: flex; gap: 4px; }
        .gp-btn { background: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 6px; padding: 5px; cursor: pointer; color: #16a34a; display: flex; transition: all 0.15s; }
        .gp-btn:hover { background: #dcfce7; }
        .gp-form { background: #f9fafb; border-radius: 10px; padding: 12px; margin-bottom: 8px; display: flex; flex-direction: column; gap: 8px; border: 1.5px solid #d1fae5; }
        .gp-input { border: 1.5px solid #d1fae5; border-radius: 8px; padding: 8px 10px; font-size: 0.88rem; font-family: 'DM Sans', sans-serif; outline: none; width: 100%; box-sizing: border-box; }
        .gp-input:focus { border-color: #4ade80; }
        .gp-form-btns { display: flex; gap: 6px; }
        .gp-save { flex: 1; background: #16a34a; color: white; border: none; border-radius: 8px; padding: 7px; font-size: 0.85rem; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .gp-cancel { flex: 1; background: #f3f4f6; color: #6b7280; border: 1.5px solid #e5e7eb; border-radius: 8px; padding: 7px; font-size: 0.85rem; cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .gp-list { display: flex; flex-direction: column; gap: 4px; margin-bottom: 16px; }
        .gp-empty { text-align: center; padding: 20px; color: #9ca3af; font-size: 0.82rem; line-height: 1.6; }
        .gp-item { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 10px; cursor: pointer; transition: all 0.15s; border: 1.5px solid transparent; }
        .gp-item:hover { background: #f0fdf4; }
        .gp-item.active { background: #dcfce7; border-color: #86efac; }
        .gp-item-avatar { width: 34px; height: 34px; border-radius: 10px; background: #bbf7d0; color: #15803d; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem; flex-shrink: 0; }
        .gp-item-info { flex: 1; min-width: 0; }
        .gp-item-name { font-size: 0.88rem; font-weight: 600; color: #1f2937; display: flex; align-items: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .gp-item-meta { font-size: 0.75rem; color: #9ca3af; }
        .gp-item-actions { display: flex; gap: 4px; opacity: 0; transition: opacity 0.15s; }
        .gp-item:hover .gp-item-actions { opacity: 1; }
        .gp-icon-btn { background: none; border: none; cursor: pointer; color: #9ca3af; padding: 4px; border-radius: 6px; display: flex; transition: all 0.15s; }
        .gp-icon-btn:hover { color: #16a34a; background: #f0fdf4; }
        .gp-icon-btn.leave:hover { color: #ef4444; background: #fef2f2; }
        .gp-members { border-top: 1.5px solid #f0fdf4; padding-top: 12px; }
        .gp-members-title { font-size: 0.78rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; background: none; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; padding: 0; display: flex; gap: 6px; }
        .member-row { display: flex; align-items: center; gap: 6px; padding: 5px 0; flex-wrap: wrap; }
        .member-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .member-name { font-size: 0.85rem; color: #374151; flex: 1; }
        .member-badges { display: flex; gap: 4px; }
        .badge { display: flex; align-items: center; gap: 3px; font-size: 0.7rem; padding: 2px 7px; border-radius: 100px; font-weight: 600; }
        .badge.owner { background: #fef9c3; color: #854d0e; }
        .badge.leader { background: #dbeafe; color: #1e40af; }
        .promote-btn { font-size: 0.7rem; padding: 2px 8px; border-radius: 100px; border: 1.5px solid #d1fae5; background: #f0fdf4; color: #16a34a; cursor: pointer; font-weight: 600; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
        .promote-btn.demote { border-color: #fecaca; background: #fef2f2; color: #ef4444; }
      `}</style>
    </div>
  );
}
