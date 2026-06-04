const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

document.documentElement.classList.add("motion-ready");

const platform = navigator.platform.toLowerCase();
const userAgent = navigator.userAgent.toLowerCase();
const rows = [...document.querySelectorAll(".download-row")];

let preferred = "mac-arm";
if (userAgent.includes("windows")) {
  preferred = "windows";
} else if (platform.includes("macintel")) {
  preferred = navigator.userAgentData ? "mac-arm" : "mac-intel";
}

rows.forEach(row => {
  const active = row.dataset.platform === preferred;
  row.classList.toggle("recommended", active);
  if (active) row.setAttribute("aria-label", `${row.querySelector("strong")?.textContent || "推荐版本"}，推荐下载`);
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
