const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

document.documentElement.classList.add("motion-ready");

const platform = navigator.platform.toLowerCase();
const userAgent = navigator.userAgent.toLowerCase();
const rows = [...document.querySelectorAll(".download-row")];
const downloadDetect = document.getElementById("download-detect");

const recommendationText = {
  "mac-arm": "已根据当前设备推荐 macOS Apple Silicon。若你的 Mac 是 Intel 芯片，请选择 Intel 版本。",
  "mac-intel": "已根据当前设备推荐 macOS Intel。Apple Silicon 机型请选择 Apple Silicon 版本。",
  windows: "已根据当前设备推荐 Windows x64。"
};

async function detectPreferredDownload() {
  if (navigator.userAgentData?.getHighEntropyValues) {
    try {
      const hints = await navigator.userAgentData.getHighEntropyValues(["platform", "architecture"]);
      const hintedPlatform = String(hints.platform || "").toLowerCase();
      const architecture = String(hints.architecture || "").toLowerCase();

      if (hintedPlatform.includes("windows")) return "windows";
      if (hintedPlatform.includes("mac")) {
        if (architecture.includes("arm") || architecture.includes("aarch64")) return "mac-arm";
        if (architecture.includes("x86") || architecture.includes("amd64")) return "mac-intel";
        return "mac-arm";
      }
    } catch {
      // Browser privacy settings can block high-entropy hints; fall back to UA parsing.
    }
  }

  if (userAgent.includes("windows") || platform.includes("win")) return "windows";
  if (userAgent.includes("mac") || platform.includes("mac")) return "mac-arm";
  return "mac-arm";
}

function applyDownloadRecommendation(preferred) {
  rows.forEach(row => {
    const active = row.dataset.platform === preferred;
    row.classList.toggle("recommended", active);
    if (active) {
      row.setAttribute("aria-label", `${row.querySelector("strong")?.textContent || "推荐版本"}，推荐下载`);
    } else {
      row.removeAttribute("aria-label");
    }
  });

  if (downloadDetect) {
    downloadDetect.textContent = recommendationText[preferred] || recommendationText["mac-arm"];
  }
}

detectPreferredDownload().then(applyDownloadRecommendation);

rows.forEach(row => {
  row.addEventListener("click", () => {
    rows.forEach(item => item.classList.remove("is-pressed"));
    row.classList.add("is-pressed");
    window.setTimeout(() => row.classList.remove("is-pressed"), 420);
  });
});

const revealTargets = [
  ...document.querySelectorAll(".intro-band, .section-heading, .feature-card, .workflow-copy, .workflow-list li, .download-copy, .download-panel")
];

revealTargets.forEach((item, index) => {
  item.classList.add("reveal");
  item.style.transitionDelay = `${Math.min(index % 6, 5) * 55}ms`;
});

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: .12, rootMargin: "0px 0px -8% 0px" });

revealTargets.forEach(item => revealObserver.observe(item));

const parallaxItems = [...document.querySelectorAll("[data-parallax]")];
const hero = document.querySelector(".hero");

if (hero && parallaxItems.length && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  hero.addEventListener("pointermove", event => {
    const rect = hero.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - .5;
    const y = (event.clientY - rect.top) / rect.height - .5;
    parallaxItems.forEach(item => {
      const depth = Number(item.dataset.parallax || 20);
      item.style.setProperty("--px", `${x * depth}px`);
      item.style.setProperty("--py", `${y * depth}px`);
    });
  });

  hero.addEventListener("pointerleave", () => {
    parallaxItems.forEach(item => {
      item.style.setProperty("--px", "0px");
      item.style.setProperty("--py", "0px");
    });
  });
}
