import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('--- Iniciando compilación de APK inteligente ---');

try {
  console.log('Sincronizando Capacitor y construyendo APK (por favor, espera de 1 a 2 minutos)...');
  execSync('npm run android:sync', { stdio: 'inherit' });
  execSync('cd android && gradlew assembleDebug', { stdio: 'inherit' });

  // 2. Leer versión actual
  const pkgContent = fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8');
  const pkgVersion = JSON.parse(pkgContent).version;
  console.log(`\nVersión actual leída: v${pkgVersion}`);

  // 3. Renombrar archivo resultante
  const sourceApkPath = path.join(__dirname, '../android/app/build/outputs/apk/debug/app-debug.apk');
  const targetApkName = `SkullKingScorer_v${pkgVersion}.apk`;
  const targetApkPath = path.join(__dirname, '../android/app/build/outputs/apk/debug/', targetApkName);

  if (fs.existsSync(sourceApkPath)) {
    fs.renameSync(sourceApkPath, targetApkPath);
    console.log(`\n✅ ¡ÉXITO! APK Generado y renombrado a: ${targetApkName}`);
  } else {
    console.error('\n❌ ERROR: No se ha encontrado el archivo base app-debug.apk');
    process.exit(1);
  }
} catch (error) {
  console.error('\n❌ ERROR CRÍTICO durante la compilación:', error.message);
  process.exit(1);
}
