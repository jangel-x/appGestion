# Agenda Equipo 📅

App de agenda compartida para equipos. Calendario con citas públicas/privadas, grupos, filtros y login con Google.

---

## 🚀 Instalación y primer arranque

### 1. Instalar dependencias

```bash
cd agenda-equipo
npm install
```

### 2. Arrancar en modo desarrollo (web)

```bash
npm run dev
```
Abre el navegador en http://localhost:5173

### 3. Arrancar con Electron (escritorio, Linux)

```bash
npm run electron:dev
```

---

## 📦 Compilar la app

### Linux (.AppImage y .deb)

```bash
npm run dist:linux
```
El archivo se genera en `dist-electron/`

### Windows (.exe)

```bash
npm run dist:win
```
> Nota: para compilar .exe desde Linux necesitas instalar `wine`:
> ```bash
> sudo dnf install wine  # en Nobara/Fedora
> ```

---

## 🔧 Configuración Firebase (ya está configurado)

Las credenciales ya están en `src/firebase/config.js`.

### Reglas de seguridad Firestore (copiar en Firebase Console → Firestore → Reglas)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /groups/{groupId} {
      allow read: if request.auth != null && request.auth.uid in resource.data.members;
      allow create: if request.auth != null;
      allow update: if request.auth != null && request.auth.uid in resource.data.members;
    }
    match /groups/{groupId}/appointments/{apptId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

---

## 📱 APK Android (con Capacitor)

### Instalar Capacitor

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Agenda Equipo" "com.agendaequipo.app"
npm run build
npx cap add android
npx cap sync
```

### Abrir en Android Studio

```bash
npx cap open android
```
Desde Android Studio: Build → Generate Signed APK

---

## 🏗️ Estructura del proyecto

```
agenda-equipo/
├── electron/
│   └── main.js          # Proceso principal de Electron
├── src/
│   ├── components/
│   │   ├── Calendar.jsx          # Calendario mensual
│   │   ├── AppointmentModal.jsx  # Modal nueva/editar cita
│   │   └── GroupPanel.jsx        # Panel de grupos
│   ├── context/
│   │   └── AuthContext.jsx       # Estado de autenticación
│   ├── firebase/
│   │   └── config.js             # Configuración Firebase
│   ├── hooks/
│   │   └── useFirestore.js       # Hooks para Firestore
│   ├── pages/
│   │   ├── LoginPage.jsx         # Pantalla de login
│   │   └── Dashboard.jsx         # Pantalla principal
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── vite.config.js
└── package.json
```
