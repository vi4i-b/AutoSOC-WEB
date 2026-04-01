import hashlib
import json
import mimetypes
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parent
APP_ROOT = ROOT.parent / "AutoSOC"
DIST_DIR = APP_ROOT / "dist"


SITE_DATA = {
    "meta": {
        "hero_eyebrow": "Desktop Cyber Assistant",
        "hero_title": "AutoSOC AI ilə şəbəkə risklərini görün, portları idarə edin və bildirişləri dərhal alın.",
        "hero_lead": (
            "AutoSOC AI kiçik komandalar, startaplar, tələbə layihələri və lokal administratorlar üçün "
            "hazırlanmış masaüstü kibertəhlükəsizlik köməkçisidir. Tətbiq Nmap əsaslı port skanı, riskli "
            "servis analizi, Windows firewall idarəsi, Telegram bildirişləri və AI izah qatını bir pəncərədə birləşdirir."
        ),
        "download_title": "Windows üçün yükləmə",
        "download_copy": "AutoSOC-u yükləmək və işə salmaq üçün əsas fayl AutoSOC.exe-dir. Adi istifadəçi üçün bu fayl kifayətdir.",
        "faq_download": "Əsas yükləmə düyməsi birbaşa son AutoSOC.exe faylını açır və adi istifadə üçün məhz bu fayl nəzərdə tutulub.",
    },
    "views": {
        "monitor": {
            "label": "Monitorinq",
            "title": "Dashboard cihaz, port, risk və Telegram statusunu canlı göstərir",
            "badge": "Canlı panel",
            "primary": "Open Ports + Risk",
            "secondary": "Real-time yenilənmə",
            "story": "AutoSOC AI əsas dashboard-da cihaz sayını, açıq portları, risk score-u və Telegram vəziyyətini birlikdə göstərir ki, istifadəçi sistemin durumunu dərhal anlaya bilsin.",
            "points": ["Canlı dashboard", "Telegram statusu", "Risk score görünüşü"],
        },
        "detect": {
            "label": "Aşkarlama",
            "title": "Nmap skanı və riskli servislər ayrıca görünür",
            "badge": "Risk analizi",
            "primary": "SMB / RDP / FTP / Telnet",
            "secondary": "Nmap əsaslı yoxlama",
            "story": "Tətbiq təkcə açıq portları göstərmir, həm də hansı servislərin daha riskli olduğunu analiz edir və istifadəçiyə təhlükənin niyə vacib olduğunu başa salır.",
            "points": ["Riskli port vurğusu", "Açıq/bağlı/filter xülasəsi", "AI izahı"],
        },
        "respond": {
            "label": "Reaksiya",
            "title": "Portları idarə etmək, alert göndərmək və guard işə salmaq mümkündür",
            "badge": "Aktiv müdaxilə",
            "primary": "Firewall + Telegram + Guard",
            "secondary": "Dərhal əməliyyat",
            "story": "AutoSOC AI yalnız monitorinq etmir. İstifadəçi portu bağlaya, nəticəni Telegram-da ala və guard vasitəsilə şübhəli trafiki izləyə bilər.",
            "points": ["Windows firewall idarəsi", "Telegram bildirişləri", "Scapy guard monitorinqi"],
        },
    },
    "guide_steps": {
        "install": {
            "label": "Addım 1",
            "title": "AutoSOC-u yükləyin və başladın",
            "text": "Əsas seçim AutoSOC.exe faylıdır. Firewall və bəzi şəbəkə funksiyaları üçün tətbiqi administrator hüquqları ilə açmaq məsləhətdir.",
            "points": ["AutoSOC.exe", "Windows mühiti", "Administrator hüquqları"],
        },
        "launch": {
            "label": "Addım 2",
            "title": "Qeydiyyat və login axınını tamamlayın",
            "text": "Tətbiq login və qeydiyyat pəncərəsi ilə açılır. Hesab yaradarkən Telegram Chat ID əlaqəsi də nəzərə alınır və eyni Chat ID-nin ikinci hesaba bağlanması bloklanır.",
            "points": ["Login və qeydiyyat", "1 Chat ID = 1 hesab", "İlkin giriş yoxlaması"],
        },
        "connect": {
            "label": "Addım 3",
            "title": "Telegram və AI parametrlərini qoşun",
            "text": "Telegram üçün bot yaradın, /start ilə Chat ID alın və tokeni .env faylına əlavə edin. AI üçün istəyə görə OpenAI açarı və ya lokal Ollama qura bilərsiniz.",
            "points": ["TELEGRAM_BOT_TOKEN", "Chat ID bağlantısı", "OpenAI və ya Ollama"],
        },
        "scan": {
            "label": "Addım 4",
            "title": "Port skanını başladın",
            "text": "Nmap əsasında seçilmiş portları yoxlayın. Tətbiq neçə portun yoxlandığını, hansı portların açıq olduğunu və hansının filter və ya closed olduğunu xülasə ilə göstərir.",
            "points": ["Nmap skanı", "Açıq port siyahısı", "Checked/Open/Filtered xülasəsi"],
        },
        "review": {
            "label": "Addım 5",
            "title": "Risk və AI izahını oxuyun",
            "text": "SMB, RDP, FTP, Telnet kimi riskli servislər ayrıca qeyd olunur. AI köməkçi bu nəticələrin nə demək olduğunu və hansı remediation addımlarının uyğun olduğunu izah edir.",
            "points": ["Riskli servis analizi", "AI remediation tövsiyəsi", "Risk score şərhi"],
        },
        "operate": {
            "label": "Addım 6",
            "title": "Müdaxilə edin və bildirişləri izləyin",
            "text": "Portları tətbiqin içindən açıb-bağlaya, təhlükə nəticələrini Telegram-a göndərə və Scapy əsaslı guard ilə şübhəli trafiki monitorinq edə bilərsiniz.",
            "points": ["Windows firewall əməliyyatı", "Telegram alertləri", "Guard monitorinqi"],
        },
    },
}


