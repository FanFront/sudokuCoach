#!/usr/bin/env bash
# Build the offline APK using the pinned Capacitor Android template.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"
npm run build
test -s dist/index.html
cd android
npm ci --no-audit --no-fund
if [[ ! -f android/gradlew ]]; then
  ./node_modules/.bin/cap add android
fi
./node_modules/.bin/cap sync android

version_name="$(node -p "require('../package.json').version")"
sed -i -E "s/versionName \"[^\"]*\"/versionName \"$version_name\"/" android/app/build.gradle
native=android/app/src/main
cp -R branding/. "$native/res/"
# Capacitor's generated manifest initially references its stock launcher icons.
sed -i -e 's|@mipmap/ic_launcher_round|@drawable/jiuge_mark|g' \
       -e 's|@mipmap/ic_launcher|@drawable/jiuge_mark|g' "$native/AndroidManifest.xml"
# The running app references only local content. Remove the stock artwork left
# over from the pinned template to keep the installation small.
find "$native/res" -type f -name 'splash.png' -delete

cd android
./gradlew :app:assembleDebug
apk=app/build/outputs/apk/debug/app-debug.apk
output_dir="$root/android/output"
mkdir -p "$output_dir"
cp "$apk" "$output_dir/jiuge-sudoku-coach.apk"
python3 "$root/scripts/android-verify.py" "$root/dist" "$apk"
printf 'APK: %s\n' "$output_dir/jiuge-sudoku-coach.apk"
