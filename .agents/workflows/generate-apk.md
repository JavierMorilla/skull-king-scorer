---
description: Generar APK de Android
---

# Workflow: Construir e Inspeccionar APK

Este flujo de trabajo generará automáticamente la APK de Android basándose siempre en tu código más reciente. 
Antes de generar el código, yo evaluaré los últimos cambios que has hecho y **determinaré si hace falta incrementar la versión de la aplicación** (X.Y.Z) antes de compilarla (nunca siendo 1.0.0).

1. Como agente IA, determinaré si debo actualizar la app subiendo de forma oculta la versión si ha habido cambios relevantes, usando el comando nativo `npm version [patch/minor] --no-git-tag-version`.

2. Luego llamaré al script general centralizado que empaquetará, sincronizará y mandará construir la app, además de renombrar de forma fiable la APK con la versión asignada en `package.json`.

// turbo
```bash
npm run android:build:debug
```

3. Abrir el explorador de Windows directamente en el destino del archivo generado (`SkullKingScorer_vX.Y.Z.apk`) para que lo copies a tu móvil u otro dispositivo de prueba.

// turbo
```bash
explorer "android\app\build\outputs\apk\debug"
```
