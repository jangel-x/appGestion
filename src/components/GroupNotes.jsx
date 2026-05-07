import { useState, useEffect, useRef } from "react";
import { doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { FileText, Save, Edit3 } from "lucide-react";

export default function GroupNotes({ groupId }) {
  const { user } = useAuth();
  const [notes, setNotes] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastEdit, setLastEdit] = useState(null);
  const taRef = useRef(null);

  useEffect(() => {
    if (!groupId) return;
    const ref = doc(db, "groups", groupId);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setNotes(d.notes || "");
        setLastEdit(d.notesLastEdit || null);
      }
    });
    return unsub;
  }, [groupId]);

  const startEditing = () => { setDraft(notes); setEditing(true); setTimeout(() => taRef.current?.focus(), 50); };

  const save = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, "groups", groupId), {
        notes: draft,
        notesLastEdit: { by: user.name || user.email, at: new Date().toISOString() },
      });
      setEditing(false);
    } finally { setSaving(false); }
  };

  const cancel = () => { setEditing(false); setDraft(""); };

  return (
    <div className="group-notes">
      <div className="gn-header">
        <span className="gn-title"><FileText size={14} /> Notas del grupo</span>
        {!editing ? (
          <button className="gn-edit-btn" onClick={startEditing} title="Editar notas"><Edit3 size={14} /></button>
        ) : (
          <div className="gn-actions">
            <button className="gn-cancel" onClick={cancel}>Cancelar</button>
            <button className="gn-save" onClick={save} disabled={saving}>
              <Save size={12} /> {saving ? "..." : "Guardar"}
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <textarea ref={taRef} className="gn-textarea" value={draft}
          onChange={(e) => setDraft(e.target.value)} placeholder="Escribe notas del grupo aquí: clientes importantes, precios, recordatorios..." rows={5} />
      ) : (
        <div className="gn-content" onClick={startEditing}>
          {notes ? (
            <p className="gn-text">{notes}</p>
          ) : (
            <p className="gn-placeholder">Toca para añadir notas del grupo...</p>
          )}
        </div>
      )}

      {lastEdit && !editing && (
        <div className="gn-meta">Editado por {lastEdit.by} · {new Date(lastEdit.at).toLocaleDateString("es", { day: "numeric", month: "short" })}</div>
      )}

      <style>{`
        .group-notes { border-top: 1.5px solid var(--border); padding-top: 14px; margin-top: 4px; }
        .gn-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
        .gn-title { font-size: 0.73rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.6px; display: flex; align-items: center; gap: 5px; }
        .gn-edit-btn { background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 4px; border-radius: 6px; display: flex; transition: all 0.15s; }
        .gn-edit-btn:hover { color: var(--accent); background: var(--accent-light); }
        .gn-actions { display: flex; gap: 5px; }
        .gn-cancel { background: none; border: 1px solid var(--border); border-radius: 6px; padding: 3px 8px; font-size: 0.75rem; cursor: pointer; color: var(--text-muted); font-family: 'DM Sans', sans-serif; }
        .gn-save { background: var(--accent); color: white; border: none; border-radius: 6px; padding: 3px 10px; font-size: 0.75rem; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; display: flex; align-items: center; gap: 4px; transition: background 0.15s; }
        .gn-save:hover { background: var(--accent-dark); }
        .gn-save:disabled { opacity: 0.6; }
        .gn-textarea { width: 100%; border: 1.5px solid var(--accent-border); border-radius: 10px; padding: 10px; font-size: 0.84rem; font-family: 'DM Sans', sans-serif; background: var(--bg-input); color: var(--text-primary); outline: none; resize: vertical; line-height: 1.6; box-sizing: border-box; }
        .gn-textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-light); }
        .gn-content { cursor: pointer; border: 1.5px dashed var(--border); border-radius: 10px; padding: 10px; min-height: 56px; transition: border-color 0.15s; }
        .gn-content:hover { border-color: var(--accent); }
        .gn-text { font-size: 0.84rem; color: var(--text-primary); white-space: pre-wrap; line-height: 1.6; }
        .gn-placeholder { font-size: 0.82rem; color: var(--text-muted); font-style: italic; }
        .gn-meta { font-size: 0.7rem; color: var(--text-muted); margin-top: 5px; }
      `}</style>
    </div>
  );
}
