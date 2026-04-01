let productViews = {
  monitor: {
    label: "Monitorinq",
    title: "Dashboard cihaz, port, risk və Telegram statusunu canlı göstərir",
    badge: "Canlı panel",
    primary: "Open Ports + Risk",
    secondary: "Real-time yenilənmə",
    story:
      "AutoSOC AI əsas dashboard-da cihaz sayını, açıq portları, risk score-u və Telegram vəziyyətini birlikdə göstərir ki, istifadəçi sistemin durumunu dərhal anlaya bilsin.",
    points: ["Canlı dashboard", "Telegram statusu", "Risk score görünüşü"],
  },
  detect: {
    label: "Aşkarlama",
    title: "Nmap skanı və riskli servislər ayrıca görünür",
    badge: "Risk analizi",
    primary: "SMB / RDP / FTP / Telnet",
    secondary: "Nmap əsaslı yoxlama",
    story:
      "Tətbiq təkcə açıq portları göstərmir, həm də hansı servislərin daha riskli olduğunu analiz edir və istifadəçiyə təhlükənin niyə vacib olduğunu başa salır.",
    points: ["Riskli port vurğusu", "Açıq/bağlı/filter xülasəsi", "AI izahı"],
  },
  respond: {
    label: "Reaksiya",
    title: "Portları idarə etmək, alert göndərmək və guard işə salmaq mümkündür",
    badge: "Aktiv müdaxilə",
    primary: "Firewall + Telegram + Guard",
    secondary: "Dərhal əməliyyat",
    story:
      "AutoSOC AI yalnız monitorinq etmir. İstifadəçi portu bağlaya, nəticəni Telegram-da ala və guard vasitəsilə şübhəli trafiki izləyə bilər.",
    points: ["Windows firewall idarəsi", "Telegram bildirişləri", "Scapy guard monitorinqi"],
  },
};

let guideSteps = {
  install: {
    label: "Addım 1",
    title: "AutoSOC-u yükləyin və başladın",
    text:
      "Əsas seçim `AutoSOC.exe` faylıdır. Firewall və bəzi şəbəkə funksiyaları üçün tətbiqi administrator hüquqları ilə açmaq məsləhətdir.",
    points: ["AutoSOC.exe", "Windows mühiti", "Administrator hüquqları"],
  },
  launch: {
    label: "Addım 2",
    title: "Qeydiyyat və login axınını tamamlayın",
    text:
      "Tətbiq login və qeydiyyat pəncərəsi ilə açılır. Hesab yaradarkən Telegram Chat ID əlaqəsi də nəzərə alınır və eyni Chat ID-nin ikinci hesaba bağlanması bloklanır.",
    points: ["Login və qeydiyyat", "1 Chat ID = 1 hesab", "İlkin giriş yoxlaması"],
  },
  connect: {
    label: "Addım 3",
    title: "Telegram və AI parametrlərini qoşun",
    text:
      "Telegram üçün bot yaradın, `/start` ilə Chat ID alın və tokeni `.env` faylına əlavə edin. AI üçün istəyə görə OpenAI açarı və ya lokal Ollama qura bilərsiniz.",
    points: ["TELEGRAM_BOT_TOKEN", "Chat ID bağlantısı", "OpenAI və ya Ollama"],
  },
  scan: {
    label: "Addım 4",
    title: "Port skanını başladın",
    text:
      "Nmap əsasında seçilmiş portları yoxlayın. Tətbiq neçə portun yoxlandığını, hansı portların açıq olduğunu və hansının filter/closed olduğunu xülasə ilə göstərir.",
    points: ["Nmap skanı", "Açıq port siyahısı", "Checked/Open/Filtered xülasəsi"],
  },
  review: {
    label: "Addım 5",
    title: "Risk və AI izahını oxuyun",
    text:
      "SMB, RDP, FTP, Telnet kimi riskli servislər ayrıca qeyd olunur. AI köməkçi bu nəticələrin nə demək olduğunu və hansı remediation addımlarının uyğun olduğunu izah edir.",
    points: ["Riskli servis analizi", "AI remediation tövsiyəsi", "Risk score şərhi"],
  },
  operate: {
    label: "Addım 6",
    title: "Müdaxilə edin və bildirişləri izləyin",
    text:
      "Portları tətbiqin içindən açıb-bağlaya, təhlükə nəticələrini Telegram-a göndərə və Scapy əsaslı guard ilə şübhəli trafiki monitorinq edə bilərsiniz.",
    points: ["Windows firewall əməliyyatı", "Telegram alertləri", "Guard monitorinqi"],
  },
};

const countUps = Array.from(document.querySelectorAll(".count-up"));
const viewButtons = Array.from(document.querySelectorAll(".view-button"));
const guideButtons = Array.from(document.querySelectorAll(".guide-button"));
const faqItems = Array.from(document.querySelectorAll(".faq-item"));

const elements = {
  headerDownloadButton: document.getElementById("headerDownloadButton"),
  heroEyebrow: document.getElementById("heroEyebrow"),
  heroTitle: document.getElementById("heroTitle"),
  heroLead: document.getElementById("heroLead"),
  primaryDownloadButton: document.getElementById("primaryDownloadButton"),
  downloadPanelButton: document.getElementById("downloadPanelButton"),
  downloadTitle: document.getElementById("downloadTitle"),
  downloadCopy: document.getElementById("downloadCopy"),
  releaseMeta: document.getElementById("releaseMeta"),
  faqDownloadAnswer: document.getElementById("faqDownloadAnswer"),
  modeLabel: document.getElementById("modeLabel"),
  consoleTitle: document.getElementById("consoleTitle"),
  consoleBadge: document.getElementById("consoleBadge"),
  screenMetricPrimary: document.getElementById("screenMetricPrimary"),
  screenMetricSecondary: document.getElementById("screenMetricSecondary"),
  screenStory: document.getElementById("screenStory"),
  screenPoints: document.getElementById("screenPoints"),
  guideLabel: document.getElementById("guideLabel"),
  guideTitle: document.getElementById("guideTitle"),
  guideText: document.getElementById("guideText"),
  guidePoints: document.getElementById("guidePoints"),
};

