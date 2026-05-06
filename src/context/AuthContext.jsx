import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase/config";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
          // Use saved name if exists (user may have changed it)
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

  // Update name locally + in Firestore
  const updateUserName = async (newName) => {
    if (!user || !newName.trim()) return;
    const trimmed = newName.trim();
    await updateDoc(doc(db, "users", user.uid), { name: trimmed });
    setUser((prev) => ({ ...prev, name: trimmed }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout, updateUserName }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