def json_bytes(payload):
    return json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")


def sha256_for(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file_handle:
        for chunk in iter(lambda: file_handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def latest_executable() -> Path | None:
    if DIST_DIR.exists():
        executables = sorted(DIST_DIR.glob("*.exe"), key=lambda item: item.stat().st_mtime, reverse=True)
        if executables:
            return executables[0]

    local_exe = ROOT / "AutoSOC.exe"
    return local_exe if local_exe.exists() else None


def optional_file(name: str) -> Path | None:
    candidate = DIST_DIR / name
    if candidate.exists():
        return candidate
    local_candidate = ROOT / name
    return local_candidate if local_candidate.exists() else None


def release_payload() -> dict:
    latest = latest_executable()
    if not latest:
        return {
            "available": False,
            "message": "AutoSOC.exe tapılmadı",
            "download_url": "/download/latest",
        }

    stats = latest.stat()
    modified = datetime.fromtimestamp(stats.st_mtime, tz=timezone.utc).astimezone()
    payload = {
        "available": True,
        "file_name": latest.name,
        "size_bytes": stats.st_size,
        "size_mb": round(stats.st_size / (1024 * 1024), 2),
        "modified_at": modified.isoformat(),
        "modified_label": modified.strftime("%d.%m.%Y %H:%M"),
        "sha256": sha256_for(latest),
        "download_url": "/download/latest",
    }

    portable = optional_file("AutoSOC_Portable.zip")
    if portable:
        payload["portable_url"] = "/download/AutoSOC_Portable.zip"

    shield = optional_file("AutoSOC_Shield.exe")
    if shield:
        payload["shield_url"] = "/download/AutoSOC_Shield.exe"

    return payload


class AutoSOCSiteHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_json(self, payload: dict, status: int = HTTPStatus.OK):
        content = json_bytes(payload)
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(content)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(content)

    def send_download(self, path: Path):
        mime, _ = mimetypes.guess_type(path.name)
        data = path.read_bytes()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", mime or "application/octet-stream")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Content-Disposition", f'attachment; filename="{path.name}"')
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        parsed = urlparse(self.path)
        route = parsed.path

        if route == "/api/health":
            self.end_json(
                {
                    "status": "ok",
                    "service": "autosoc-web",
                    "timestamp": datetime.now().isoformat(),
                    "release": release_payload(),
                }
            )
            return

        if route == "/api/site-data":
            payload = {
                **SITE_DATA,
                "release": release_payload(),
            }
            self.end_json(payload)
            return

        if route == "/download/latest":
            latest = latest_executable()
            if not latest:
                self.end_json({"error": "AutoSOC.exe tapılmadı"}, HTTPStatus.NOT_FOUND)
                return
            self.send_download(latest)
            return

        if route.startswith("/download/"):
            filename = route.split("/download/", 1)[1]
            allowed = {"AutoSOC_Portable.zip", "AutoSOC_Shield.exe", "AutoSOC.exe"}
            if filename not in allowed:
                self.end_json({"error": "Fayl tapılmadı"}, HTTPStatus.NOT_FOUND)
                return

            file_path = latest_executable() if filename == "AutoSOC.exe" else optional_file(filename)
            if not file_path or not file_path.exists():
                self.end_json({"error": "Fayl tapılmadı"}, HTTPStatus.NOT_FOUND)
                return

            self.send_download(file_path)
            return

        if route == "/":
            self.path = "/index.html"

        return super().do_GET()


def run_server(host: str = "127.0.0.1", port: int = 8000):
    server = ThreadingHTTPServer((host, port), AutoSOCSiteHandler)
    print(f"AutoSOC web server running on http://{host}:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
    finally:
        server.server_close()


if __name__ == "__main__":
    run_server()