let currentViewKey = "monitor";
let rotateTimer = null;

function formatSize(sizeMb) {
  return `${sizeMb} MB`;
}

function formatCounter(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function animateCounter(element) {
  const target = Number(element.dataset.target);
  const duration = 1200;
  const start = performance.now();

  function frame(time) {
    const progress = Math.min((time - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = formatCounter(target * eased);

    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      element.textContent = formatCounter(target);
    }
  }

  requestAnimationFrame(frame);
}

function setupReveal() {
  const revealItems = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        }
      });
    },
    { threshold: 0.15 }
  );

  revealItems.forEach((item) => observer.observe(item));
}

function setActiveButton(buttons, activeKey, attributeName) {
  buttons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset[attributeName] === activeKey);
  });
}

function renderPoints(container, items) {
  container.innerHTML = "";
  items.forEach((item) => {
    const tag = document.createElement("span");
    tag.textContent = item;
    container.appendChild(tag);
  });
}

function applyView(key) {
  currentViewKey = key;
  const view = productViews[key];

  elements.modeLabel.textContent = view.label;
  elements.consoleTitle.textContent = view.title;
  elements.consoleBadge.textContent = view.badge;
  elements.screenMetricPrimary.textContent = view.primary;
  elements.screenMetricSecondary.textContent = view.secondary;
  elements.screenStory.textContent = view.story;
  renderPoints(elements.screenPoints, view.points);
  setActiveButton(viewButtons, key, "view");
}

function applyGuideStep(key) {
  const step = guideSteps[key];
  elements.guideLabel.textContent = step.label;
  elements.guideTitle.textContent = step.title;
  elements.guideText.textContent = step.text;
  renderPoints(elements.guidePoints, step.points);
  setActiveButton(guideButtons, key, "step");
}

function startViewRotation() {
  const keys = Object.keys(productViews);
  let index = keys.indexOf(currentViewKey);

  if (rotateTimer) {
    window.clearInterval(rotateTimer);
  }

  rotateTimer = window.setInterval(() => {
    index = (index + 1) % keys.length;
    applyView(keys[index]);
  }, 4800);
}

function setupFaq() {
  faqItems.forEach((item) => {
    const button = item.querySelector(".faq-question");
    button.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");
      faqItems.forEach((entry) => entry.classList.remove("is-open"));
      if (!isOpen) {
        item.classList.add("is-open");
      }
    });
  });
}

function setupEvents() {
  viewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      applyView(button.dataset.view);
      startViewRotation();
    });
  });

  guideButtons.forEach((button) => {
    button.addEventListener("click", () => {
      applyGuideStep(button.dataset.step);
    });
  });
}

function applySiteMeta(meta, release) {
  if (meta.hero_eyebrow) {
    elements.heroEyebrow.textContent = meta.hero_eyebrow;
  }

  if (meta.hero_title) {
    elements.heroTitle.textContent = meta.hero_title;
  }

  if (meta.hero_lead) {
    elements.heroLead.textContent = meta.hero_lead;
  }

  if (meta.download_title) {
    elements.downloadTitle.textContent = meta.download_title;
  }

  if (meta.download_copy) {
    elements.downloadCopy.textContent = meta.download_copy;
  }

  if (meta.faq_download) {
    elements.faqDownloadAnswer.textContent = meta.faq_download;
  }

  if (release?.download_url) {
    elements.headerDownloadButton.href = release.download_url;
    elements.primaryDownloadButton.href = release.download_url;
    elements.downloadPanelButton.href = release.download_url;
  }

  if (release?.available) {
    elements.primaryDownloadButton.textContent = `${release.file_name} yüklə`;
    elements.downloadPanelButton.textContent = release.file_name;
    elements.releaseMeta.textContent = `Son fayl: ${release.file_name} • Ölçü: ${formatSize(release.size_mb)} • Yenilənmə: ${release.modified_label}`;
  } else {
    elements.releaseMeta.textContent = release?.message || "Reliz faylı hazır deyil.";
  }
}

async function loadSiteData() {
  try {
    const response = await fetch("/api/site-data", { headers: { Accept: "application/json" } });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();

    if (payload.views) {
      productViews = payload.views;
    }

    if (payload.guide_steps) {
      guideSteps = payload.guide_steps;
    }

    if (payload.meta || payload.release) {
      applySiteMeta(payload.meta || {}, payload.release || null);
    }

    applyView(currentViewKey in productViews ? currentViewKey : Object.keys(productViews)[0]);
    applyGuideStep("install" in guideSteps ? "install" : Object.keys(guideSteps)[0]);
  } catch (error) {
    elements.releaseMeta.textContent = "Server məlumatı alınmadı. Lokal məzmun göstərilir.";
  }
}

async function init() {
  setupReveal();
  countUps.forEach(animateCounter);
  setupEvents();
  setupFaq();
  applyView("monitor");
  applyGuideStep("install");
  await loadSiteData();
  startViewRotation();
}

init();
