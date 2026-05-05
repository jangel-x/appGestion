import { useState, useEffect } from "react";
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, query, where, onSnapshot,
  serverTimestamp, getDoc, setDoc, arrayUnion, arrayRemove
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
    await updateDoc(ref, { members: arrayRemove(user.uid) });
  };

  return { groups, createGroup, joinGroup, leaveGroup };
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
    if (!user || !groupId) return;
    setLoading(true);

    // Single query without composite index - filter client-side
    const q = query(
      collection(db, "groups", groupId, "appointments")
    );

    const unsub = onSnapshot(q, (snap) => {
      let all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Filter out private appointments from other users
      all = all.filter((a) => a.visibility === "public" || a.createdBy === user.uid);

      // Apply filter client-side
      if (filter === "mine") {
        all = all.filter((a) => a.createdBy === user.uid);
      } else if (filter !== "all") {
        all = all.filter((a) => a.createdBy === filter);
      }

      // Sort by date client-side
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
