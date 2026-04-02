# 🏴‍☠️ Skull King Scorer

Una aplicación web moderna y en tiempo real diseñada para llevar las puntuaciones y gestionar las partidas del popular juego de cartas **Skull King**.

Desarrollada con React, TypeScript y Vite, esta aplicación permite a los jugadores crear salas, unirse a partidas, registrar sus apuestas y calcular automáticamente las puntuaciones, todo sincronizado en tiempo real gracias a Firebase.

## ✨ Características Principales

- **Gestión de Salas (Lobby):** Crea una nueva partida o únete a una existente en tiempo real.
- **Sistema de Apuestas:** Interfaz intuitiva para registrar las apuestas de cada jugador en cada ronda.
- **Cálculo Automático (Scorer):** Calcula automáticamente los puntos basados en las reglas de Skull King.
- **Tabla de Clasificación (Leaderboard):** Visualiza quién va ganando en tiempo real.
- **Sincronización en la Nube:** Firebase Firestore mantiene sincronizados los dispositivos de todos los jugadores sin necesidad de recargar.
- **Diseño Responsivo:** Creado con TailwindCSS para verse perfecto tanto en móviles como en PC.

## 🛠️ Tecnologías Utilizadas

- **Frontend:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Estilos:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Backend / Base de Datos:** [Firebase Firestore & Auth](https://firebase.google.com/)
- **Inteligencia Artificial:** [@google/genai](https://ai.google.dev/) (Gemini API)
- **Iconos y Animaciones:** Lucide React & Motion

## 🚀 Instalación y Configuración Local

Sigue estos pasos para ejecutar el proyecto en tu entorno local:

### 1. Clonar el repositorio
```bash
git clone [https://github.com/JavierMorilla/skull-king-scorer.git](https://github.com/JavierMorilla/skull-king-scorer.git)
cd skull-king-scorer
```

### 2. Instalar las dependencias
```bash
npm install
```

### 4. Iniciar el servidor de desarrollo
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

## 📱 Convertir en Aplicación Móvil (APK)

Este proyecto está preparado para ser encapsulado fácilmente en una aplicación nativa para Android usando **Capacitor**. 

1. Asegúrate de tener configurado tu `.env.local` con tus variables.
2. Construye el proyecto para producción:
```bash
npm run build
```

3. Instala e inicializa Capacitor (si no lo has hecho):
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init
npx cap add android
```

4. Sincroniza y abre en Android Studio para generar la APK:
```bash
npx cap sync
npx cap open android
```

## 📜 Scripts Disponibles

En el directorio del proyecto, puedes ejecutar:

- `npm run dev`: Inicia el servidor de desarrollo.
- `npm run build`: Construye la aplicación lista para producción en la carpeta `dist`.
- `npm run preview`: Previsualiza la build de producción localmente.
- `npm run lint`: Ejecuta el linter de TypeScript para buscar errores en el código.

## 🤝 Contribución

Si deseas contribuir a este proyecto, siéntete libre de hacer un *fork* del repositorio y enviar tus *pull requests*. Toda ayuda para mejorar el anotador es bienvenida.

---
**Creado por Javier Morilla**
