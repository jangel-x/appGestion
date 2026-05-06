import { createContext, useContext, useEffect, useState, useRef } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase/config";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Guardamos ref a propagateNameUpdate para poder llamarla desde aquí
  const propagateRef = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(userRef);
        let userData = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName,
          email: firebaseUser.email,
          photo: firebaseUser.photoURL,
        };
        if (!snap.exists()) {
          await setDoc(userRef, { ...userData, createdAt: new Date().toISOString() });
        } else {
          const saved = snap.data();
          if (saved.name) userData.name = saved.name;
        }
        setUser(userData);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
  const logout = () => signOut(auth);

  // Actualiza nombre en Firestore, en el contexto local,
  // y llama a propagateRef si está disponible (lo registra useGroups)
  const updateUserName = async (newName, propagateFn) => {
    if (!user || !newName.trim()) return;
    const trimmed = newName.trim();
    await updateDoc(doc(db, "users", user.uid), { name: trimmed });
    setUser((prev) => ({ ...prev, name: trimmed }));
    // Propagar a memberDetails de todos los grupos
    if (propagateFn) {
      await propagateFn(trimmed);
    } else if (propagateRef.current) {
      await propagateRef.current(trimmed);
    }
  };

  const registerPropagate = (fn) => {
    propagateRef.current = fn;
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout, updateUserName, registerPropagate }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
