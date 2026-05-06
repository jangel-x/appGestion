import { useState, useEffect } from "react";
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, query, where, onSnapshot,
  serverTimestamp, getDoc, arrayUnion, arrayRemove,
  getDocs
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";

// ── GROUPS ──────────────────────────────────────────────────────────────────

export function useGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "groups"), where("members", "array-contains", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setGroups(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [user]);

  const createGroup = async (name) => {
    const ref = await addDoc(collection(db, "groups"), {
      name,
      ownerId: user.uid,
      leaders: [],
      members: [user.uid],
      memberDetails: {
        [user.uid]: { name: user.name, email: user.email, photo: user.photo, color: "#4ade80" }
      },
      createdAt: serverTimestamp(),
    });
    return ref.id;
  };

  const joinGroup = async (groupId) => {
    const ref = doc(db, "groups", groupId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error("Grupo no encontrado");
    await updateDoc(ref, {
      members: arrayUnion(user.uid),
      [`memberDetails.${user.uid}`]: {
        name: user.name, email: user.email, photo: user.photo,
        color: MEMBER_COLORS[Math.floor(Math.random() * MEMBER_COLORS.length)]
      }
    });
  };

  const leaveGroup = async (groupId) => {
    const ref = doc(db, "groups", groupId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data();
    const memberDetails = { ...data.memberDetails };
    delete memberDetails[user.uid];
    await updateDoc(ref, {
      members: arrayRemove(user.uid),
      memberDetails,
    });
  };

  // Solo el dueño puede eliminar el grupo
  const deleteGroup = async (groupId) => {
    const ref = doc(db, "groups", groupId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data();
    if (data.ownerId !== user.uid) throw new Error("Solo el dueño puede eliminar el grupo");

    // Borrar subcolección de citas primero
    const apptSnap = await getDocs(collection(db, "groups", groupId, "appointments"));
    const deletes = apptSnap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletes);

    await deleteDoc(ref);
  };

  // Propagar cambio de nombre a todos los grupos donde el usuario es miembro
  const propagateNameUpdate = async (newName) => {
    if (!user) return;
    const q = query(collection(db, "groups"), where("members", "array-contains", user.uid));
    const snap = await getDocs(q);
    const updates = snap.docs.map((d) =>
      updateDoc(d.ref, { [`memberDetails.${user.uid}.name`]: newName })
    );
    await Promise.all(updates);
  };

  return { groups, createGroup, joinGroup, leaveGroup, deleteGroup, propagateNameUpdate };
}

const MEMBER_COLORS = [
  "#4ade80", "#60a5fa", "#f472b6", "#fb923c", "#a78bfa", "#34d399", "#facc15"
];

// ── APPOINTMENTS ─────────────────────────────────────────────────────────────

export function useAppointments(groupId, filter = "all") {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !groupId) { setLoading(false); return; }
    setLoading(true);

    const q = query(collection(db, "groups", groupId, "appointments"));

    const unsub = onSnapshot(q, (snap) => {
      let all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Filtrar citas privadas de otros
      all = all.filter((a) => a.visibility === "public" || a.createdBy === user.uid);

      if (filter === "mine") {
        all = all.filter((a) => a.createdBy === user.uid);
      } else if (filter !== "all") {
        all = all.filter((a) => a.createdBy === filter);
      }

      all.sort((a, b) => (a.date || "").localeCompare(b.date || ""));

      setAppointments(all);
      setLoading(false);
    });
    return unsub;
  }, [user, groupId, filter]);

  const addAppointment = async (groupId, data) => {
    await addDoc(collection(db, "groups", groupId, "appointments"), {
      ...data,
      createdBy: user.uid,
      createdByName: user.name,
      createdByPhoto: user.photo,
      createdAt: serverTimestamp(),
    });
  };

  const updateAppointment = async (groupId, appointmentId, data) => {
    await updateDoc(doc(db, "groups", groupId, "appointments", appointmentId), data);
  };

  const deleteAppointment = async (groupId, appointmentId) => {
    await deleteDoc(doc(db, "groups", groupId, "appointments", appointmentId));
  };

  return { appointments, loading, addAppointment, updateAppointment, deleteAppointment };
}
