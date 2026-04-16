# Skull King Scorer 🏴‍☠️

El compañero digital definitivo para tus partidas de **Skull King**. Esta aplicación permite llevar la puntuación de forma automática, eliminando la necesidad de papel y lápiz, y facilitando los cálculos complejos de bonificaciones y penalizaciones.

## ✨ Características Principales

- **Modo Local (Pass & Play):** Comparte un solo dispositivo con toda tu tripulación.
- **Modo Online:** Crea salas y sincroniza las apuestas de todos los jugadores en tiempo real mediante Firebase.
- **Cálculo Automático:** Puntuaciones precisas incluyendo reglas especiales de expansiones (Kraken, Ballena Blanca, Botín, etc.).
- **Diseño Premium:** Interfaz náutica inmersiva, modo oscuro y retroalimentación háptica.
- **Seguridad Blindada:** Protección nativa contra inyecciones XSS y límites de carga en base de datos.

## 🛠️ Tecnologías

- **Frontend:** React + Vite + Tailwind CSS.
- **Backend:** Firebase (Firestore & Authentication).
- **Mobile:** Capacitor (Haptics, Keep Awake).
- **Testing:** Playwright.

## 🚀 Instalación y Desarrollo

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/JavierMorilla/skull-king-scorer.git
   ```
2. **Instalar dependencias:**
   ```bash
   npm install
   ```
3. **Ejecutar en local:**
   ```bash
   npm run dev
   ```

## 📱 Compilación Android

Para generar una versión de producción (.aab) para la Play Store:
```bash
node scripts/build-aab.js
```
El archivo resultante se encontrará en `android/app/build/outputs/bundle/release/`.

---

*Nota: Esta es una herramienta no oficial y no está afiliada a Grandpa Beck's Games.*
