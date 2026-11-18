"""Check that the Android APK ships the exact Web assets for offline startup."""
from html.parser import HTMLParser
from pathlib import Path
import sys
from urllib.parse import urlsplit
import zipfile


class AssetReferences(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in {"script", "img"} and attrs.get("src"):
            self.urls.append(attrs["src"])
        if tag == "link" and attrs.get("rel") == "stylesheet":
            self.urls.append(attrs["href"])


web_root, apk = map(Path, sys.argv[1:])
with zipfile.ZipFile(apk) as package:
    entries = set(package.namelist())
    for entry in ("AndroidManifest.xml", "classes.dex", "assets/capacitor.config.json",
                  "assets/public/index.html"):
        if entry not in entries:
            raise SystemExit(f"Missing APK file: {entry}")

    html = AssetReferences()
    html.feed(package.read("assets/public/index.html").decode())
    for url in html.urls:
        path = urlsplit(url)
        if path.scheme or path.netloc:
            raise SystemExit(f"Offline startup relies on an external asset: {url}")
        file = web_root / path.path.lstrip("/")
        if not file.is_file():
            raise SystemExit(f"Missing offline resource referenced by index.html: {url}")

    count = 0
    for file in web_root.rglob("*"):
        if not file.is_file():
            continue
        entry = f"assets/public/{file.relative_to(web_root).as_posix()}"
        if package.read(entry) != file.read_bytes():
            raise SystemExit(f"APK differs from Web build: {entry}")
        count += 1
print(f"Verified {count} embedded Web assets and offline HTML references.")
