import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('--- 🚀 Iniciando Compilación del App Bundle (.aab) ---');

try {
  // 1. Sincronizar Capacitor y Web Assets
  console.log('Sincronizando Capacitor y activos web...');
  execSync('npm run build', { stdio: 'inherit' });
  execSync('npx cap sync android', { stdio: 'inherit' });

  // 2. Compilar el AAB firmado
  console.log('\nCompilando App Bundle (AAB)... Esto puede tardar unos minutos...');
  execSync('cd android && gradlew bundleRelease', { stdio: 'inherit' });

  // 3. Leer versión actual para el renombrado
  const pkgContent = fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8');
  const pkgVersion = JSON.parse(pkgContent).version;
  console.log(`\nVersión detectada: v${pkgVersion}`);

  // 4. Localizar y renombrar el archivo resultante
  const sourceAabPath = path.join(__dirname, '../android/app/build/outputs/bundle/release/app-release.aab');
  const targetAabName = `SkullKingScorer_v${pkgVersion}.aab`;
  const targetAabPath = path.join(__dirname, '../android/app/build/outputs/bundle/release/', targetAabName);

  if (fs.existsSync(sourceAabPath)) {
    fs.renameSync(sourceAabPath, targetAabPath);
    console.log(`\n✅ ¡ÉXITO! App Bundle generado y renombrado a: ${targetAabName}`);
    console.log(`Ubicación: ${targetAabPath}`);
  } else {
    console.error('\n❌ ERROR: No se ha encontrado el archivo base app-release.aab');
    process.exit(1);
  }
} catch (error) {
  console.error('\n❌ ERROR CRÍTICO durante la compilación:', error.message);
  process.exit(1);
}
