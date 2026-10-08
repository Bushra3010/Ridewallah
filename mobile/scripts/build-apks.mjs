// Builds both APKs: syncs the Capacitor config into each Android project, runs Gradle, and copies the
// results to mobile/dist/. Needs JDK 21 and the Android SDK (found via JAVA_HOME / ANDROID_HOME, or the
// usual macOS locations). Run: npm run apk            (debug, installable for testing)
//                              npm run apk -- release (unsigned release builds, for signing)
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const mobile = path.resolve(here, "..");
const release = process.argv.includes("release");
const home = os.homedir();

const findJdk = () => {
  if (process.env.JAVA_HOME) return process.env.JAVA_HOME;
  const base = path.join(home, "Library/Java");
  const jdk = fs.existsSync(base) && fs.readdirSync(base).filter((d) => /^jdk-21/.test(d)).sort().pop();
  if (!jdk) throw new Error("JDK 21 not found — set JAVA_HOME");
  return path.join(base, jdk, "Contents/Home");
};
const env = {
  ...process.env,
  JAVA_HOME: findJdk(),
  ANDROID_HOME: process.env.ANDROID_HOME ?? path.join(home, "Library/Android/sdk"),
  // The Capacitor CLI needs Node 22+; use ~/.local/node22 if the default node is older.
  PATH: [fs.existsSync(path.join(home, ".local/node22/bin")) && path.join(home, ".local/node22/bin"), process.env.PATH].filter(Boolean).join(":"),
};
const run = (cmd, cwd) => execSync(cmd, { cwd, env, stdio: "inherit" });

fs.mkdirSync(path.join(mobile, "dist"), { recursive: true });
for (const [app, label] of [["customer", "Ridewallah-Customer"], ["rider", "Ridewallah-Rider"]]) {
  const dir = path.join(mobile, app);
  run("npx cap sync android", dir);
  run(`./gradlew --no-daemon ${release ? "assembleRelease" : "assembleDebug"}`, path.join(dir, "android"));
  const variant = release ? "release" : "debug";
  const out = path.join(dir, "android/app/build/outputs/apk", variant);
  const apk = fs.readdirSync(out).find((f) => f.endsWith(".apk"));
  const dest = path.join(mobile, "dist", `${label}-${variant}.apk`);
  fs.copyFileSync(path.join(out, apk), dest);
  console.log(`\n✔ ${dest} (${(fs.statSync(dest).size / 1e6).toFixed(1)} MB)\n`);
}
