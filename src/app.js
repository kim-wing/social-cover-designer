const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const stage = document.getElementById("stage");
const selectionOverlay = document.getElementById("selectionOverlay");
const inlineTextEditor = document.getElementById("inlineTextEditor");
const STORAGE_KEY = "social-cover-designer-v3";
const IMAGE_API_KEY_STORAGE = "youdesign-openai-image-api-key";
const UNSPLASH_ACCESS_KEY_STORAGE = "youdesign-unsplash-access-key";
const UNSPLASH_API_BASE = "https://api.unsplash.com";
const UNSPLASH_KEY_HELP_URL = "https://unsplash.com/developers";
const OPENAI_IMAGE_API_BASE = "https://api.openai.com/v1";
const APP_SCRIPT_URL = new URL("src/app.js", document.baseURI).href;
const TRANSFORMERS_LOCAL_BASE = new URL("../vendor/transformers/", APP_SCRIPT_URL).href;
const TRANSFORMERS_CDN_BASE = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.2/dist/";
const TRANSFORMERS_MODULES = [
  { url: `${TRANSFORMERS_LOCAL_BASE}transformers.min.js`, wasmBase: TRANSFORMERS_LOCAL_BASE },
  { url: `${TRANSFORMERS_CDN_BASE}transformers.min.js`, wasmBase: TRANSFORMERS_CDN_BASE }
];
const RMBG_MODEL_ID = "briaai/RMBG-1.4";
const APP_VERSION = "__YOUDESIGN_APP_VERSION__".startsWith("__") ? "1.0.17" : "__YOUDESIGN_APP_VERSION__";
const MAX_EXPORT_PIXELS = 64 * 1000 * 1000;

const iconPaths = {
  add: "M11 11V5H13V11H19V13H13V19H11V13H5V11H11Z",
  image: "M21 19V5H3V19H21ZM23 3V21H1V3H23ZM8.5 11.5L5 16H19L14.5 10L11 14.5L8.5 11.5ZM8 10C6.895 10 6 9.105 6 8S6.895 6 8 6S10 6.895 10 8S9.105 10 8 10Z",
  text: "M13 6V21H11V6H5V4H19V6H13Z",
  mascot: "M12 2C16.418 2 20 5.582 20 10V17C20 19.761 17.761 22 15 22H9C6.239 22 4 19.761 4 17V10C4 5.582 7.582 2 12 2ZM8.8 13.2C8.137 13.2 7.6 13.737 7.6 14.4S8.137 15.6 8.8 15.6S10 15.063 10 14.4S9.463 13.2 8.8 13.2ZM15.2 13.2C14.537 13.2 14 13.737 14 14.4S14.537 15.6 15.2 15.6S16.4 15.063 16.4 14.4S15.863 13.2 15.2 13.2ZM12 5C9.239 5 7 7.239 7 10H17C17 7.239 14.761 5 12 5Z",
  shape: "M12 2L22 20H2L12 2ZM12 6.17L5.4 18H18.6L12 6.17Z",
  logo: "M12 2L20.66 7V17L12 22L3.34 17V7L12 2ZM12 4.31L5.34 8.15V15.85L12 19.69L18.66 15.85V8.15L12 4.31Z",
  tools: "M21.71 20.29L20.29 21.71L14 15.41V13.99L13.5 13.49C12.45 14.34 11.11 14.85 9.65 14.85C6.25 14.85 3.5 12.1 3.5 8.7C3.5 5.3 6.25 2.55 9.65 2.55C13.05 2.55 15.8 5.3 15.8 8.7C15.8 10.16 15.29 11.5 14.44 12.55L21.71 20.29ZM9.65 4.55C7.36 4.55 5.5 6.41 5.5 8.7S7.36 12.85 9.65 12.85S13.8 10.99 13.8 8.7S11.94 4.55 9.65 4.55Z",
  ruler: "M3 4H21V20H3V4ZM5 6V18H19V6H17V10H15V6H13V9H11V6H9V10H7V6H5Z",
  undo: "M8 7V3L1 10L8 17V13H14C17.314 13 20 15.686 20 19H22C22 14.582 18.418 11 14 11H8V7Z",
  redo: "M16 7V3L23 10L16 17V13H10C6.686 13 4 15.686 4 19H2C2 14.582 5.582 11 10 11H16V7Z",
  copy: "M7 7V3C7 2.448 7.448 2 8 2H20C20.552 2 21 2.448 21 3V15C21 15.552 20.552 16 20 16H16V20C16 20.552 15.552 21 15 21H4C3.448 21 3 20.552 3 20V8C3 7.448 3.448 7 4 7H7ZM9 7H15C15.552 7 16 7.448 16 8V14H19V4H9V7ZM5 9V19H14V9H5Z",
  delete: "M17 6H22V8H20V21C20 21.552 19.552 22 19 22H5C4.448 22 4 21.552 4 21V8H2V6H7V3C7 2.448 7.448 2 8 2H16C16.552 2 17 2.448 17 3V6ZM9 4V6H15V4H9ZM6 8V20H18V8H6ZM9 11H11V17H9V11ZM13 11H15V17H13V11Z",
  selectAll: "M4 4H20V6H6V20H4V4ZM8 8H22V22H8V8ZM10 10V20H20V10H10Z",
  export: "M13 10H18L12 16L6 10H11V3H13V10ZM4 19H20V14H22V20C22 20.552 21.552 21 21 21H3C2.448 21 2 20.552 2 20V14H4V19Z",
  refresh: "M17.65 6.35C16.2 4.9 14.21 4 12 4C7.58 4 4.01 7.58 4.01 12S7.58 20 12 20C15.73 20 18.84 17.45 19.73 14H17.65C16.82 16.33 14.6 18 12 18C8.69 18 6 15.31 6 12S8.69 6 12 6C13.66 6 15.14 6.69 16.22 7.78L13 11H20V4L17.65 6.35Z",
  upload: "M13 5.829V16H11V5.829L7.05 9.778L5.636 8.364L12 2L18.364 8.364L16.95 9.778L13 5.828ZM4 18H20V13H22V19C22 19.552 21.552 20 21 20H3C2.448 20 2 19.552 2 19V13H4V18Z",
  rect: "M4 5H20C20.552 5 21 5.448 21 6V18C21 18.552 20.552 19 20 19H4C3.448 19 3 18.552 3 18V6C3 5.448 3.448 5 4 5ZM5 7V17H19V7H5Z",
  circle: "M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2S22 6.477 22 12S17.523 22 12 22ZM12 20C16.418 20 20 16.418 20 12S16.418 4 12 4S4 7.582 4 12S7.582 20 12 20Z",
  line: "M4 11H20V13H4V11Z",
  overlay: "M4 4H20V20H4V4ZM6 6V18H18V6H6ZM8 8H16V16H8V8Z",
  alignLeft: "M4 4H6V20H4V4ZM8 6H20V8H8V6ZM8 11H16V13H8V11ZM8 16H20V18H8V16Z",
  alignCenter: "M11 4H13V7H20V9H13V11H18V13H13V15H20V17H13V20H11V17H4V15H11V13H6V11H11V9H4V7H11V4Z",
  alignRight: "M18 4H20V20H18V4ZM4 6H16V8H4V6ZM8 11H16V13H8V11ZM4 16H16V18H4V16Z",
  objectAlignLeft: "M4 3H6V21H4V3ZM9 7H20V17H9V7ZM11 9V15H18V9H11Z",
  objectAlignCenter: "M11 3H13V6H20V18H13V21H11V18H4V6H11V3ZM6 8V16H18V8H6Z",
  objectAlignRight: "M18 3H20V21H18V3ZM4 7H15V17H4V7ZM6 9V15H13V9H6Z",
  textAlignLeft: "M4 5H20V7H4V5ZM4 9H16V11H4V9ZM4 13H20V15H4V13ZM4 17H14V19H4V17Z",
  textAlignCenter: "M4 5H20V7H4V5ZM7 9H17V11H7V9ZM4 13H20V15H4V13ZM8 17H16V19H8V17Z",
  textAlignRight: "M4 5H20V7H4V5ZM8 9H20V11H8V9ZM4 13H20V15H4V13ZM10 17H20V19H10V17Z",
  layerUp: "M12 2L22 8L12 14L2 8L12 2ZM12 4.332L5.887 8L12 11.668L18.113 8L12 4.332ZM2 12L4 10.8L12 15.6L20 10.8L22 12L12 18L2 12ZM2 16L4 14.8L12 19.6L20 14.8L22 16L12 22L2 16Z"
};

const basiconNames = {
  add: "plus",
  image: "image",
  text: "text",
  mascot: "face",
  shape: "triangle",
  logo: "diamond",
  tools: "search",
  ruler: "ruler",
  undo: "undo",
  redo: "redo",
  copy: "copy",
  delete: "trash",
  selectAll: "select-all",
  export: "download",
  refresh: "refresh",
  upload: "upload",
  rect: "square",
  circle: "circle",
  line: "minus",
  overlay: "layers",
  alignLeft: "align-left",
  alignCenter: "align-center",
  alignRight: "align-right",
  objectAlignLeft: "align-left",
  objectAlignCenter: "align-center",
  objectAlignRight: "align-right",
  textAlignLeft: "text-align-left",
  textAlignCenter: "text-align-center",
  textAlignRight: "text-align-right",
  layerUp: "layers",
  badge: "tag",
  number: "hash",
  crop: "crop",
  boolean: "intersect"
};

const iconPathAliases = {
  badge: "rect",
  number: "text",
  verticalText: "text",
  cornerBadge: "rect",
  topBadge: "selectAll",
  crop: "image",
  boolean: "shape"
};

const basiconSvg = {
  add: '<path d="M12 5v14"></path><path d="M5 12h14"></path>',
  image: '<rect x="3.5" y="5" width="17" height="14" rx="2"></rect><circle cx="8.2" cy="9.2" r="1.4"></circle><path d="m4.5 17 5-5 3.5 3.5 2.5-2.5 4 4"></path>',
  text: '<path d="M5 5h14"></path><path d="M12 5v14"></path><path d="M8.5 19h7"></path>',
  mascot: '<rect x="5" y="4" width="14" height="16" rx="5"></rect><path d="M9 14h.01"></path><path d="M15 14h.01"></path><path d="M9 9h6"></path>',
  shape: '<path d="M12 4 21 20H3L12 4Z"></path>',
  logo: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"></path><path d="M12 7v10"></path><path d="m8 9.5 4 2.5 4-2.5"></path>',
  tools: '<circle cx="10.5" cy="10.5" r="5.5"></circle><path d="m15 15 5 5"></path>',
  ruler: '<rect x="3.5" y="6" width="17" height="12" rx="2"></rect><path d="M7 6v4"></path><path d="M11 6v3"></path><path d="M15 6v4"></path>',
  undo: '<path d="M8 7 4 11l4 4"></path><path d="M4 11h10a6 6 0 0 1 6 6v1"></path>',
  redo: '<path d="m16 7 4 4-4 4"></path><path d="M20 11H10a6 6 0 0 0-6 6v1"></path>',
  copy: '<rect x="8" y="8" width="11" height="11" rx="2"></rect><path d="M5 15.5V6.8A1.8 1.8 0 0 1 6.8 5h8.7"></path>',
  delete: '<path d="M4 7h16"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M6.5 7 7.5 20h9L17.5 7"></path><path d="M9 7V4.8A1.8 1.8 0 0 1 10.8 3h2.4A1.8 1.8 0 0 1 15 4.8V7"></path>',
  selectAll: '<path d="M4 8V4h4"></path><path d="M16 4h4v4"></path><path d="M20 16v4h-4"></path><path d="M8 20H4v-4"></path><rect x="8" y="8" width="8" height="8" rx="1.5"></rect>',
  export: '<path d="M12 4v10"></path><path d="m8 10 4 4 4-4"></path><path d="M5 17v2h14v-2"></path>',
  refresh: '<path d="M20 12a8 8 0 0 1-14.5 4.6"></path><path d="M4 12A8 8 0 0 1 18.5 7.4"></path><path d="M18.5 3.5v4h-4"></path><path d="M5.5 20.5v-4h4"></path>',
  upload: '<path d="M12 16V5"></path><path d="m8 9 4-4 4 4"></path><path d="M5 17v2h14v-2"></path>',
  rect: '<rect x="4" y="6" width="16" height="12" rx="2"></rect>',
  circle: '<circle cx="12" cy="12" r="8"></circle>',
  triangle: '<path d="M12 4 21 20H3L12 4Z"></path>',
  star: '<path d="m12 3 2.65 5.37 5.93.86-4.29 4.18 1.01 5.9L12 16.52 6.7 19.31l1.01-5.9-4.29-4.18 5.93-.86L12 3Z"></path>',
  polygon: '<path d="m12 3 7.8 4.5v9L12 21l-7.8-4.5v-9L12 3Z"></path>',
  line: '<path d="M5 12h14"></path>',
  overlay: '<rect x="5" y="5" width="14" height="14" rx="2"></rect><rect x="8" y="8" width="8" height="8" rx="1.5"></rect>',
  alignLeft: '<path d="M5 4v16"></path><path d="M9 7h10"></path><path d="M9 12h7"></path><path d="M9 17h10"></path>',
  alignCenter: '<path d="M12 4v16"></path><path d="M6 7h12"></path><path d="M8.5 12h7"></path><path d="M6 17h12"></path>',
  alignRight: '<path d="M19 4v16"></path><path d="M5 7h10"></path><path d="M8 12h7"></path><path d="M5 17h10"></path>',
  objectAlignLeft: '<path d="M5 4v16"></path><rect x="9" y="7" width="10" height="10" rx="2"></rect>',
  objectAlignCenter: '<path d="M12 4v16"></path><rect x="6" y="7" width="12" height="10" rx="2"></rect>',
  objectAlignRight: '<path d="M19 4v16"></path><rect x="5" y="7" width="10" height="10" rx="2"></rect>',
  textAlignLeft: '<path d="M5 6h14"></path><path d="M5 10h10"></path><path d="M5 14h14"></path><path d="M5 18h8"></path>',
  textAlignCenter: '<path d="M5 6h14"></path><path d="M8 10h8"></path><path d="M5 14h14"></path><path d="M9 18h6"></path>',
  textAlignRight: '<path d="M5 6h14"></path><path d="M9 10h10"></path><path d="M5 14h14"></path><path d="M11 18h8"></path>',
  layerUp: '<path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z"></path><path d="m4 12 8 4.5 8-4.5"></path><path d="m4 16 8 4.5 8-4.5"></path>',
  badge: '<path d="M6.5 6h7l4 4v8h-11V6Z"></path><path d="M13.5 6v4h4"></path>',
  number: '<path d="M9.5 4 7.5 20"></path><path d="M16.5 4l-2 16"></path><path d="M5 9h14"></path><path d="M4 15h14"></path>',
  verticalText: '<path d="M12 5v14"></path><path d="M8 5h8"></path><path d="M9 19h6"></path>',
  cornerBadge: '<path d="M6 6h12v12"></path><path d="M18 6 6 18"></path>',
  topBadge: '<rect x="5" y="5" width="14" height="14" rx="2"></rect><path d="M8 9h8"></path><path d="M10 13h4"></path>',
  crop: '<path d="M7 3v14h14"></path><path d="M3 7h14v14"></path>',
  boolean: '<circle cx="9" cy="12" r="5"></circle><circle cx="15" cy="12" r="5"></circle>'
};

function basiconsIcon(name) {
  const pathName = iconPathAliases[name] || name;
  const basiconName = basiconNames[name] || basiconNames[pathName] || name;
  const svg = basiconSvg[name] || basiconSvg[pathName];
  if (svg) {
    return `<svg class="bsc-icon ri bsc-${basiconName}" data-basicon="${basiconName}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${svg}</svg>`;
  }
  return `<svg class="ri" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="${iconPaths[pathName] || iconPaths.add}"></path></svg>`;
}

function icon(name) {
  return basiconsIcon(name);
}

function applyIconSystem() {
  const toolIcons = {
    sizeSection: "ruler",
    addSection: "add",
    promptSection: "tools",
    imageTools: "image",
    upload: "image",
    textTools: "text",
    mascotPanel: "mascot",
    shapeTools: "shape",
    logoSection: "logo",
    fontSection: "tools"
  };
  document.querySelectorAll(".tool-chip").forEach(button => {
    const key = button.dataset.panel || button.dataset.action || button.dataset.scroll;
    const slot = button.querySelector("strong");
    if (slot && toolIcons[key]) slot.innerHTML = icon(toolIcons[key]);
  });
  const idIcons = {
    undoBtn: "undo",
    redoBtn: "redo",
    selectAllBtn: "selectAll",
    checkUpdateBtn: "refresh",
    installUpdateBtn: "refresh",
    importProjectBtn: "upload",
    exportProjectBtn: "export",
    exportBtn: "export",
    imageUploadBtn: "upload",
    addTitleBtn: "text",
    addTextBtn: "text",
    addSubtitleBtn: "text",
    addBigNumberBtn: "number",
    addVerticalTextBtn: "verticalText",
    addPillTagBtn: "badge",
    addCornerBadgeBtn: "cornerBadge",
    addTopBadgeBtn: "topBadge",
    addRectBtn: "rect",
    addCircleBtn: "circle",
    addTriangleBtn: "triangle",
    addStarBtn: "star",
    addPolygonBtn: "polygon",
    addDividerBtn: "line",
    addOverlayBtn: "overlay",
    copyGeneratedBtn: "copy",
    generateImageBtn: "image",
    alignLeftBtn: "objectAlignLeft",
    alignCenterBtn: "objectAlignCenter",
    alignRightBtn: "objectAlignRight",
    textAlignLeftBtn: "textAlignLeft",
    textAlignCenterBtn: "textAlignCenter",
    textAlignRightBtn: "textAlignRight",
    bringForwardBtn: "layerUp",
    sendBackwardBtn: "layerUp",
    bringFrontBtn: "layerUp",
    sendBackBtn: "layerUp",
    toggleCropBtn: "crop",
    resetCropBtn: "refresh",
    finishCropBtn: "selectAll",
    booleanUnionBtn: "boolean",
    booleanSubtractBtn: "boolean",
    booleanIntersectBtn: "boolean",
    booleanExcludeBtn: "boolean",
    groupLayersBtn: "layerUp",
    ungroupLayersBtn: "layerUp"
  };
  Object.entries(idIcons).forEach(([id, name]) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.classList.contains("icon-btn")) {
      el.innerHTML = icon(name);
      return;
    }
    if (id === "exportBtn" || id === "checkUpdateBtn" || id === "installUpdateBtn" || id === "importProjectBtn" || id === "exportProjectBtn") {
      const label = {
        exportBtn: "导出图片",
        checkUpdateBtn: "检查更新",
        installUpdateBtn: "重启安装",
        importProjectBtn: "导入工程",
        exportProjectBtn: "导出工程"
      }[id];
      el.innerHTML = `${icon(name)}<span>${label}</span>`;
      return;
    }
    if (id === "imageUploadBtn") {
      const slot = el.querySelector(".upload-icon");
      if (slot) slot.innerHTML = icon(name);
      return;
    }
    if (el.classList.contains("mini-btn")) {
      const label = el.textContent.trim();
      el.innerHTML = `${icon(name)}<span>${label}</span>`;
      return;
    }
    const slot = el.querySelector(".element-icon");
    if (slot) slot.innerHTML = icon(name);
  });
}

const presets = [
  { platform: "小红书", label: "图文竖版封面", width: 1080, height: 1440, recommended: true },
  { platform: "小红书", label: "高清竖版封面", width: 1242, height: 1660 },
  { platform: "小红书", label: "正方形笔记", width: 1080, height: 1080 },
  { platform: "小红书", label: "横版笔记", width: 1440, height: 1080 },
  { platform: "微信朋友圈", label: "九宫格单图", width: 1080, height: 1080, recommended: true },
  { platform: "微信朋友圈", label: "竖版海报", width: 1080, height: 1440, recommended: true },
  { platform: "微信朋友圈", label: "长竖图", width: 1080, height: 1920 },
  { platform: "微信朋友圈", label: "相册封面 / 主页封面", width: 2560, height: 1440, safe: "右下角预留头像区域" },
  { platform: "微信", label: "状态 / 视频封面兼容图", width: 1080, height: 1080 },
  { platform: "公众号", label: "首图", width: 900, height: 383, recommended: true },
  { platform: "公众号", label: "次图", width: 500, height: 500 },
  { platform: "抖音", label: "竖版视频封面", width: 1080, height: 1920, recommended: true, safe: "上下 UI 可能遮挡" },
  { platform: "抖音", label: "信息流安全封面", width: 1080, height: 1464, safe: "安全展示区" },
  { platform: "抖音", label: "直播封面", width: 1080, height: 1464 },
  { platform: "视频号", label: "竖版封面", width: 1080, height: 1920 },
  { platform: "视频号", label: "横版封面", width: 1280, height: 720 },
  { platform: "B站", label: "视频封面", width: 1146, height: 717, recommended: true }
];

const swatchColors = ["#fff6d8", "#fff100", "#ff4d23", "#171411", "#f7f7f2", "#2563eb", "#12b981", "#ffe4ec", "#efe7ff", "#d9f99d", "#f8fafc", "#f97316", "#0f172a", "#fef3c7"];
const safeFontKeywords = [
  "字魂", "字小魂", "ZiHun", "ZiXiaoHun",
  "思源", "Source Han", "Noto Sans CJK", "Noto Serif CJK", "SourceHanSans", "SourceHanSerif", "NotoSansCJK", "NotoSerifCJK",
  "站酷", "ZCOOL", "Zcool",
  "阿里巴巴普惠体", "Alibaba PuHuiTi", "AlibabaPuHuiTi", "Alibaba-PuHuiTi", "AlibabaSans",
  "优设", "YouShe", "YouSheBiaoTiHei",
  "庞门正道", "PangMenZhengDao",
  "得意黑", "Smiley Sans", "SmileySans",
  "抖音美好体", "Douyin Font", "DouyinSansBold",
  "快看世界体", "KuaiKan Font", "KuaiKanShiJieTi",
  "小米兰亭", "MiLan", "MiLanTing", "MiSans",
  "OPPO Sans", "OPPOSans", "VIVO Type", "vivo Sans",
  "鸿蒙", "HarmonyOS", "HarmonyOS Sans", "HarmonyOS_Sans",
  "霞鹜", "LXGW", "LXGWWenKai", "LXGW WenKai",
  "悠哉", "Yozai",
  "文泉驿", "WenQuanYi", "Unifont", "GNU Unifont", "Fandol",
  "Gentium", "DejaVu", "Liberation", "Droid",
  "Roboto", "Open Sans", "Noto Sans", "Noto Serif", "Lato", "Montserrat", "Oswald", "Raleway", "PT Sans", "Merriweather",
  "Ubuntu", "Cantarell", "Fira Sans", "Fira Code", "Fira Mono", "Inter", "Manrope", "Work Sans", "Playfair Display",
  "Source Sans Pro", "Source Serif Pro", "Source Code Pro", "IBM Plex", "Space Grotesk", "DM Sans", "Karla", "Heebo",
  "Nunito", "Rubik", "Barlow", "Titillium Web", "Varela Round", "Cabin", "Muli", "Quicksand", "Jost", "Sora",
  "M PLUS", "MPLUS", "Kosugi", "Sawarabi", "Nanum",
  "全字库", "TW-Kai", "TW-Sung", "TW-Moe-Kai", "TW-Moe-Sung",
  "教育部標準楷書", "教育部標準宋體", "新細明體", "細明體", "標楷體", "港鐵宋體", "MTR Sung",
  "胡晓波字体", "HuXiaoBo", "江西拙楷", "JiangXiZhuoKai", "猫啃网", "Maoken", "问藏书房", "WenCang",
  "沐瑶软笔手写体", "MuYao", "手写体", "ShouXieTi", "杨任东竹石体", "YangRenDong", "齐伋体", "QiJi",
  "钟齐流江毛笔草体", "钟齐志莽行书", "装甲明朝体", "SoukouMincho", "源界明朝", "GenkaiMincho",
  "源云明体", "GenYoMin", "源样明体", "源流明体", "GenRyuMin", "源石黑体", "GenSekiGothic",
  "源柔黑体", "GenJyuuGothic", "源泉圆体", "GenSenRounded", "源暎", "GenEi", "花园明朝", "Hanazono"
];
const baseFonts = [
  { family: "Alibaba PuHuiTi", label: "阿里巴巴普惠体" },
  { family: "Noto Sans CJK SC", label: "Noto Sans CJK" },
  { family: "Source Han Sans SC", label: "思源黑体" },
  { family: "Smiley Sans", label: "得意黑" },
  { family: "MiSans", label: "MiSans" },
  { family: "HarmonyOS Sans", label: "HarmonyOS Sans" }
];
const fallbackLogos = [
  "垂直logo.png",
  "标准logo.png",
  "标准描边.png",
  "垂直logo描边.png",
  "垂直logo描边白字.png",
  "垂直反白.png",
  "标准反白.png",
  "垂直单黑.png",
  "标准单黑.png",
  "youxiake-logo.png"
];
const fallbackMascots = ["01.png", "02.png", "03.png", "04.png", "05.png", "06.png", "07.png"];
let localFonts = [];
let logoAssets = [];
let mascotAssets = [];

const state = {
  width: 1080,
  height: 1440,
  platform: "小红书",
  label: "图文竖版封面",
  background: "#fff6d8",
  objects: [],
  selectedId: null,
  selectedIds: [],
  zoom: "fit",
  zoomScale: 1,
  history: [],
  future: [],
  dragging: null
};
let inlineEditing = null;
let objectClipboard = [];
let rmbgPipelinePromise = null;
const maskEditor = {
  active: false,
  objectId: null,
  mode: "keep",
  brushSize: 46,
  hardness: .82,
  showOverlay: true,
  painting: false,
  lastPoint: null,
  hoverPoint: null,
  history: [],
  renderQueued: false,
  overlayCache: null,
  dirty: false
};
const cropEditor = { active: false, objectId: null };
const stampEditor = {
  active: false,
  objectId: null,
  brushSize: 46,
  hardness: .82,
  painting: false,
  samplePoint: null,
  hoverPoint: null,
  sourceOffset: null,
  sourceSnapshot: null,
  history: [],
  renderQueued: false,
  dirty: false
};
const panState = { spaceDown: false, active: false, startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0 };
const swipeSelect = { active: false, ids: new Set(), started: false, start: null, current: null };
const unsplashState = { query: "", page: 1, totalPages: 0, results: [], loading: false };

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function text(value, x, y, fontSize, fill, extra = {}) {
  return {
    id: uid(),
    type: "text",
    name: value.split("\n")[0].slice(0, 10) || "文字",
    text: value,
    x, y,
    width: extra.width || 780,
    height: extra.height || fontSize * 1.25,
    rotation: 0,
    opacity: 1,
    fontFamily: extra.fontFamily || "Alibaba PuHuiTi",
    fontSize,
    fontWeight: extra.fontWeight || 800,
    fill,
    stroke: extra.stroke || "#171411",
    strokeWidth: extra.strokeWidth || 0,
    shadow: extra.shadow || 0,
    align: extra.align || "left",
    lockAspect: extra.lockAspect || false
  };
}

function shape(kind, x, y, width, heightOrFill, fillOrExtra, maybeExtra = {}) {
  const isCircle = kind === "circle";
  const isLine = kind === "line";
  const isSymbol = ["triangle", "star", "polygon"].includes(kind);
  const height = isCircle ? width : isLine ? Math.max(12, heightOrFill || 24) : heightOrFill;
  const fill = isCircle || isLine ? heightOrFill : fillOrExtra;
  const extra = isCircle ? fillOrExtra || {} : maybeExtra;
  const names = { circle: "圆形", line: "分割线", triangle: "三角形", star: "星形", polygon: "多边形", rect: "矩形" };
  return {
    id: uid(),
    type: "shape",
    kind,
    name: names[kind] || "形状",
    x, y,
    width,
    height,
    rotation: 0,
    opacity: 1,
    fill: isLine ? "transparent" : fill,
    stroke: extra.stroke || "#171411",
    strokeWidth: isLine ? extra.strokeWidth ?? 1 : extra.strokeWidth || 0,
    strokeDash: extra.strokeDash || false,
    radius: extra.radius || 0,
    shadow: extra.shadow || 0,
    sides: extra.sides || (kind === "polygon" ? 6 : undefined),
    points: extra.points || (kind === "star" ? 5 : undefined),
    lockAspect: extra.lockAspect ?? (kind === "circle" || isSymbol)
  };
}

function imageObject(img, x, y, width, height, src) {
  return {
    id: uid(),
    type: "image",
    name: "图片",
    x, y, width, height,
    rotation: 0,
    opacity: 1,
    radius: 0,
    shadow: 0,
    lockAspect: true,
    crop: { left: 0, top: 0, right: 0, bottom: 0 },
    src,
    image: img
  };
}

function isSafeCommercialFontName(fontName) {
  const normalized = String(fontName || "").toLowerCase();
  return safeFontKeywords.some(keyword => normalized.includes(String(keyword).toLowerCase()));
}

function isSafeCommercialFont(font) {
  return [font.family, font.fullName, font.postscriptName].some(isSafeCommercialFontName);
}

function fileLabel(path) {
  const name = decodeURIComponent(path.split("/").pop() || path);
  return name.replace(/\.[^.]+$/, "");
}

function serializableObject(o) {
  return {
    ...o,
    image: undefined,
    originalImage: undefined,
    cloneCanvas: undefined,
    maskImage: undefined,
    maskCanvas: undefined,
    maskedRenderCache: undefined,
    children: o.children ? o.children.map(serializableObject) : undefined
  };
}

async function hydrateObject(o) {
  if (o.type === "image" && o.src) {
    o.image = await loadImage(o.src);
    if (o.originalSrc) o.originalImage = await loadImage(o.originalSrc);
    if (o.maskSrc) o.maskImage = await loadImage(o.maskSrc);
  }
  if (o.type === "group" && Array.isArray(o.children)) {
    o.children = await Promise.all(o.children.map(hydrateObject));
  }
  return o;
}

function cloneObject(obj, options = {}) {
  const copy = {
    ...obj,
    id: options.keepIds ? obj.id : uid(),
    name: options.name || obj.name,
    image: obj.image,
    originalImage: obj.originalImage,
    maskImage: obj.maskImage,
    maskCanvas: obj.maskCanvas
  };
  if (obj.children) copy.children = obj.children.map(child => cloneObject(child, options));
  return copy;
}

function scaleObjectFromStart(obj, start, sx, sy) {
  obj.x = start.x * sx;
  obj.y = start.y * sy;
  obj.width = Math.max(1, start.width * sx);
  obj.height = Math.max(1, start.height * sy);
  if (obj.type === "text") obj.fontSize = Math.max(8, start.fontSize * Math.min(sx, sy));
  if (obj.type === "group" && obj.children && start.children) {
    obj.children.forEach(child => {
      const startChild = start.children.find(item => item.id === child.id);
      if (startChild) scaleObjectFromStart(child, startChild, sx, sy);
    });
  }
}

function saveHistory() {
  state.history.push(snapshot());
  if (state.history.length > 60) state.history.shift();
  state.future = [];
}

function snapshot() {
  return JSON.stringify({
    width: state.width,
    height: state.height,
    platform: state.platform,
    label: state.label,
    background: state.background,
    objects: state.objects.map(serializableObject)
  });
}

async function restore(raw) {
  const parsed = JSON.parse(raw);
  const data = parsed && parsed.schema === "youdesign.project" ? parsed.document : parsed;
  if (!data || !Array.isArray(data.objects) || !Number(data.width) || !Number(data.height)) {
    throw new Error("工程文件格式不正确");
  }
  Object.assign(state, data);
  state.objects = await Promise.all(data.objects.map(hydrateObject));
  stopMaskEdit(false);
  setSelection([]);
  resizeCanvas();
  syncPromptAspectToCanvas();
  generateTourismPrompt();
  renderAll();
  syncUi();
}

function persist() {
  localStorage.setItem(STORAGE_KEY, snapshot());
}

function projectSnapshot() {
  return JSON.stringify({
    schema: "youdesign.project",
    version: 1,
    appVersion: APP_VERSION,
    exportedAt: new Date().toISOString(),
    document: JSON.parse(snapshot())
  }, null, 2);
}

function downloadTextFile(content, filename, type = "application/json") {
  const blob = new Blob([content], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function assertExportSize(width, height) {
  const pixels = width * height;
  if (pixels > MAX_EXPORT_PIXELS) {
    throw new Error(`导出尺寸过大：${width} × ${height}。请降低导出倍率后重试。`);
  }
}

async function saveExportFile(options) {
  if (window.youdesignDesktop?.saveExportFile) {
    return window.youdesignDesktop.saveExportFile(options);
  }
  if (options.text != null) {
    downloadTextFile(options.text, options.filename, options.type || "application/json");
    return "";
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(options.blob);
  a.download = options.filename;
  a.click();
  URL.revokeObjectURL(a.href);
  return "";
}

function readTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function showAppDialog(options = {}) {
  const layer = document.getElementById("appDialog");
  const card = document.getElementById("appDialogCard");
  const title = document.getElementById("appDialogTitle");
  const message = document.getElementById("appDialogMessage");
  const mark = document.getElementById("appDialogMark");
  const cancelBtn = document.getElementById("appDialogCancel");
  const confirmBtn = document.getElementById("appDialogConfirm");
  const {
    title: dialogTitle = "提示",
    message: dialogMessage = "",
    confirmText = "确定",
    cancelText = "取消",
    kind = "info",
    showCancel = true
  } = options;

  return new Promise(resolve => {
    const previousFocus = document.activeElement;
    let settled = false;

    const close = value => {
      if (settled) return;
      settled = true;
      layer.classList.add("hidden");
      document.removeEventListener("keydown", onKeyDown);
      confirmBtn.onclick = null;
      cancelBtn.onclick = null;
      layer.onclick = null;
      if (previousFocus && typeof previousFocus.focus === "function") previousFocus.focus();
      resolve(value);
    };

    const onKeyDown = event => {
      if (event.key === "Escape") close(false);
      if (event.key === "Enter") close(true);
    };

    card.classList.toggle("is-danger", kind === "danger");
    confirmBtn.classList.toggle("is-danger", kind === "danger");
    title.textContent = dialogTitle;
    message.textContent = dialogMessage;
    mark.innerHTML = icon(kind === "danger" ? "delete" : kind === "update" ? "refresh" : "tools");
    cancelBtn.textContent = cancelText;
    confirmBtn.textContent = confirmText;
    cancelBtn.classList.toggle("hidden", !showCancel);
    layer.classList.remove("hidden");
    document.addEventListener("keydown", onKeyDown);
    confirmBtn.onclick = () => close(true);
    cancelBtn.onclick = () => close(false);
    layer.onclick = event => {
      if (event.target === layer && showCancel) close(false);
    };
    requestAnimationFrame(() => confirmBtn.focus());
  });
}

function appAlert(message, title = "提示", kind = "info") {
  return showAppDialog({
    title,
    message,
    kind,
    showCancel: false,
    confirmText: "知道了"
  });
}

function appConfirm(message, options = {}) {
  return showAppDialog({
    title: options.title || "确认操作",
    message,
    kind: options.kind || "info",
    confirmText: options.confirmText || "继续",
    cancelText: options.cancelText || "取消",
    showCancel: true
  });
}

function chooseExportImageType() {
  const layer = document.getElementById("appDialog");
  const card = document.getElementById("appDialogCard");
  const title = document.getElementById("appDialogTitle");
  const message = document.getElementById("appDialogMessage");
  const mark = document.getElementById("appDialogMark");
  const cancelBtn = document.getElementById("appDialogCancel");
  const confirmBtn = document.getElementById("appDialogConfirm");
  return new Promise(resolve => {
    const previousFocus = document.activeElement;
    let settled = false;
    const close = value => {
      if (settled) return;
      settled = true;
      layer.classList.add("hidden");
      document.removeEventListener("keydown", onKeyDown);
      confirmBtn.onclick = null;
      cancelBtn.onclick = null;
      layer.onclick = null;
      document.getElementById("exportSvgChoiceBtn")?.remove();
      if (previousFocus && typeof previousFocus.focus === "function") previousFocus.focus();
      resolve(value);
    };
    const onKeyDown = event => {
      if (event.key === "Escape") close(null);
      if (event.key === "Enter") close("image/png");
    };
    card.classList.remove("is-danger");
    confirmBtn.classList.remove("is-danger");
    title.textContent = "导出格式";
    message.textContent = "选择本次导出的文件格式。PNG/JPG 适合位图封面，SVG 适合继续编辑矢量文字和图形。";
    mark.innerHTML = icon("export");
    cancelBtn.textContent = "JPG";
    confirmBtn.textContent = "PNG";
    cancelBtn.classList.remove("hidden");
    const svgBtn = document.createElement("button");
    svgBtn.className = "btn";
    svgBtn.id = "exportSvgChoiceBtn";
    svgBtn.type = "button";
    svgBtn.textContent = "SVG";
    svgBtn.onclick = () => close("image/svg+xml");
    confirmBtn.parentNode.insertBefore(svgBtn, confirmBtn);
    layer.classList.remove("hidden");
    document.addEventListener("keydown", onKeyDown);
    confirmBtn.onclick = () => close("image/png");
    cancelBtn.onclick = () => close("image/jpeg");
    layer.onclick = event => {
      if (event.target === layer) close(null);
    };
    requestAnimationFrame(() => confirmBtn.focus());
  });
}

function resizeCanvas() {
  canvas.width = state.width;
  canvas.height = state.height;
  applyZoom();
  document.getElementById("currentSizeLabel").textContent = `${state.width} × ${state.height}`;
  document.getElementById("docInfo").textContent = `${state.platform} · ${state.label} · ${state.width} × ${state.height}`;
}

function applyZoom() {
  const value = document.getElementById("zoomSelect").value;
  let scale = value === "custom" ? state.zoomScale : Number(value);
  if (value === "fit") {
    const availableW = Math.max(320, stage.clientWidth - 82);
    const availableH = Math.max(320, stage.clientHeight - 82);
    scale = Math.min(availableW / state.width, availableH / state.height, 1);
  }
  setCanvasScale(scale, value);
}

function setCanvasScale(scale, mode = "custom") {
  const nextScale = Math.max(.1, Math.min(3, scale));
  state.zoom = mode;
  state.zoomScale = nextScale;
  canvas.style.width = `${state.width * nextScale}px`;
  canvas.style.height = `${state.height * nextScale}px`;
  const label = `${Math.round(nextScale * 100)}%`;
  document.getElementById("zoomPercent").textContent = label;
  document.querySelector('#zoomSelect option[value="custom"]').textContent = label;
}

function getScale() {
  return canvas.width / canvas.getBoundingClientRect().width;
}

function selected() {
  return state.objects.find(o => o.id === state.selectedId);
}

function selectedObjects() {
  const ids = new Set(state.selectedIds && state.selectedIds.length ? state.selectedIds : state.selectedId ? [state.selectedId] : []);
  return state.objects.filter(o => ids.has(o.id));
}

function setSelection(ids) {
  state.selectedIds = [...new Set(ids)].filter(id => state.objects.some(o => o.id === id));
  state.selectedId = state.selectedIds[state.selectedIds.length - 1] || null;
  if (maskEditor.active && !state.selectedIds.includes(maskEditor.objectId)) stopMaskEdit(false);
  if (cropEditor.active && !state.selectedIds.includes(cropEditor.objectId)) stopCropEdit(false);
  if (stampEditor.active && !state.selectedIds.includes(stampEditor.objectId)) stopStampEdit(false);
}

function toggleSelection(id) {
  const ids = new Set(state.selectedIds && state.selectedIds.length ? state.selectedIds : state.selectedId ? [state.selectedId] : []);
  if (ids.has(id)) ids.delete(id);
  else ids.add(id);
  setSelection([...ids]);
}

function selectionBounds(objects = selectedObjects()) {
  if (!objects.length) return null;
  const left = Math.min(...objects.map(o => o.x));
  const top = Math.min(...objects.map(o => o.y));
  const right = Math.max(...objects.map(o => o.x + o.width));
  const bottom = Math.max(...objects.map(o => o.y + o.height));
  return { x: left, y: top, width: right - left, height: bottom - top, right, bottom };
}

function renderAll(exporting = false, scale = 1, targetCtx = ctx) {
  targetCtx.save();
  targetCtx.setTransform(scale, 0, 0, scale, 0, 0);
  targetCtx.clearRect(0, 0, state.width, state.height);
  targetCtx.fillStyle = state.background;
  targetCtx.fillRect(0, 0, state.width, state.height);
  drawSafeZones(targetCtx, exporting);
  for (const obj of state.objects) {
    if (!exporting && inlineEditing && obj.id === inlineEditing.id) continue;
    drawObject(targetCtx, obj);
  }
  if (!exporting) drawMaskEditorOverlay(targetCtx);
  if (!exporting) drawMaskBrushPreview(targetCtx);
  if (!exporting) drawStampBrushPreview(targetCtx);
  if (!exporting) drawCropEditorOverlay(targetCtx);
  targetCtx.restore();
  if (!exporting) renderSelectionOverlay();
}

function hideInlineTextEditor() {
  inlineEditing = null;
  inlineTextEditor.classList.remove("is-active");
  inlineTextEditor.value = "";
  inlineTextEditor.onblur = null;
  inlineTextEditor.onkeydown = null;
  inlineTextEditor.oninput = null;
  inlineTextEditor.style.height = "";
  inlineTextEditor.style.transform = "";
}

function finishInlineTextEdit(commit = true) {
  if (!inlineEditing) return;
  const obj = state.objects.find(item => item.id === inlineEditing.id);
  const nextText = inlineTextEditor.value;
  let changed = false;
  if (commit && obj && obj.type === "text" && nextText !== inlineEditing.original) {
    saveHistory();
    obj.text = nextText || " ";
    obj.name = obj.text.split("\n")[0].slice(0, 10) || "文字";
    changed = true;
  }
  hideInlineTextEditor();
  renderAll();
  if (changed) {
    syncUi();
    persist();
  }
}

function resizeInlineTextEditor() {
  if (!inlineEditing) return;
  const scale = canvas.getBoundingClientRect().width / state.width;
  const lineHeight = inlineEditing.lineHeight || 34;
  const minHeight = Math.max(34, lineHeight);
  inlineTextEditor.style.height = `${minHeight}px`;
  inlineTextEditor.style.height = `${Math.max(minHeight, inlineTextEditor.scrollHeight + 4)}px`;
  const obj = state.objects.find(item => item.id === inlineEditing.id);
  if (!obj) return;
  inlineTextEditor.style.left = `${obj.x * scale}px`;
  inlineTextEditor.style.top = `${obj.y * scale}px`;
  inlineTextEditor.style.width = `${Math.max(44, obj.width * scale)}px`;
}

function startInlineTextEdit(obj) {
  if (!obj || obj.type !== "text") return;
  if (inlineEditing) finishInlineTextEdit(true);
  setSelection([obj.id]);
  renderAll();
  syncUi();
  const scale = canvas.getBoundingClientRect().width / state.width;
  const lineHeight = obj.fontSize * 1.14 * scale;
  inlineEditing = { id: obj.id, original: obj.text || "", lineHeight };
  inlineTextEditor.value = obj.text || "";
  inlineTextEditor.style.left = `${obj.x * scale}px`;
  inlineTextEditor.style.top = `${obj.y * scale}px`;
  inlineTextEditor.style.width = `${Math.max(44, obj.width * scale)}px`;
  inlineTextEditor.style.height = `${Math.max(34, obj.height * scale)}px`;
  inlineTextEditor.style.font = `${obj.fontWeight || 800} ${obj.fontSize * scale}px "${obj.fontFamily}", sans-serif`;
  inlineTextEditor.style.lineHeight = `${lineHeight}px`;
  inlineTextEditor.style.color = obj.fill || "#171411";
  inlineTextEditor.style.textAlign = obj.align || "left";
  inlineTextEditor.style.letterSpacing = "0";
  inlineTextEditor.style.textDecoration = "none";
  inlineTextEditor.style.opacity = String(obj.opacity ?? 1);
  inlineTextEditor.style.transformOrigin = "50% 50%";
  inlineTextEditor.style.transform = `rotate(${obj.rotation || 0}deg)`;
  inlineTextEditor.classList.add("is-active");
  inlineTextEditor.focus();
  inlineTextEditor.select();
  resizeInlineTextEditor();
  inlineTextEditor.oninput = resizeInlineTextEditor;
  renderAll();
  inlineTextEditor.onblur = () => finishInlineTextEdit(true);
  inlineTextEditor.onkeydown = event => {
    if (event.key === "Escape") {
      event.preventDefault();
      finishInlineTextEdit(false);
    }
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      finishInlineTextEdit(true);
    }
  };
}

function drawSafeZones(c, exporting) {
  if (exporting) return;
  c.save();
  c.strokeStyle = "rgba(37,99,235,.32)";
  c.setLineDash([12, 12]);
  c.lineWidth = 3;
  if (state.platform.includes("抖音") || state.platform.includes("视频号")) {
    c.strokeRect(60, 228, state.width - 120, state.height - 456);
  }
  if (state.label.includes("相册封面")) {
    c.strokeRect(state.width - 430, state.height - 330, 260, 260);
  }
  c.restore();
}

function drawObject(c, obj) {
  c.save();
  c.globalAlpha = obj.opacity ?? 1;
  c.translate(obj.x + obj.width / 2, obj.y + obj.height / 2);
  c.rotate((obj.rotation || 0) * Math.PI / 180);
  c.translate(-obj.width / 2, -obj.height / 2);
  if (obj.shadow) {
    c.shadowColor = "rgba(0,0,0,.22)";
    c.shadowBlur = obj.shadow;
    c.shadowOffsetX = obj.shadow / 3;
    c.shadowOffsetY = obj.shadow / 3;
  }
  if (obj.type === "text") drawText(c, obj);
  if (obj.type === "shape") drawShape(c, obj);
  if (obj.type === "compoundShape") drawCompoundShape(c, obj);
  if (obj.type === "image" && obj.image) drawImage(c, obj);
  if (obj.type === "group") drawGroup(c, obj);
  c.restore();
}

function drawGroup(c, obj) {
  (obj.children || []).forEach(child => drawObject(c, child));
}

function drawText(c, obj) {
  c.font = `${obj.fontWeight || 800} ${obj.fontSize}px "${obj.fontFamily}", sans-serif`;
  c.textAlign = obj.align || "left";
  c.textBaseline = "top";
  c.lineJoin = "round";
  const lines = wrapText(c, obj.text, obj.width, obj.fontSize * 1.12);
  const lineHeight = obj.fontSize * 1.14;
  obj.height = Math.max(lineHeight, lines.length * lineHeight);
  lines.forEach((line, i) => {
    const x = obj.align === "center" ? obj.width / 2 : obj.align === "right" ? obj.width : 0;
    const y = i * lineHeight;
    if (obj.strokeWidth > 0) {
      c.strokeStyle = obj.stroke;
      c.lineWidth = obj.strokeWidth;
      c.strokeText(line, x, y);
    }
    c.fillStyle = obj.fill;
    c.fillText(line, x, y);
  });
}

function wrapText(c, value, maxWidth, baseSize) {
  const hardLines = String(value || "").split("\n");
  const result = [];
  hardLines.forEach(line => {
    let current = "";
    for (const ch of line) {
      const test = current + ch;
      if (c.measureText(test).width > maxWidth && current) {
        result.push(current);
        current = ch;
      } else {
        current = test;
      }
    }
    result.push(current || " ");
  });
  return result;
}

function roundRect(c, x, y, w, h, r) {
  const radius = Math.min(r || 0, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + radius, y);
  c.arcTo(x + w, y, x + w, y + h, radius);
  c.arcTo(x + w, y + h, x, y + h, radius);
  c.arcTo(x, y + h, x, y, radius);
  c.arcTo(x, y, x + w, y, radius);
  c.closePath();
}

function regularPolygonPoints(width, height, sides = 3, rotation = -Math.PI / 2) {
  const cx = width / 2;
  const cy = height / 2;
  const rx = width / 2;
  const ry = height / 2;
  return Array.from({ length: sides }, (_, index) => {
    const angle = rotation + index * Math.PI * 2 / sides;
    return { x: cx + Math.cos(angle) * rx, y: cy + Math.sin(angle) * ry };
  });
}

function starPoints(width, height, points = 5) {
  const cx = width / 2;
  const cy = height / 2;
  const outerX = width / 2;
  const outerY = height / 2;
  const innerX = outerX * .45;
  const innerY = outerY * .45;
  return Array.from({ length: points * 2 }, (_, index) => {
    const outer = index % 2 === 0;
    const angle = -Math.PI / 2 + index * Math.PI / points;
    return {
      x: cx + Math.cos(angle) * (outer ? outerX : innerX),
      y: cy + Math.sin(angle) * (outer ? outerY : innerY)
    };
  });
}

function polygonPath(c, points) {
  c.beginPath();
  points.forEach((point, index) => {
    if (index === 0) c.moveTo(point.x, point.y);
    else c.lineTo(point.x, point.y);
  });
  c.closePath();
}

function roundedPolygonPath(c, points, radius = 0) {
  const numericRadius = Number(radius || 0);
  if (!numericRadius || points.length < 3) {
    polygonPath(c, points);
    return;
  }
  const rounded = points.map((point, index) => {
    const prev = points[(index - 1 + points.length) % points.length];
    const next = points[(index + 1) % points.length];
    const prevLen = Math.hypot(prev.x - point.x, prev.y - point.y);
    const nextLen = Math.hypot(next.x - point.x, next.y - point.y);
    const r = Math.min(numericRadius, prevLen * .45, nextLen * .45);
    const inPoint = {
      x: point.x + (prev.x - point.x) / Math.max(1, prevLen) * r,
      y: point.y + (prev.y - point.y) / Math.max(1, prevLen) * r
    };
    const outPoint = {
      x: point.x + (next.x - point.x) / Math.max(1, nextLen) * r,
      y: point.y + (next.y - point.y) / Math.max(1, nextLen) * r
    };
    return { point, inPoint, outPoint };
  });
  c.beginPath();
  c.moveTo(rounded[0].outPoint.x, rounded[0].outPoint.y);
  for (let index = 1; index < rounded.length; index += 1) {
    const item = rounded[index];
    c.lineTo(item.inPoint.x, item.inPoint.y);
    c.quadraticCurveTo(item.point.x, item.point.y, item.outPoint.x, item.outPoint.y);
  }
  const first = rounded[0];
  c.lineTo(first.inPoint.x, first.inPoint.y);
  c.quadraticCurveTo(first.point.x, first.point.y, first.outPoint.x, first.outPoint.y);
  c.closePath();
}

function shapePoints(obj) {
  if (obj.kind === "triangle") return regularPolygonPoints(obj.width, obj.height, 3);
  if (obj.kind === "star") return starPoints(obj.width, obj.height, obj.points || 5);
  if (obj.kind === "polygon") return regularPolygonPoints(obj.width, obj.height, obj.sides || 6);
  return [];
}

function drawShape(c, obj) {
  if (obj.kind === "line") {
    c.strokeStyle = obj.stroke || "#171411";
    c.lineWidth = Math.max(1, obj.strokeWidth || 1);
    c.lineCap = "butt";
    c.setLineDash(obj.strokeDash ? [12, 8] : []);
    c.beginPath();
    c.moveTo(0, obj.height / 2);
    c.lineTo(obj.width, obj.height / 2);
    c.stroke();
    c.setLineDash([]);
    return;
  }
  c.fillStyle = obj.fill;
  c.strokeStyle = obj.stroke || obj.fill;
  c.lineWidth = obj.strokeWidth || 0;
  if (obj.kind === "circle") {
    c.beginPath();
    c.ellipse(obj.width / 2, obj.height / 2, obj.width / 2, obj.height / 2, 0, 0, Math.PI * 2);
  } else if (["triangle", "star", "polygon"].includes(obj.kind)) {
    roundedPolygonPath(c, shapePoints(obj), obj.radius || 0);
  } else {
    roundRect(c, 0, 0, obj.width, obj.height, obj.radius);
  }
  c.fill();
  if (obj.strokeWidth > 0) c.stroke();
}

function drawImage(c, obj) {
  roundRect(c, 0, 0, obj.width, obj.height, obj.radius || 0);
  c.clip();
  const crop = normalizeCrop(obj.crop);
  const maskSource = obj.maskCanvas || obj.maskImage;
  const image = obj.cloneCanvas || (maskSource && obj.originalImage ? obj.originalImage : obj.image);
  const { sx, sy, sw, sh } = imageSourceRectForBox(image, crop);
  if (maskSource) {
    const buffer = maskedRenderCanvas(obj, image, maskSource, crop);
    c.drawImage(buffer, 0, 0, obj.width, obj.height);
    return;
  }
  c.drawImage(image, sx, sy, sw, sh, 0, 0, obj.width, obj.height);
}

function maskedRenderCanvas(obj, image, maskSource, crop) {
  const width = Math.max(1, Math.round(obj.width));
  const height = Math.max(1, Math.round(obj.height));
  const imageWidth = image?.width || image?.naturalWidth || 0;
  const imageHeight = image?.height || image?.naturalHeight || 0;
  const cache = obj.maskedRenderCache;
  if (
    cache
    && cache.image === image
    && cache.maskSource === maskSource
    && cache.width === width
    && cache.height === height
    && cache.maskVersion === (obj.maskVersion || 0)
    && cache.imageWidth === imageWidth
    && cache.imageHeight === imageHeight
    && cache.cropLeft === crop.left
    && cache.cropTop === crop.top
    && cache.cropRight === crop.right
    && cache.cropBottom === crop.bottom
  ) {
    return obj.maskedRenderCache.canvas;
  }

  const { sx, sy, sw, sh } = imageSourceRectForBox(image, crop);
  const buffer = document.createElement("canvas");
  buffer.width = width;
  buffer.height = height;
  const bctx = buffer.getContext("2d");
  bctx.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);
  bctx.globalCompositeOperation = "destination-in";
  bctx.drawImage(maskSource, 0, 0, width, height);
  obj.maskedRenderCache = {
    image,
    maskSource,
    width,
    height,
    maskVersion: obj.maskVersion || 0,
    imageWidth,
    imageHeight,
    cropLeft: crop.left,
    cropTop: crop.top,
    cropRight: crop.right,
    cropBottom: crop.bottom,
    canvas: buffer
  };
  return buffer;
}

function imageSourceRectForBox(image, crop) {
  const naturalW = image.naturalWidth || image.width;
  const naturalH = image.naturalHeight || image.height;
  return {
    sx: naturalW * crop.left / 100,
    sy: naturalH * crop.top / 100,
    sw: Math.max(1, naturalW * (100 - crop.left - crop.right) / 100),
    sh: Math.max(1, naturalH * (100 - crop.top - crop.bottom) / 100)
  };
}

function normalizeCrop(crop = {}) {
  const next = {
    left: Number(crop.left || 0),
    top: Number(crop.top || 0),
    right: Number(crop.right || 0),
    bottom: Number(crop.bottom || 0)
  };
  ["left", "top", "right", "bottom"].forEach(key => {
    next[key] = Math.max(0, Math.min(90, next[key]));
  });
  if (next.left + next.right > 92) {
    const scale = 92 / (next.left + next.right);
    next.left *= scale;
    next.right *= scale;
  }
  if (next.top + next.bottom > 92) {
    const scale = 92 / (next.top + next.bottom);
    next.top *= scale;
    next.bottom *= scale;
  }
  return next;
}

function svgEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function svgNum(value) {
  const number = Number(value || 0);
  return Number.isInteger(number) ? String(number) : String(Math.round(number * 1000) / 1000);
}

function svgTransform(obj) {
  const cx = obj.x + obj.width / 2;
  const cy = obj.y + obj.height / 2;
  return `translate(${svgNum(obj.x)} ${svgNum(obj.y)}) rotate(${svgNum(obj.rotation || 0)} ${svgNum(obj.width / 2)} ${svgNum(obj.height / 2)})`;
}

function svgObjectStyle(obj) {
  return `opacity="${svgNum(obj.opacity ?? 1)}"${obj.shadow ? ` filter="url(#shadow-${obj.id})"` : ""}`;
}

function svgRoundRectPath(w, h, r = 0) {
  const radius = Math.min(Number(r || 0), w / 2, h / 2);
  if (!radius) return `M0 0H${svgNum(w)}V${svgNum(h)}H0Z`;
  return `M${svgNum(radius)} 0H${svgNum(w - radius)}Q${svgNum(w)} 0 ${svgNum(w)} ${svgNum(radius)}V${svgNum(h - radius)}Q${svgNum(w)} ${svgNum(h)} ${svgNum(w - radius)} ${svgNum(h)}H${svgNum(radius)}Q0 ${svgNum(h)} 0 ${svgNum(h - radius)}V${svgNum(radius)}Q0 0 ${svgNum(radius)} 0Z`;
}

function svgPointsPath(points) {
  return points.map((point, index) => `${index ? "L" : "M"}${svgNum(point.x)} ${svgNum(point.y)}`).join("") + "Z";
}

function svgRoundedPointsPath(points, radius = 0) {
  const numericRadius = Number(radius || 0);
  if (!numericRadius || points.length < 3) return svgPointsPath(points);
  const rounded = points.map((point, index) => {
    const prev = points[(index - 1 + points.length) % points.length];
    const next = points[(index + 1) % points.length];
    const prevLen = Math.hypot(prev.x - point.x, prev.y - point.y);
    const nextLen = Math.hypot(next.x - point.x, next.y - point.y);
    const r = Math.min(numericRadius, prevLen * .45, nextLen * .45);
    return {
      point,
      inPoint: {
        x: point.x + (prev.x - point.x) / Math.max(1, prevLen) * r,
        y: point.y + (prev.y - point.y) / Math.max(1, prevLen) * r
      },
      outPoint: {
        x: point.x + (next.x - point.x) / Math.max(1, nextLen) * r,
        y: point.y + (next.y - point.y) / Math.max(1, nextLen) * r
      }
    };
  });
  const commands = [`M${svgNum(rounded[0].outPoint.x)} ${svgNum(rounded[0].outPoint.y)}`];
  for (let index = 1; index < rounded.length; index += 1) {
    const item = rounded[index];
    commands.push(`L${svgNum(item.inPoint.x)} ${svgNum(item.inPoint.y)}`);
    commands.push(`Q${svgNum(item.point.x)} ${svgNum(item.point.y)} ${svgNum(item.outPoint.x)} ${svgNum(item.outPoint.y)}`);
  }
  const first = rounded[0];
  commands.push(`L${svgNum(first.inPoint.x)} ${svgNum(first.inPoint.y)}`);
  commands.push(`Q${svgNum(first.point.x)} ${svgNum(first.point.y)} ${svgNum(first.outPoint.x)} ${svgNum(first.outPoint.y)}Z`);
  return commands.join("");
}

function svgTextObject(obj) {
  const measure = document.createElement("canvas").getContext("2d");
  measure.font = `${obj.fontWeight || 800} ${obj.fontSize}px "${obj.fontFamily}", sans-serif`;
  const lines = wrapText(measure, obj.text, obj.width, obj.fontSize * 1.12);
  const lineHeight = obj.fontSize * 1.14;
  const anchor = obj.align === "center" ? "middle" : obj.align === "right" ? "end" : "start";
  const x = obj.align === "center" ? obj.width / 2 : obj.align === "right" ? obj.width : 0;
  const stroke = obj.strokeWidth > 0
    ? ` stroke="${svgEscape(obj.stroke)}" stroke-width="${svgNum(obj.strokeWidth)}" paint-order="stroke fill" stroke-linejoin="round"`
    : "";
  const tspans = lines.map((line, index) => `<tspan x="${svgNum(x)}" y="${svgNum(index * lineHeight)}">${svgEscape(line)}</tspan>`).join("");
  return `<g transform="${svgTransform(obj)}" ${svgObjectStyle(obj)}><text x="${svgNum(x)}" y="0" dominant-baseline="text-before-edge" font-family="${svgEscape(obj.fontFamily)}, sans-serif" font-size="${svgNum(obj.fontSize)}" font-weight="${svgEscape(obj.fontWeight || 800)}" fill="${svgEscape(obj.fill)}" text-anchor="${anchor}"${stroke}>${tspans}</text></g>`;
}

function svgShapeObject(obj) {
  const common = `fill="${svgEscape(obj.kind === "line" ? "none" : obj.fill || "transparent")}" stroke="${svgEscape(obj.kind === "line" ? obj.stroke || "#171411" : obj.stroke || obj.fill || "none")}" stroke-width="${svgNum(obj.kind === "line" ? Math.max(1, obj.strokeWidth || 1) : obj.strokeWidth || 0)}"${obj.strokeDash ? ' stroke-dasharray="12 8"' : ""}`;
  let node = "";
  if (obj.kind === "line") {
    node = `<line x1="0" y1="${svgNum(obj.height / 2)}" x2="${svgNum(obj.width)}" y2="${svgNum(obj.height / 2)}" stroke-linecap="butt" ${common}></line>`;
  } else if (obj.kind === "circle") {
    node = `<ellipse cx="${svgNum(obj.width / 2)}" cy="${svgNum(obj.height / 2)}" rx="${svgNum(obj.width / 2)}" ry="${svgNum(obj.height / 2)}" ${common}></ellipse>`;
  } else if (["triangle", "star", "polygon"].includes(obj.kind)) {
    node = `<path d="${svgRoundedPointsPath(shapePoints(obj), obj.radius || 0)}" ${common}></path>`;
  } else {
    node = `<path d="${svgRoundRectPath(obj.width, obj.height, obj.radius)}" ${common}></path>`;
  }
  return `<g transform="${svgTransform(obj)}" ${svgObjectStyle(obj)}>${node}</g>`;
}

function svgImageObject(obj, index) {
  const clipId = `image-clip-${index}`;
  const crop = normalizeCrop(obj.crop);
  const image = obj.maskCanvas && obj.originalImage ? obj.originalImage : obj.image;
  const naturalW = image?.naturalWidth || image?.width || obj.width;
  const naturalH = image?.naturalHeight || image?.height || obj.height;
  const rect = imageSourceRectForBox({ width: naturalW, height: naturalH }, crop);
  const imageX = -rect.sx / rect.sw * obj.width;
  const imageY = -rect.sy / rect.sh * obj.height;
  const imageW = naturalW / rect.sw * obj.width;
  const imageH = naturalH / rect.sh * obj.height;
  const clipPath = svgRoundRectPath(obj.width, obj.height, obj.radius || 0);
  return `<g transform="${svgTransform(obj)}" ${svgObjectStyle(obj)}><clipPath id="${clipId}"><path d="${clipPath}"></path></clipPath><image href="${svgEscape(obj.src)}" x="${svgNum(imageX)}" y="${svgNum(imageY)}" width="${svgNum(imageW)}" height="${svgNum(imageH)}" preserveAspectRatio="none" clip-path="url(#${clipId})"></image></g>`;
}

function objectToPngDataUrl(obj) {
  const out = document.createElement("canvas");
  out.width = Math.max(1, Math.ceil(obj.width));
  out.height = Math.max(1, Math.ceil(obj.height));
  const outCtx = out.getContext("2d");
  const copy = { ...obj, x: 0, y: 0, rotation: 0, opacity: 1, shadow: 0 };
  drawObject(outCtx, copy);
  return out.toDataURL("image/png");
}

function svgRasterFallbackObject(obj, index) {
  const dataUrl = objectToPngDataUrl(obj);
  return `<g transform="${svgTransform(obj)}" ${svgObjectStyle(obj)}><image href="${dataUrl}" x="0" y="0" width="${svgNum(obj.width)}" height="${svgNum(obj.height)}" preserveAspectRatio="none"></image></g>`;
}

function svgObject(obj, index) {
  if (obj.type === "text") return svgTextObject(obj);
  if (obj.type === "shape") return svgShapeObject(obj);
  if (obj.type === "image") return svgImageObject(obj, index);
  if (obj.type === "compoundShape") return svgRasterFallbackObject(obj, index);
  if (obj.type === "group") {
    const children = (obj.children || []).map((child, childIndex) => svgObject(child, `${index}-${childIndex}`)).join("");
    return `<g transform="${svgTransform(obj)}" ${svgObjectStyle(obj)}>${children}</g>`;
  }
  return "";
}

function exportSvgText() {
  const defs = [];
  const body = [`<rect width="100%" height="100%" fill="${svgEscape(state.background)}"></rect>`];
  state.objects.forEach((obj, index) => {
    if (obj.shadow) {
      defs.push(`<filter id="shadow-${obj.id}" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="${svgNum(obj.shadow / 3)}" dy="${svgNum(obj.shadow / 3)}" stdDeviation="${svgNum(obj.shadow / 2)}" flood-color="#000000" flood-opacity=".22"></feDropShadow></filter>`);
    }
    body.push(svgObject(obj, index));
  });
  const defsText = defs.length ? `<defs>${defs.join("")}</defs>` : "";
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${svgNum(state.width)}" height="${svgNum(state.height)}" viewBox="0 0 ${svgNum(state.width)} ${svgNum(state.height)}">${defsText}${body.join("")}</svg>\n`;
}

function drawCropEditorOverlay(c) {
  if (!cropEditor.active) return;
  const obj = state.objects.find(item => item.id === cropEditor.objectId);
  if (!obj || obj.type !== "image") return;
  c.save();
  c.translate(obj.x + obj.width / 2, obj.y + obj.height / 2);
  c.rotate((obj.rotation || 0) * Math.PI / 180);
  c.translate(-obj.width / 2, -obj.height / 2);
  c.strokeStyle = "#ffb000";
  c.lineWidth = Math.max(2, 2 / Math.max(.25, state.zoomScale || 1));
  c.setLineDash([10, 6]);
  c.strokeRect(0, 0, obj.width, obj.height);
  c.setLineDash([]);
  c.globalAlpha = .72;
  c.beginPath();
  c.moveTo(obj.width / 3, 0);
  c.lineTo(obj.width / 3, obj.height);
  c.moveTo(obj.width * 2 / 3, 0);
  c.lineTo(obj.width * 2 / 3, obj.height);
  c.moveTo(0, obj.height / 3);
  c.lineTo(obj.width, obj.height / 3);
  c.moveTo(0, obj.height * 2 / 3);
  c.lineTo(obj.width, obj.height * 2 / 3);
  c.stroke();
  c.restore();
}

function drawShapePath(c, obj) {
  c.save();
  c.translate(obj.x, obj.y);
  c.rotate((obj.rotation || 0) * Math.PI / 180);
  if (obj.kind === "circle") {
    c.beginPath();
    c.ellipse(obj.width / 2, obj.height / 2, obj.width / 2, obj.height / 2, 0, 0, Math.PI * 2);
  } else if (obj.kind === "line") {
    c.lineWidth = Math.max(1, obj.strokeWidth || 1);
    c.beginPath();
    c.rect(0, obj.height / 2 - c.lineWidth / 2, obj.width, c.lineWidth);
  } else if (["triangle", "star", "polygon"].includes(obj.kind)) {
    roundedPolygonPath(c, shapePoints(obj), obj.radius || 0);
  } else {
    roundRect(c, 0, 0, obj.width, obj.height, obj.radius || 0);
  }
  c.restore();
}

function drawCompoundShape(c, obj) {
  const buffer = document.createElement("canvas");
  buffer.width = Math.max(1, Math.ceil(obj.width));
  buffer.height = Math.max(1, Math.ceil(obj.height));
  const bctx = buffer.getContext("2d");
  bctx.fillStyle = obj.fill || "#171411";
  (obj.parts || []).forEach((part, index) => {
    if (index === 0) bctx.globalCompositeOperation = "source-over";
    else if (obj.booleanMode === "subtract") bctx.globalCompositeOperation = "destination-out";
    else if (obj.booleanMode === "intersect") bctx.globalCompositeOperation = "source-in";
    else if (obj.booleanMode === "exclude") bctx.globalCompositeOperation = "xor";
    else bctx.globalCompositeOperation = "source-over";
    drawShapePath(bctx, part);
    bctx.fill();
  });
  c.drawImage(buffer, 0, 0, obj.width, obj.height);
  if (obj.strokeWidth > 0) {
    c.strokeStyle = obj.stroke || obj.fill || "#171411";
    c.lineWidth = obj.strokeWidth;
    c.strokeRect(0, 0, obj.width, obj.height);
  }
}

function drawMaskEditorOverlay(c) {
  if (!maskEditor.active || !maskEditor.showOverlay) return;
  const obj = state.objects.find(item => item.id === maskEditor.objectId);
  if (!obj || obj.type !== "image" || !obj.maskCanvas && !obj.maskImage) return;
  c.save();
  c.translate(obj.x + obj.width / 2, obj.y + obj.height / 2);
  c.rotate((obj.rotation || 0) * Math.PI / 180);
  c.translate(-obj.width / 2, -obj.height / 2);
  const overlay = maskOverlayCanvas(obj);
  c.globalAlpha = .28;
  c.drawImage(overlay, 0, 0, obj.width, obj.height);
  c.globalAlpha = 1;
  c.strokeStyle = "rgba(0, 113, 227, .88)";
  c.lineWidth = 3;
  c.setLineDash([12, 7]);
  c.strokeRect(0, 0, obj.width, obj.height);
  c.restore();
}

function invalidateMaskOverlay() {
  maskEditor.overlayCache = null;
}

function maskOverlayCanvas(obj) {
  const source = obj.maskCanvas || obj.maskImage;
  const sourceWidth = source?.width || source?.naturalWidth || 1;
  const sourceHeight = source?.height || source?.naturalHeight || 1;
  const cache = maskEditor.overlayCache;
  if (
    cache
    && cache.objectId === obj.id
    && cache.source === source
    && cache.width === sourceWidth
    && cache.height === sourceHeight
  ) {
    return cache.canvas;
  }

  const overlay = document.createElement("canvas");
  overlay.width = Math.max(1, sourceWidth);
  overlay.height = Math.max(1, sourceHeight);
  const octx = overlay.getContext("2d");
  octx.fillStyle = "#0071e3";
  octx.fillRect(0, 0, overlay.width, overlay.height);
  octx.globalCompositeOperation = "destination-in";
  octx.drawImage(source, 0, 0, overlay.width, overlay.height);
  maskEditor.overlayCache = {
    objectId: obj.id,
    source,
    width: sourceWidth,
    height: sourceHeight,
    canvas: overlay
  };
  return overlay;
}

function drawMaskBrushPreview(c) {
  if (!maskEditor.active || !maskEditor.hoverPoint) return;
  const obj = state.objects.find(item => item.id === maskEditor.objectId);
  if (!obj || obj.type !== "image") return;
  const point = maskEditor.hoverPoint;
  const inside = point.x >= 0 && point.y >= 0 && point.x <= obj.width && point.y <= obj.height;
  c.save();
  c.translate(obj.x + obj.width / 2, obj.y + obj.height / 2);
  c.rotate((obj.rotation || 0) * Math.PI / 180);
  c.translate(-obj.width / 2, -obj.height / 2);
  c.beginPath();
  c.arc(point.x, point.y, maskEditor.brushSize / 2, 0, Math.PI * 2);
  c.fillStyle = maskEditor.mode === "keep"
    ? "rgba(18, 185, 129, .12)"
    : "rgba(255, 77, 35, .13)";
  c.strokeStyle = maskEditor.mode === "keep"
    ? "rgba(18, 185, 129, .96)"
    : "rgba(255, 77, 35, .96)";
  c.lineWidth = Math.max(2, 2 / Math.max(.25, state.zoomScale || 1));
  c.setLineDash(inside ? [] : [7, 5]);
  c.fill();
  c.stroke();
  c.beginPath();
  c.moveTo(point.x - 5, point.y);
  c.lineTo(point.x + 5, point.y);
  c.moveTo(point.x, point.y - 5);
  c.lineTo(point.x, point.y + 5);
  c.setLineDash([]);
  c.globalAlpha = .82;
  c.stroke();
  c.restore();
}

function drawStampBrushPreview(c) {
  if (!stampEditor.active || !stampEditor.hoverPoint) return;
  const obj = state.objects.find(item => item.id === stampEditor.objectId);
  if (!obj || obj.type !== "image") return;
  const point = stampEditor.hoverPoint;
  c.save();
  c.translate(obj.x + obj.width / 2, obj.y + obj.height / 2);
  c.rotate((obj.rotation || 0) * Math.PI / 180);
  c.translate(-obj.width / 2, -obj.height / 2);
  c.beginPath();
  c.arc(point.x, point.y, stampEditor.brushSize / 2, 0, Math.PI * 2);
  c.fillStyle = stampEditor.samplePoint ? "rgba(255, 176, 0, .12)" : "rgba(239, 68, 68, .1)";
  c.strokeStyle = stampEditor.samplePoint ? "rgba(255, 176, 0, .96)" : "rgba(239, 68, 68, .92)";
  c.lineWidth = Math.max(2, 2 / Math.max(.25, state.zoomScale || 1));
  c.setLineDash(stampEditor.samplePoint ? [] : [7, 5]);
  c.fill();
  c.stroke();
  if (stampEditor.samplePoint) {
    const sample = imagePixelToObjectPoint(stampEditor.samplePoint, obj);
    c.beginPath();
    c.arc(sample.x, sample.y, Math.max(5, stampEditor.brushSize * .16), 0, Math.PI * 2);
    c.setLineDash([5, 4]);
    c.strokeStyle = "rgba(255, 176, 0, .88)";
    c.stroke();
  }
  c.restore();
}

function drawSelection(c, obj) {
  c.save();
  c.translate(obj.x + obj.width / 2, obj.y + obj.height / 2);
  c.rotate((obj.rotation || 0) * Math.PI / 180);
  c.translate(-obj.width / 2, -obj.height / 2);
  c.strokeStyle = "#2563eb";
  c.lineWidth = 3;
  c.setLineDash([10, 6]);
  c.strokeRect(0, 0, obj.width, obj.height);
  c.setLineDash([]);
  c.fillStyle = "#ffffff";
  c.strokeStyle = "#2563eb";
  handlePoints(obj).forEach(p => {
    c.beginPath();
    c.rect(p.x - 8, p.y - 8, 16, 16);
    c.fill();
    c.stroke();
  });
  c.beginPath();
  c.arc(obj.width / 2, -34, 10, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  c.restore();
}

function renderSelectionOverlay() {
  const objects = selectedObjects();
  selectionOverlay.innerHTML = "";
  if (!objects.length) return;
  const scale = canvas.getBoundingClientRect().width / state.width;
  const makeBox = (bounds, className = "selection-box") => {
    const box = document.createElement("div");
    box.className = className;
    box.style.left = `${bounds.x * scale}px`;
    box.style.top = `${bounds.y * scale}px`;
    box.style.width = `${bounds.width * scale}px`;
    box.style.height = `${bounds.height * scale}px`;
    selectionOverlay.appendChild(box);
  };
  objects.forEach(obj => makeBox(obj));
  if (swipeSelect.active && swipeSelect.start && swipeSelect.current) {
    const left = Math.min(swipeSelect.start.x, swipeSelect.current.x);
    const top = Math.min(swipeSelect.start.y, swipeSelect.current.y);
    const right = Math.max(swipeSelect.start.x, swipeSelect.current.x);
    const bottom = Math.max(swipeSelect.start.y, swipeSelect.current.y);
    makeBox({
      x: left,
      y: top,
      width: Math.max(1, right - left),
      height: Math.max(1, bottom - top)
    }, "swipe-select-box");
  }
  const bounds = selectionBounds(objects);
  if (!bounds) return;
  const handlePoints = [
    { mode: "resize", name: "se", x: bounds.x + bounds.width, y: bounds.y + bounds.height },
    { mode: "rotate", name: "rotate", x: bounds.x + bounds.width / 2, y: bounds.y - 34 }
  ];
  if (cropEditor.active && objects.length === 1 && objects[0].id === cropEditor.objectId) {
    const left = objects[0].x;
    const top = objects[0].y;
    const right = objects[0].x + objects[0].width;
    const bottom = objects[0].y + objects[0].height;
    handlePoints.length = 0;
    [
      ["nw", left, top], ["n", (left + right) / 2, top], ["ne", right, top],
      ["e", right, (top + bottom) / 2], ["se", right, bottom], ["s", (left + right) / 2, bottom],
      ["sw", left, bottom], ["w", left, (top + bottom) / 2]
    ].forEach(([name, x, y]) => handlePoints.push({ mode: "crop", name, x, y }));
  }
  handlePoints.forEach(point => {
    const handle = document.createElement("button");
    handle.type = "button";
    handle.className = "selection-handle";
    handle.dataset.mode = point.mode;
    handle.dataset.name = point.name;
    handle.style.left = `${point.x * scale}px`;
    handle.style.top = `${point.y * scale}px`;
    handle.title = point.mode === "crop" ? "裁剪" : point.mode === "resize" ? "缩放" : "旋转";
    selectionOverlay.appendChild(handle);
  });
}

function handlePoints(obj) {
  return [
    { name: "nw", x: 0, y: 0 },
    { name: "ne", x: obj.width, y: 0 },
    { name: "se", x: obj.width, y: obj.height },
    { name: "sw", x: 0, y: obj.height }
  ];
}

function toLocalPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const scale = getScale();
  return {
    x: (event.clientX - rect.left) * scale,
    y: (event.clientY - rect.top) * scale
  };
}

function hitTest(point) {
  for (let i = state.objects.length - 1; i >= 0; i--) {
    const obj = state.objects[i];
    if (point.x >= obj.x && point.x <= obj.x + obj.width && point.y >= obj.y && point.y <= obj.y + obj.height) return obj;
  }
  return null;
}

function addSwipeSelectionAt(point) {
  const target = hitTest(point);
  if (!target || swipeSelect.ids.has(target.id)) return false;
  swipeSelect.ids.add(target.id);
  setSelection([...swipeSelect.ids]);
  return true;
}

function hitHandle(point, obj) {
  if (!obj) return null;
  const handles = [
    { mode: "resize", name: "se", x: obj.x + obj.width, y: obj.y + obj.height },
    { mode: "rotate", name: "rotate", x: obj.x + obj.width / 2, y: obj.y - 34 }
  ];
  return handles.find(h => Math.hypot(point.x - h.x, point.y - h.y) < 22);
}

selectionOverlay.addEventListener("pointerdown", e => {
  const handle = e.target.closest(".selection-handle");
  if (!handle) return;
  const objects = selectedObjects();
  if (!objects.length) return;
  e.preventDefault();
  const p = toLocalPoint(e);
  state.dragging = {
    mode: handle.dataset.mode,
    name: handle.dataset.name,
    start: p,
    obj: selected() ? cloneObject(selected(), { keepIds: true }) : null,
    objects: objects.map(o => cloneObject(o, { keepIds: true })),
    bounds: selectionBounds(objects),
    saved: false
  };
  selectionOverlay.setPointerCapture(e.pointerId);
});

canvas.addEventListener("pointerdown", async e => {
  if (inlineEditing) finishInlineTextEdit(true);
  if (maskEditor.active) {
    e.preventDefault();
    const hit = maskPointFromEvent(e);
    if (!hit) return;
    await ensureObjectMaskCanvas(hit.obj);
    saveHistory();
    pushMaskHistory(hit.obj);
    maskEditor.painting = true;
    maskEditor.lastPoint = null;
    canvas.setPointerCapture(e.pointerId);
    await paintMaskAt(e);
    return;
  }
  if (stampEditor.active) {
    e.preventDefault();
    const hit = stampPointFromEvent(e);
    if (!hit) return;
    await ensureObjectCloneCanvas(hit.obj);
    if (e.altKey) {
      stampEditor.samplePoint = objectPointToImagePixel(hit.point, hit.obj);
      stampEditor.sourceOffset = null;
      setStampStatus("已设置采样点。松开 Alt/Option 后拖动画笔盖印。");
      renderAll();
      syncStampControls();
      return;
    }
    if (!stampEditor.samplePoint) {
      setStampStatus("请先按住 Alt/Option 点击图片设置采样点。", "error");
      renderAll();
      return;
    }
    saveHistory();
    pushStampHistory(hit.obj);
    stampEditor.painting = true;
    stampEditor.sourceOffset = null;
    stampEditor.sourceSnapshot = cloneCanvas(stampEditorCanvas(hit.obj));
    canvas.setPointerCapture(e.pointerId);
    await paintStampAt(e);
    return;
  }
  if (panState.spaceDown) return;
  const p = toLocalPoint(e);
  const obj = selected();
  const handle = hitHandle(p, obj);
  if (handle) {
    const objects = selectedObjects();
    state.dragging = { mode: handle.mode, start: p, obj: cloneObject(obj, { keepIds: true }), objects: objects.map(o => cloneObject(o, { keepIds: true })), bounds: selectionBounds(objects), saved: false };
    canvas.setPointerCapture(e.pointerId);
    renderAll();
    syncUi();
    return;
  }
  const target = hitTest(p);
  const currentSelection = state.selectedIds || [];
  const targetAlreadySelected = !!target && currentSelection.includes(target.id);
  if (target && (e.shiftKey || e.metaKey || e.ctrlKey)) {
    toggleSelection(target.id);
  } else if (targetAlreadySelected && currentSelection.length > 1) {
    setSelection(currentSelection);
  } else {
    setSelection(target ? [target.id] : []);
  }
  if (target) {
    const objects = selectedObjects();
    state.dragging = { mode: "move", start: p, obj: cloneObject(target, { keepIds: true }), objects: objects.map(o => cloneObject(o, { keepIds: true })), saved: false };
    canvas.setPointerCapture(e.pointerId);
  } else {
    swipeSelect.active = true;
    swipeSelect.started = false;
    swipeSelect.start = p;
    swipeSelect.current = p;
    swipeSelect.ids = new Set(e.shiftKey || e.metaKey || e.ctrlKey ? state.selectedIds : []);
    canvas.setPointerCapture(e.pointerId);
  }
  renderAll();
  syncUi();
});

document.addEventListener("pointerdown", e => {
  if (!inlineEditing || e.target === inlineTextEditor) return;
  if (inlineTextEditor.contains(e.target)) return;
  finishInlineTextEdit(true);
}, true);

canvas.addEventListener("dblclick", e => {
  const target = hitTest(toLocalPoint(e));
  if (!target || target.type !== "text") return;
  e.preventDefault();
  startInlineTextEdit(target);
});

stage.addEventListener("pointerdown", e => {
  if (e.target !== stage) return;
  if (inlineEditing) finishInlineTextEdit(true);
  if (!selectedObjects().length) return;
  setSelection([]);
  renderAll();
  syncUi();
});

async function handlePointerMove(e) {
  if (maskEditor.active) {
    const hit = maskPointFromEvent(e);
    maskEditor.hoverPoint = hit ? hit.point : null;
    if (maskEditor.painting) {
      e.preventDefault();
      const events = typeof e.getCoalescedEvents === "function" ? e.getCoalescedEvents() : [e];
      for (const event of events.length ? events : [e]) {
        await paintMaskAt(event);
      }
      return;
    }
    scheduleMaskRender();
    return;
  }
  if (stampEditor.active) {
    const hit = stampPointFromEvent(e);
    stampEditor.hoverPoint = hit ? hit.point : null;
    if (stampEditor.painting) {
      e.preventDefault();
      const events = typeof e.getCoalescedEvents === "function" ? e.getCoalescedEvents() : [e];
      for (const event of events.length ? events : [e]) {
        await paintStampAt(event);
      }
      return;
    }
    scheduleStampRender();
    return;
  }
  if (swipeSelect.active) {
    const p = toLocalPoint(e);
    swipeSelect.current = p;
    const changed = addSwipeSelectionAt(p);
    swipeSelect.started = true;
    renderAll();
    if (changed) syncUi();
    return;
  }
  const objects = selectedObjects();
  if (!state.dragging || !objects.length) return;
  const p = toLocalPoint(e);
  const obj = selected();
  const dx = p.x - state.dragging.start.x;
  const dy = p.y - state.dragging.start.y;
  if (!state.dragging.saved) {
    if (Math.hypot(dx, dy) < 3) return;
    saveHistory();
    state.dragging.saved = true;
  }
  if (state.dragging.mode === "move") {
    state.dragging.objects.forEach(start => {
      const current = state.objects.find(o => o.id === start.id);
      if (!current) return;
      current.x = start.x + dx;
      current.y = start.y + dy;
    });
  }
  if (state.dragging.mode === "resize") {
    if (objects.length > 1 && state.dragging.bounds) {
      resizeObjects(objects, state.dragging.objects, state.dragging.bounds, dx, dy, e.shiftKey);
    } else if (obj) {
      resizeObject(obj, state.dragging.obj, dx, dy, e.shiftKey);
    }
  }
  if (state.dragging.mode === "crop" && obj && obj.type === "image") {
    cropObjectFromDrag(obj, state.dragging.obj, state.dragging.name, dx, dy);
  }
  if (state.dragging.mode === "rotate" && obj) {
    const cx = obj.x + obj.width / 2;
    const cy = obj.y + obj.height / 2;
    obj.rotation = Math.atan2(p.y - cy, p.x - cx) * 180 / Math.PI + 90;
  }
  renderAll();
  syncUi(false);
}

canvas.addEventListener("pointermove", handlePointerMove);
selectionOverlay.addEventListener("pointermove", handlePointerMove);
canvas.addEventListener("pointerleave", () => {
  let changed = false;
  if (maskEditor.active) {
    maskEditor.hoverPoint = null;
    changed = true;
  }
  if (stampEditor.active) {
    stampEditor.hoverPoint = null;
    changed = true;
  }
  if (changed) renderAll();
});

async function handlePointerUp() {
  if (maskEditor.painting) {
    const obj = state.objects.find(item => item.id === maskEditor.objectId);
    maskEditor.painting = false;
    maskEditor.lastPoint = null;
    if (maskEditor.dirty && obj) await commitMaskCanvas(obj);
    persist();
    syncUi(false);
    renderAll();
    return;
  }
  if (stampEditor.painting) {
    const obj = state.objects.find(item => item.id === stampEditor.objectId);
    stampEditor.painting = false;
    stampEditor.sourceOffset = null;
    stampEditor.sourceSnapshot = null;
    if (stampEditor.dirty && obj) await commitStampCanvas(obj);
    persist();
    syncUi(false);
    renderAll();
    return;
  }
  if (state.dragging) {
    const changed = state.dragging.saved;
    state.dragging = null;
    if (changed) persist();
    renderAll();
    syncUi();
  }
  if (swipeSelect.active) {
    swipeSelect.active = false;
    swipeSelect.started = false;
    swipeSelect.start = null;
    swipeSelect.current = null;
    swipeSelect.ids = new Set();
    renderAll();
    syncUi();
  }
}

canvas.addEventListener("pointerup", handlePointerUp);
selectionOverlay.addEventListener("pointerup", handlePointerUp);

stage.addEventListener("pointerdown", event => {
  if (!panState.spaceDown || maskEditor.active || stampEditor.active) return;
  event.preventDefault();
  event.stopPropagation();
  panState.active = true;
  panState.startX = event.clientX;
  panState.startY = event.clientY;
  panState.scrollLeft = stage.scrollLeft;
  panState.scrollTop = stage.scrollTop;
  document.body.classList.add("is-panning");
  stage.setPointerCapture(event.pointerId);
}, true);

stage.addEventListener("pointermove", event => {
  if (!panState.active) return;
  event.preventDefault();
  stage.scrollLeft = panState.scrollLeft - (event.clientX - panState.startX);
  stage.scrollTop = panState.scrollTop - (event.clientY - panState.startY);
});

stage.addEventListener("pointerup", event => {
  if (!panState.active) return;
  panState.active = false;
  document.body.classList.remove("is-panning");
  stage.releasePointerCapture(event.pointerId);
});

function addObject(obj) {
  saveHistory();
  state.objects.push(obj);
  setSelection([obj.id]);
  renderAll();
  syncUi();
  persist();
}

function defaultLockAspect(obj) {
  return obj.lockAspect ?? (obj.type === "image" || obj.kind === "circle");
}

function resizeObject(obj, start, dx, dy, invertLock = false) {
  const locked = invertLock ? !defaultLockAspect(obj) : defaultLockAspect(obj);
  let nextW = Math.max(28, start.width + dx);
  let nextH = Math.max(28, start.height + dy);
  if (locked) {
    const ratio = Math.max(.05, start.width / Math.max(1, start.height));
    if (Math.abs(dx) >= Math.abs(dy)) {
      nextH = nextW / ratio;
    } else {
      nextW = nextH * ratio;
    }
    nextW = Math.max(28, nextW);
    nextH = Math.max(28, nextH);
  }
  obj.width = nextW;
  obj.height = nextH;
  if (obj.type === "group" && obj.children && start.children) {
    const sx = obj.width / Math.max(1, start.width);
    const sy = obj.height / Math.max(1, start.height);
    obj.children.forEach(child => {
      const startChild = start.children.find(item => item.id === child.id);
      if (startChild) scaleObjectFromStart(child, startChild, sx, sy);
    });
  }
  if (obj.kind === "circle" && locked) {
    const size = Math.max(nextW, nextH);
    obj.width = size;
    obj.height = size;
  }
}

function resizeObjects(objects, starts, bounds, dx, dy, invertLock = false) {
  const locked = invertLock ? false : true;
  let nextW = Math.max(28, bounds.width + dx);
  let nextH = Math.max(28, bounds.height + dy);
  if (locked) {
    const ratio = Math.max(.05, bounds.width / Math.max(1, bounds.height));
    if (Math.abs(dx) >= Math.abs(dy)) nextH = nextW / ratio;
    else nextW = nextH * ratio;
  }
  const sx = nextW / Math.max(1, bounds.width);
  const sy = nextH / Math.max(1, bounds.height);
  starts.forEach(start => {
    const obj = objects.find(o => o.id === start.id);
    if (!obj) return;
    obj.x = bounds.x + (start.x - bounds.x) * sx;
    obj.y = bounds.y + (start.y - bounds.y) * sy;
    obj.width = Math.max(1, start.width * sx);
    obj.height = Math.max(1, start.height * sy);
    if (obj.type === "text") obj.fontSize = Math.max(8, start.fontSize * Math.min(sx, sy));
    if (obj.type === "group" && obj.children && start.children) {
      obj.children.forEach(child => {
        const startChild = start.children.find(item => item.id === child.id);
        if (startChild) scaleObjectFromStart(child, startChild, sx, sy);
      });
    }
  });
}

function cropObjectFromDrag(obj, start, handleName, dx, dy) {
  const crop = normalizeCrop(start.crop);
  const minSize = 28;
  const visibleXPct = Math.max(1, 100 - crop.left - crop.right);
  const visibleYPct = Math.max(1, 100 - crop.top - crop.bottom);
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  let leftDelta = 0;
  let rightDelta = 0;
  let topDelta = 0;
  let bottomDelta = 0;
  if (handleName.includes("w")) {
    leftDelta = clamp(
      dx,
      -crop.left / visibleXPct * start.width,
      start.width - minSize
    );
    crop.left += leftDelta / Math.max(1, start.width) * visibleXPct;
  }
  if (handleName.includes("e")) {
    rightDelta = clamp(
      dx,
      minSize - start.width,
      crop.right / visibleXPct * start.width
    );
    crop.right -= rightDelta / Math.max(1, start.width) * visibleXPct;
  }
  if (handleName.includes("n")) {
    topDelta = clamp(
      dy,
      -crop.top / visibleYPct * start.height,
      start.height - minSize
    );
    crop.top += topDelta / Math.max(1, start.height) * visibleYPct;
  }
  if (handleName.includes("s")) {
    bottomDelta = clamp(
      dy,
      minSize - start.height,
      crop.bottom / visibleYPct * start.height
    );
    crop.bottom -= bottomDelta / Math.max(1, start.height) * visibleYPct;
  }
  obj.x = start.x + leftDelta;
  obj.y = start.y + topDelta;
  obj.width = Math.max(minSize, start.width + rightDelta - leftDelta);
  obj.height = Math.max(minSize, start.height + bottomDelta - topDelta);
  obj.crop = normalizeCrop(crop);
  syncCropControls(obj);
}

function setCropSideWithoutStretch(obj, side, value) {
  const crop = normalizeCrop(obj.crop);
  const target = Math.max(0, Math.min(90, Number(value) || 0));
  const visibleXPct = Math.max(1, 100 - crop.left - crop.right);
  const visibleYPct = Math.max(1, 100 - crop.top - crop.bottom);
  if (side === "left") {
    const delta = (target - crop.left) / visibleXPct * obj.width;
    obj.x += delta;
    obj.width = Math.max(28, obj.width - delta);
    crop.left = target;
  }
  if (side === "right") {
    const delta = (target - crop.right) / visibleXPct * obj.width;
    obj.width = Math.max(28, obj.width - delta);
    crop.right = target;
  }
  if (side === "top") {
    const delta = (target - crop.top) / visibleYPct * obj.height;
    obj.y += delta;
    obj.height = Math.max(28, obj.height - delta);
    crop.top = target;
  }
  if (side === "bottom") {
    const delta = (target - crop.bottom) / visibleYPct * obj.height;
    obj.height = Math.max(28, obj.height - delta);
    crop.bottom = target;
  }
  obj.crop = normalizeCrop(crop);
}

function shapePartForBoolean(obj, bounds) {
  const part = JSON.parse(JSON.stringify(obj));
  part.x = obj.x - bounds.x;
  part.y = obj.y - bounds.y;
  part.image = undefined;
  return part;
}

function booleanShapeObjects(mode) {
  const objects = selectedObjects().filter(obj => obj.type === "shape" || obj.type === "compoundShape");
  if (objects.length < 2) return;
  const bounds = selectionBounds(objects);
  if (!bounds) return;
  saveHistory();
  const first = objects[0];
  const parts = objects.flatMap(obj => {
    if (obj.type === "compoundShape") {
      return (obj.parts || []).map(part => ({
        ...part,
        x: obj.x + part.x - bounds.x,
        y: obj.y + part.y - bounds.y
      }));
    }
    return [shapePartForBoolean(obj, bounds)];
  });
  const compound = {
    id: uid(),
    type: "compoundShape",
    name: mode === "union" ? "并集图形" : mode === "subtract" ? "相减图形" : mode === "intersect" ? "相交图形" : "异或图形",
    x: bounds.x,
    y: bounds.y,
    width: Math.max(1, bounds.width),
    height: Math.max(1, bounds.height),
    rotation: 0,
    opacity: 1,
    fill: first.fill === "transparent" ? first.stroke || "#171411" : first.fill || "#171411",
    stroke: first.stroke || "#171411",
    strokeWidth: 0,
    shadow: 0,
    lockAspect: false,
    booleanMode: mode,
    parts
  };
  const ids = new Set(objects.map(obj => obj.id));
  const insertAt = Math.min(...objects.map(obj => state.objects.indexOf(obj)).filter(index => index >= 0));
  state.objects = state.objects.filter(obj => !ids.has(obj.id));
  state.objects.splice(Math.max(0, insertAt), 0, compound);
  setSelection([compound.id]);
  renderAll();
  syncUi();
  persist();
}

function groupSelectedLayers() {
  const objects = selectedObjects();
  if (objects.length < 2) return;
  const bounds = selectionBounds(objects);
  if (!bounds) return;
  saveHistory();
  const ids = new Set(objects.map(obj => obj.id));
  const insertAt = Math.min(...objects.map(obj => state.objects.indexOf(obj)).filter(index => index >= 0));
  const children = state.objects
    .filter(obj => ids.has(obj.id))
    .map(obj => {
      const child = cloneObject(obj, { keepIds: true });
      child.x -= bounds.x;
      child.y -= bounds.y;
      return child;
    });
  const group = {
    id: uid(),
    type: "group",
    name: `编组 ${children.length}`,
    x: bounds.x,
    y: bounds.y,
    width: Math.max(1, bounds.width),
    height: Math.max(1, bounds.height),
    rotation: 0,
    opacity: 1,
    shadow: 0,
    lockAspect: false,
    children
  };
  state.objects = state.objects.filter(obj => !ids.has(obj.id));
  state.objects.splice(Math.max(0, insertAt), 0, group);
  setSelection([group.id]);
  renderAll();
  syncUi();
  persist();
}

function ungroupObject(group) {
  const angle = (group.rotation || 0) * Math.PI / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const centerX = group.width / 2;
  const centerY = group.height / 2;
  return (group.children || []).map(child => {
    const next = cloneObject(child, { keepIds: true });
    const childCenterX = child.x + child.width / 2;
    const childCenterY = child.y + child.height / 2;
    const dx = childCenterX - centerX;
    const dy = childCenterY - centerY;
    const rotatedX = dx * cos - dy * sin + centerX;
    const rotatedY = dx * sin + dy * cos + centerY;
    next.x = group.x + rotatedX - child.width / 2;
    next.y = group.y + rotatedY - child.height / 2;
    next.rotation = (next.rotation || 0) + (group.rotation || 0);
    return next;
  });
}

function ungroupSelectedLayers() {
  const groups = selectedObjects().filter(obj => obj.type === "group");
  if (!groups.length) return;
  saveHistory();
  const selectedIds = [];
  groups.forEach(group => {
    const index = state.objects.indexOf(group);
    if (index < 0) return;
    const children = ungroupObject(group);
    state.objects.splice(index, 1, ...children);
    selectedIds.push(...children.map(child => child.id));
  });
  setSelection(selectedIds);
  renderAll();
  syncUi();
  persist();
}

function updateSelected(patch) {
  const obj = selected();
  if (!obj) return;
  const start = obj.type === "group" ? cloneObject(obj, { keepIds: true }) : null;
  Object.assign(obj, patch);
  if (start && (patch.width != null || patch.height != null)) {
    const sx = obj.width / Math.max(1, start.width);
    const sy = obj.height / Math.max(1, start.height);
    obj.children.forEach(child => {
      const startChild = start.children.find(item => item.id === child.id);
      if (startChild) scaleObjectFromStart(child, startChild, sx, sy);
    });
  }
  renderAll();
  syncUi(false);
  syncTransformInputs(obj);
  syncInspectorOutputs();
  persist();
}

function wire(id, event, fn) {
  document.getElementById(id).addEventListener(event, fn);
}

function promptEls() {
  const ids = [
    "genTitle",
    "genUseCase",
    "genAudience",
    "genAspect",
    "genStyle",
    "genDensity",
    "genSelling",
    "genDeparture",
    "genDestination",
    "genDays",
    "genItinerary",
    "genPoints",
    "genTime",
    "genPrice",
    "genExtra",
    "generatedPrompt",
    "imageApiKey",
    "imageModel",
    "imageResolution",
    "generateImageBtn",
    "generationProgress",
    "generationProgressFill",
    "generationElapsed",
    "generationRemaining",
    "canvasGenerationPlaceholder",
    "canvasGenerationTitle",
    "canvasGenerationText",
    "canvasGenerationFill",
    "promptStatus"
  ];
  return Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
}

function updatePromptSpecialFields() {
  const els = promptEls();
  const useCase = els.genUseCase.value;
  document.getElementById("genItineraryField").classList.toggle("hidden", useCase !== "行程卡片");
  document.getElementById("genPointsField").classList.toggle("hidden", useCase !== "地图路线图");
}

function generateTourismPrompt() {
  const els = promptEls();
  const title = els.genTitle.value.trim() || "杭州周边两日游";
  const useCase = els.genUseCase.value;
  const audience = els.genAudience.value;
  const aspect = els.genAspect.value;
  const style = els.genStyle.value;
  const density = els.genDensity.value;
  const selling = els.genSelling.value.trim() || "山水、民宿、轻徒步、美食";
  const departure = els.genDeparture.value.trim();
  const destination = els.genDestination.value.trim();
  const days = els.genDays.value.trim();
  const itinerary = els.genItinerary.value.trim();
  const points = els.genPoints.value.trim();
  const time = els.genTime.value.trim();
  const price = els.genPrice.value.trim();
  const extra = els.genExtra.value.trim();
  const overlayItems = [
    !time && "日期",
    !price && "价格",
    "CTA",
    "品牌信息"
  ].filter(Boolean);
  const overlayText = overlayItems.length > 1
    ? `${overlayItems.slice(0, -1).join("、")} 和${overlayItems[overlayItems.length - 1]}`
    : overlayItems[0];
  const routeLines = [
    departure && `出发地：${departure}`,
    destination && `目的地：${destination}`,
    days && `天数：${days}`,
    useCase === "行程卡片" && itinerary && `行程内容：${itinerary}`,
    useCase === "地图路线图" && points && `点位内容：${points}`,
    time && `出发时间：${time}`,
    price && `价格：${price}`
  ].filter(Boolean).join("\n");
  const extraLine = extra ? `\n补充要求：${extra}` : "";
  const prompt = `请生成一张适用于游侠客官网、公众号、小红书和朋友圈宣发的${aspect}旅游海报。
主题：${title}
用途：${useCase}
目标客群：${audience}
核心卖点：${selling}
${routeLines ? `${routeLines}\n` : ""}风格方向：${style}。
文字要求：${density}，只保留必要信息，不要让画面过于拥挤。
画面要求：
- 主视觉突出目的地或线路氛围
- 预留顶部标题区和底部报名信息区
- 适合后期叠加${overlayText}
- 画面构图稳定，信息层级清楚
- 更像高质量旅游品牌海报，而不是普通拼图
品牌要求：
- 适合游侠客旅游品牌宣发
- 预留品牌 LOGO 位
- 整体气质专业、利落、可信赖${extraLine}`;

  els.generatedPrompt.value = prompt;
  return prompt;
}

function greatestCommonDivisor(a, b) {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) {
    const next = a % b;
    a = b;
    b = next;
  }
  return a || 1;
}

function canvasAspectLabel() {
  const divisor = greatestCommonDivisor(state.width, state.height);
  const w = Math.max(1, Math.round(state.width / divisor));
  const h = Math.max(1, Math.round(state.height / divisor));
  const orientation = w === h ? "方图" : w > h ? "横版" : "竖版";
  return `${w}:${h} ${orientation}`;
}

function syncPromptAspectToCanvas() {
  const select = document.getElementById("genAspect");
  if (!select) return;
  const label = canvasAspectLabel();
  let option = [...select.options].find(item => item.value === label || item.textContent === label);
  if (!option) {
    option = [...select.options].find(item => item.dataset.canvasAspect === "true");
  }
  if (!option) {
    option = document.createElement("option");
    option.dataset.canvasAspect = "true";
    select.prepend(option);
  }
  option.value = label;
  option.textContent = label;
  select.value = label;
}

async function copyPromptText(value, message = "已复制 Prompt") {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
    } else {
      const area = document.createElement("textarea");
      area.value = value;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.focus();
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    document.getElementById("promptStatus").textContent = message;
  } catch (error) {
    document.getElementById("promptStatus").textContent = "复制失败，请手动选择生成结果复制。";
  }
}

function setPromptStatus(message, mode = "") {
  const status = document.getElementById("promptStatus");
  status.textContent = message;
  status.classList.toggle("is-loading", mode === "loading");
  status.classList.toggle("is-error", mode === "error");
}

function openAIImageSizeForCurrentCanvas() {
  const ratio = state.width / Math.max(1, state.height);
  if (ratio > 1.18) return "1536x1024";
  if (ratio < .82) return "1024x1536";
  return "1024x1024";
}

function startGenerationProgress() {
  const els = promptEls();
  const startedAt = Date.now();
  els.generationProgress.classList.remove("hidden");
  els.generationProgressFill.style.width = "1%";
  els.canvasGenerationPlaceholder.classList.remove("hidden", "is-done", "is-error");
  els.canvasGenerationTitle.textContent = "正在生成图片";
  els.canvasGenerationText.textContent = "OpenAI 正在根据 Prompt 生成，完成后会自动加入画布。";
  els.canvasGenerationFill.style.width = "1%";
  const tick = () => {
    const elapsed = Math.max(0, Math.round((Date.now() - startedAt) / 1000));
    els.generationElapsed.textContent = `已耗时 ${elapsed}s`;
    if (!els.generationRemaining.textContent || els.generationRemaining.textContent === "预计剩余 --") {
      els.generationRemaining.textContent = "官方接口生成中";
    }
    const softProgress = Math.min(92, 8 + Math.floor(elapsed * 3.2));
    els.generationProgressFill.style.width = `${softProgress}%`;
    els.canvasGenerationFill.style.width = `${softProgress}%`;
    els.canvasGenerationText.textContent = `OpenAI 正在生成中，已耗时 ${elapsed}s。完成后会自动加入画布。`;
  };
  tick();
  window.clearInterval(window.__generationProgressTimer);
  window.__generationProgressTimer = window.setInterval(tick, 1000);
}

function updateGenerationProgress(message, percent) {
  const els = promptEls();
  const progress = Math.max(1, Math.min(99, Math.round(Number(percent || 0))));
  els.generationProgressFill.style.width = `${progress}%`;
  els.generationRemaining.textContent = message || `进度 ${progress}%`;
  els.canvasGenerationFill.style.width = `${progress}%`;
  els.canvasGenerationText.textContent = message || `生成进度 ${progress}%`;
}

function stopGenerationProgress(done = false) {
  const els = promptEls();
  window.clearInterval(window.__generationProgressTimer);
  window.__generationProgressTimer = null;
  if (done) {
    els.generationProgressFill.style.width = "100%";
    els.generationRemaining.textContent = "完成";
    els.canvasGenerationPlaceholder.classList.add("is-done");
    els.canvasGenerationTitle.textContent = "图片生成完成";
    els.canvasGenerationText.textContent = "正在把生成结果加入画布。";
    els.canvasGenerationFill.style.width = "100%";
    window.setTimeout(() => {
      els.generationProgress.classList.add("hidden");
      els.generationProgressFill.style.width = "0%";
      els.canvasGenerationPlaceholder.classList.add("hidden");
      els.canvasGenerationPlaceholder.classList.remove("is-done", "is-error");
      els.canvasGenerationFill.style.width = "0%";
    }, 900);
  } else {
    els.generationProgress.classList.add("hidden");
    els.generationProgressFill.style.width = "0%";
    els.canvasGenerationPlaceholder.classList.add("hidden");
    els.canvasGenerationPlaceholder.classList.remove("is-done", "is-error");
    els.canvasGenerationFill.style.width = "0%";
  }
}

function failGenerationProgress(message) {
  const els = promptEls();
  window.clearInterval(window.__generationProgressTimer);
  window.__generationProgressTimer = null;
  els.generationProgressFill.style.width = "100%";
  els.generationRemaining.textContent = "失败";
  els.canvasGenerationPlaceholder.classList.remove("hidden", "is-done");
  els.canvasGenerationPlaceholder.classList.add("is-error");
  els.canvasGenerationTitle.textContent = "生成失败";
  els.canvasGenerationText.textContent = message || "请检查 API Key、额度或网络连接后重试。";
  els.canvasGenerationFill.style.width = "100%";
  window.setTimeout(() => {
    els.generationProgress.classList.add("hidden");
    els.generationProgressFill.style.width = "0%";
    els.canvasGenerationPlaceholder.classList.add("hidden");
    els.canvasGenerationPlaceholder.classList.remove("is-error");
    els.canvasGenerationFill.style.width = "0%";
  }, 2600);
}

async function addGeneratedImageToCanvas(src) {
  const stableSrc = src.startsWith("data:") ? src : await assetSourceToDataUrl(src);
  let img;
  try {
    img = await loadImage(stableSrc);
  } catch (err) {
    if (stableSrc === src && /^https?:\/\//i.test(src)) {
      img = await loadImage(src, false);
    } else {
      throw err;
    }
  }
  const maxW = state.width * .9;
  const maxH = state.height * .9;
  const ratio = img.width / Math.max(1, img.height);
  let width = Math.min(maxW, img.width);
  let height = width / ratio;
  if (height > maxH) {
    height = maxH;
    width = height * ratio;
  }
  const obj = imageObject(
    img,
    (state.width - width) / 2,
    (state.height - height) / 2,
    width,
    height,
    stableSrc
  );
  obj.name = "AI 生成图片";
  addObject(obj);
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.code && payload.code !== 200) {
    const message = payload.error?.message || payload.message || `接口请求失败：${response.status}`;
    throw new Error(message);
  }
  return payload;
}

function openExternalLink(url) {
  const opener = window.__TAURI__?.opener;
  if (opener?.openUrl) {
    opener.openUrl(url).catch(() => window.open(url, "_blank", "noopener"));
    return;
  }
  window.open(url, "_blank", "noopener");
}

function unsplashEls() {
  return {
    accessKey: document.getElementById("unsplashAccessKey"),
    query: document.getElementById("unsplashQuery"),
    searchBtn: document.getElementById("unsplashSearchBtn"),
    loadMoreBtn: document.getElementById("unsplashLoadMoreBtn"),
    keyHelpBtn: document.getElementById("unsplashKeyHelpBtn"),
    results: document.getElementById("unsplashResults"),
    status: document.getElementById("unsplashStatus")
  };
}

function setUnsplashStatus(message, type = "") {
  const status = document.getElementById("unsplashStatus");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("is-error", type === "error");
}

async function requestUnsplashJson(path, apiKey, params = {}) {
  const url = new URL(/^https?:\/\//i.test(path) ? path : `${UNSPLASH_API_BASE}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
  });
  return requestJson(url.toString(), {
    headers: {
      "Authorization": `Client-ID ${apiKey}`,
      "Accept": "application/json"
    }
  });
}

function renderUnsplashResults() {
  const els = unsplashEls();
  els.results.innerHTML = "";
  if (!unsplashState.results.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = unsplashState.loading ? "正在搜索 Unsplash..." : "暂无结果，换个关键词试试。";
    els.results.appendChild(empty);
    els.loadMoreBtn.disabled = true;
    return;
  }
  unsplashState.results.forEach(photo => {
    const card = document.createElement("div");
    card.className = "stock-card";
    const photoButton = document.createElement("button");
    photoButton.className = "stock-photo-btn";
    photoButton.type = "button";
    photoButton.title = "加入画布";

    const img = document.createElement("img");
    img.src = photo.urls?.small || photo.urls?.thumb || "";
    img.alt = photo.alt_description || photo.description || "Unsplash photo";
    img.loading = "lazy";

    const meta = document.createElement("span");
    meta.className = "stock-meta";
    const title = document.createElement("strong");
    title.textContent = photo.alt_description || photo.description || "Unsplash 图片";
    const credit = document.createElement("span");
    credit.append("Photo by ");
    const userLink = document.createElement("a");
    userLink.href = photo.user?.links?.html || "https://unsplash.com";
    userLink.target = "_blank";
    userLink.rel = "noopener noreferrer";
    userLink.textContent = photo.user?.name || "Unsplash";
    const unsplashLink = document.createElement("a");
    unsplashLink.href = "https://unsplash.com";
    unsplashLink.target = "_blank";
    unsplashLink.rel = "noopener noreferrer";
    unsplashLink.textContent = "Unsplash";
    credit.append(userLink, " on ", unsplashLink);
    meta.append(title, credit);
    photoButton.appendChild(img);
    photoButton.addEventListener("click", () => addUnsplashPhotoToCanvas(photo));
    card.append(photoButton, meta);
    els.results.appendChild(card);
  });
  els.loadMoreBtn.disabled = unsplashState.loading || unsplashState.page >= unsplashState.totalPages;
}

async function searchUnsplashPhotos({ reset = true } = {}) {
  const els = unsplashEls();
  const apiKey = els.accessKey.value.trim();
  const query = els.query.value.trim();
  if (!apiKey) {
    setUnsplashStatus("请先填写自己的 Unsplash Access Key。", "error");
    els.accessKey.focus();
    return;
  }
  if (!query) {
    setUnsplashStatus("请输入搜索关键词。", "error");
    els.query.focus();
    return;
  }
  localStorage.setItem(UNSPLASH_ACCESS_KEY_STORAGE, apiKey);
  if (reset) {
    unsplashState.query = query;
    unsplashState.page = 1;
    unsplashState.totalPages = 0;
    unsplashState.results = [];
  } else {
    unsplashState.page += 1;
  }
  unsplashState.loading = true;
  els.searchBtn.disabled = true;
  els.loadMoreBtn.disabled = true;
  renderUnsplashResults();
  setUnsplashStatus("正在搜索 Unsplash...", "loading");
  try {
    const payload = await requestUnsplashJson("/search/photos", apiKey, {
      query: unsplashState.query,
      page: unsplashState.page,
      per_page: 12,
      content_filter: "high"
    });
    unsplashState.totalPages = payload.total_pages || 0;
    const results = Array.isArray(payload.results) ? payload.results : [];
    unsplashState.results = reset ? results : [...unsplashState.results, ...results];
    setUnsplashStatus(results.length ? `已加载 ${unsplashState.results.length} 张图片。点击图片加入画布。` : "没有找到图片，换个关键词试试。");
  } catch (error) {
    const message = error?.message || "Unsplash 搜索失败，请检查 Key、额度或网络。";
    setUnsplashStatus(`搜索失败：${message}`, "error");
  } finally {
    unsplashState.loading = false;
    els.searchBtn.disabled = false;
    renderUnsplashResults();
  }
}

async function trackUnsplashDownload(photo, apiKey) {
  const location = photo?.links?.download_location;
  if (!location) return;
  try {
    await requestUnsplashJson(location, apiKey);
  } catch (error) {
    console.warn("Unsplash download tracking failed", error);
  }
}

async function addUnsplashPhotoToCanvas(photo) {
  const els = unsplashEls();
  const apiKey = els.accessKey.value.trim();
  if (!apiKey) {
    setUnsplashStatus("请先填写自己的 Unsplash Access Key。", "error");
    return;
  }
  const src = photo.urls?.regular || photo.urls?.full || photo.urls?.small;
  if (!src) {
    setUnsplashStatus("这张图片缺少可用地址。", "error");
    return;
  }
  setUnsplashStatus("正在下载图片并加入画布...", "loading");
  try {
    await trackUnsplashDownload(photo, apiKey);
    const stableSrc = await assetSourceToDataUrl(src);
    await addImageSourceToCanvas(stableSrc, {
      name: `Unsplash - ${photo.user?.name || "photo"}`
    });
    setUnsplashStatus(`已加入画布：Photo by ${photo.user?.name || "Unsplash"} on Unsplash`);
  } catch (error) {
    const message = error?.message || "图片加入失败，请检查网络。";
    setUnsplashStatus(`加入失败：${message}`, "error");
  }
}

function extractImageSourceFromContent(content) {
  if (!content) return "";
  if (typeof content !== "string") {
    if (Array.isArray(content)) {
      for (const part of content) {
        const found = extractImageSourceFromContent(part?.image_url?.url || part?.imageUrl?.url || part?.url || part?.text || part?.content);
        if (found) return found;
      }
    }
    return "";
  }
  const text = content.trim();
  if (!text) return "";
  if (text.startsWith("data:image/")) return text;
  const dataMatch = text.match(/data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/);
  if (dataMatch) return dataMatch[0];
  const markdownMatch = text.match(/!\[[^\]]*\]\((https?:\/\/[^)\s]+|data:image\/[^)\s]+)\)/);
  if (markdownMatch) return markdownMatch[1];
  const urlMatch = text.match(/https?:\/\/\S+\.(?:png|jpe?g|webp)(?:\?\S*)?/i);
  if (urlMatch) return urlMatch[0].replace(/[),.;]+$/, "");
  try {
    const parsed = JSON.parse(text);
    return extractImageSourceFromContent(parsed?.url || parsed?.image_url || parsed?.imageUrl || parsed?.b64_json || parsed?.base64 || parsed?.data);
  } catch (_) {
    return "";
  }
}

function extractOpenAIImageSource(payload) {
  const first = Array.isArray(payload?.data) ? payload.data[0] : null;
  if (first?.b64_json) return `data:image/png;base64,${first.b64_json}`;
  if (first?.url) return first.url;
  throw new Error("OpenAI 没有返回图片数据。");
}

async function requestOpenAIImage(apiKey, body) {
  const desktop = window.youdesignDesktop;
  if (desktop?.generateOpenAIImage) {
    updateGenerationProgress("OpenAI 正在生成图片", 18);
    return desktop.generateOpenAIImage({ apiKey, ...body });
  }
  const payload = await requestJson(`${OPENAI_IMAGE_API_BASE}/images/generations`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  return extractOpenAIImageSource(payload);
}

async function generateImageFromPrompt() {
  const els = promptEls();
  const apiKey = els.imageApiKey.value.trim();
  if (!apiKey) {
    setPromptStatus("请先填写自己的 OpenAI API Key。", "error");
    els.imageApiKey.focus();
    return;
  }
  localStorage.setItem(IMAGE_API_KEY_STORAGE, apiKey);
  const prompt = els.generatedPrompt.value || generateTourismPrompt();
  const model = els.imageModel.value.trim() || "gpt-image-2";
  const quality = els.imageResolution.value || "medium";
  els.generateImageBtn.disabled = true;
  startGenerationProgress();
  setPromptStatus("正在调用 OpenAI 官方生图接口...", "loading");
  try {
    const imageSrc = await requestOpenAIImage(apiKey, {
      model,
      prompt,
      n: 1,
      size: openAIImageSizeForCurrentCanvas(),
      quality
    });
    setPromptStatus("图片已生成，正在加入画布...", "loading");
    await addGeneratedImageToCanvas(imageSrc);
    stopGenerationProgress(true);
    setPromptStatus("已生成图片并加入画布。");
  } catch (error) {
    const message = error?.message || String(error || "") || "请检查 OpenAI API Key、额度或网络连接。";
    console.error("OpenAI image generation failed", error);
    failGenerationProgress(message);
    setPromptStatus(`生成失败：${message}`, "error");
  } finally {
    els.generateImageBtn.disabled = false;
  }
}

function imageToolEls() {
  const ids = [
    "toggleCropBtn",
    "cropPanel",
    "cropLeft",
    "cropRight",
    "cropTop",
    "cropBottom",
    "resetCropBtn",
    "finishCropBtn",
    "removeBgBtn",
    "startMaskEditBtn",
    "restoreImageBtn",
    "startStampEditBtn",
    "stampEditPanel",
    "stampStatus",
    "stampBrushSize",
    "stampBrushSizeValue",
    "stampBrushHardness",
    "stampBrushHardnessValue",
    "stampUndoBtn",
    "finishStampEditBtn",
    "maskEditPanel",
    "maskKeepBtn",
    "maskEraseBtn",
    "maskBrushSize",
    "maskBrushSizeValue",
    "maskBrushHardness",
    "maskBrushHardnessValue",
    "maskShowOverlay",
    "maskUndoBtn",
    "finishMaskEditBtn",
    "maskStatus"
  ];
  return Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
}

function setMaskStatus(message, mode = "idle") {
  const status = document.getElementById("maskStatus");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("is-loading", mode === "loading");
  status.classList.toggle("is-error", mode === "error");
}

function setStampStatus(message, mode = "idle") {
  const status = document.getElementById("stampStatus");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("is-loading", mode === "loading");
  status.classList.toggle("is-error", mode === "error");
}

async function loadRmbgPipeline() {
  if (!rmbgPipelinePromise) {
    rmbgPipelinePromise = createRmbgPipeline().catch(error => {
      rmbgPipelinePromise = null;
      throw new Error(formatRmbgLoadError(error));
    });
  }
  return rmbgPipelinePromise;
}

async function createRmbgPipeline() {
  const failures = [];
  for (const source of TRANSFORMERS_MODULES) {
    try {
      const { pipeline, env } = await import(source.url);
      env.allowLocalModels = false;
      env.useBrowserCache = true;
      env.backends.onnx.wasm.wasmPaths = source.wasmBase;
      return pipeline("image-segmentation", RMBG_MODEL_ID);
    } catch (error) {
      failures.push(`${source.url}: ${error?.message || error}`);
    }
  }
  throw new Error(failures.join(" | "));
}

function formatRmbgLoadError(error) {
  const message = error?.message || String(error || "");
  if (/load\s*failed|failed\s*to\s*fetch|network|fetch/i.test(message)) {
    return `RMBG 模型加载失败：请确认当前网络可以访问 cdn.jsdelivr.net、huggingface.co 和 xethub.hf.co，然后重试。原始错误：${message}`;
  }
  if (/content security policy|csp|wasm|worker/i.test(message)) {
    return `RMBG 模型加载被安全策略拦截：请重新打包安装最新版本后重试。原始错误：${message}`;
  }
  return `RMBG 模型加载失败：${message}`;
}

function imageLikeToCanvas(source) {
  if (!source) throw new Error("没有可用的蒙版数据。");
  if (source instanceof HTMLCanvasElement) return source;
  const out = document.createElement("canvas");
  if (source instanceof ImageData) {
    out.width = source.width;
    out.height = source.height;
    out.getContext("2d").putImageData(source, 0, 0);
    return out;
  }
  if (source.data && source.width && source.height) {
    out.width = source.width;
    out.height = source.height;
    const data = source.data;
    const imageData = out.getContext("2d").createImageData(source.width, source.height);
    if (data.length === source.width * source.height) {
      for (let i = 0; i < data.length; i++) {
        const value = data[i];
        const offset = i * 4;
        imageData.data[offset] = value;
        imageData.data[offset + 1] = value;
        imageData.data[offset + 2] = value;
        imageData.data[offset + 3] = 255;
      }
    } else {
      imageData.data.set(data.slice ? data.slice(0, imageData.data.length) : data);
    }
    out.getContext("2d").putImageData(imageData, 0, 0);
    return out;
  }
  if (typeof source.toCanvas === "function") return source.toCanvas();
  throw new Error("RMBG 返回了无法识别的蒙版格式。");
}

function extractRmbgMaskCanvas(result) {
  const candidate = Array.isArray(result)
    ? result[0]?.mask || result[0]?.image || result[0]
    : result?.mask || result?.image || result;
  return normalizeMaskCanvas(imageLikeToCanvas(candidate));
}

function normalizeMaskCanvas(maskCanvas) {
  const normalized = document.createElement("canvas");
  normalized.width = maskCanvas.width;
  normalized.height = maskCanvas.height;
  const nctx = normalized.getContext("2d");
  nctx.drawImage(maskCanvas, 0, 0);
  const imageData = nctx.getImageData(0, 0, normalized.width, normalized.height);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const alpha = imageData.data[i + 3];
    const luma = Math.round(imageData.data[i] * .299 + imageData.data[i + 1] * .587 + imageData.data[i + 2] * .114);
    const value = alpha < 255 ? alpha : luma;
    imageData.data[i] = 255;
    imageData.data[i + 1] = 255;
    imageData.data[i + 2] = 255;
    imageData.data[i + 3] = value;
  }
  nctx.putImageData(imageData, 0, 0);
  return normalized;
}

async function canvasToImage(canvasLike) {
  const dataUrl = canvasLike.toDataURL("image/png");
  return loadImage(dataUrl);
}

async function ensureObjectMaskCanvas(obj) {
  if (obj.originalSrc && !obj.originalImage) obj.originalImage = await loadImage(obj.originalSrc);
  if (!obj.maskCanvas) {
    if (obj.maskSrc) {
      const maskImage = obj.maskImage || await loadImage(obj.maskSrc);
      obj.maskImage = maskImage;
      const canvasEl = document.createElement("canvas");
      canvasEl.width = maskImage.naturalWidth || maskImage.width;
      canvasEl.height = maskImage.naturalHeight || maskImage.height;
      canvasEl.getContext("2d").drawImage(maskImage, 0, 0, canvasEl.width, canvasEl.height);
      obj.maskCanvas = canvasEl;
    } else {
      const baseImage = await loadImage(obj.originalSrc || obj.src);
      obj.originalImage = obj.originalSrc ? baseImage : obj.originalImage;
      const canvasEl = document.createElement("canvas");
      canvasEl.width = baseImage.naturalWidth || baseImage.width;
      canvasEl.height = baseImage.naturalHeight || baseImage.height;
      const mctx = canvasEl.getContext("2d");
      mctx.fillStyle = "#ffffff";
      mctx.fillRect(0, 0, canvasEl.width, canvasEl.height);
      obj.maskCanvas = canvasEl;
    }
  }
  return obj.maskCanvas;
}

async function composeMaskedImage(obj, maskCanvas) {
  const source = obj.originalSrc || obj.src;
  const original = obj.originalImage || await loadImage(source);
  obj.originalImage = original;
  const width = original.naturalWidth || original.width;
  const height = original.naturalHeight || original.height;
  const out = document.createElement("canvas");
  out.width = width;
  out.height = height;
  const octx = out.getContext("2d");
  octx.drawImage(original, 0, 0, width, height);
  octx.globalCompositeOperation = "destination-in";
  octx.drawImage(maskCanvas, 0, 0, width, height);
  const dataUrl = out.toDataURL("image/png");
  obj.src = dataUrl;
  obj.image = await loadImage(dataUrl);
  obj.maskSrc = maskCanvas.toDataURL("image/png");
  obj.maskImage = await loadImage(obj.maskSrc);
  obj.maskCanvas = maskCanvas;
  obj.maskVersion = (obj.maskVersion || 0) + 1;
  obj.maskedRenderCache = null;
  invalidateMaskOverlay();
  obj.rmbgEdited = true;
}

async function commitMaskCanvas(obj) {
  if (!obj || !obj.maskCanvas) return;
  obj.maskSrc = obj.maskCanvas.toDataURL("image/png");
  obj.maskImage = await loadImage(obj.maskSrc);
  obj.maskVersion = (obj.maskVersion || 0) + 1;
  obj.maskedRenderCache = null;
  invalidateMaskOverlay();
  obj.rmbgEdited = true;
  maskEditor.dirty = false;
}

function scheduleMaskRender() {
  if (maskEditor.renderQueued) return;
  maskEditor.renderQueued = true;
  requestAnimationFrame(() => {
    maskEditor.renderQueued = false;
    renderAll();
  });
}

async function removeBackgroundFromSelected() {
  const obj = selected();
  if (!obj || obj.type !== "image") return;
  const confirmed = localStorage.getItem("youdesign-rmbg-download-ok") === "1"
    || await appConfirm("首次使用需要联网下载 RMBG-1.4 模型。下载后图片会在本机处理，不会上传。", {
      title: "下载抠图模型",
      confirmText: "下载并抠图"
    });
  if (!confirmed) return;
  localStorage.setItem("youdesign-rmbg-download-ok", "1");
  const btn = document.getElementById("removeBgBtn");
  btn.disabled = true;
  setMaskStatus("正在加载 RMBG-1.4 模型，首次使用会稍慢...", "loading");
  try {
    await normalizeObjectImageSource(obj);
    if (!obj.originalSrc) obj.originalSrc = obj.src;
    const pipe = await loadRmbgPipeline();
    setMaskStatus("模型已就绪，正在生成主体蒙版...", "loading");
    const result = await pipe(obj.originalSrc || obj.src);
    const maskCanvas = extractRmbgMaskCanvas(result);
    saveHistory();
    await composeMaskedImage(obj, maskCanvas);
    startMaskEdit(obj);
    setMaskStatus("已完成自动抠图。可以用保留/擦除画笔继续修边。");
    renderAll();
    syncUi();
    persist();
  } catch (error) {
    console.error("RMBG failed", error);
    setMaskStatus(error?.message || "抠图失败，请检查网络后重试。", "error");
  } finally {
    btn.disabled = false;
  }
}

function startMaskEdit(obj = selected()) {
  if (!obj || obj.type !== "image") return;
  if (stampEditor.active) stopStampEdit(false);
  maskEditor.active = true;
  maskEditor.objectId = obj.id;
  maskEditor.painting = false;
  maskEditor.lastPoint = null;
  maskEditor.hoverPoint = null;
  maskEditor.history = [];
  invalidateMaskOverlay();
  maskEditor.dirty = false;
  document.body.classList.add("mask-editing");
  syncMaskControls();
  renderAll();
}

async function startMaskEditFromSelected() {
  const obj = selected();
  if (!obj || obj.type !== "image") return;
  try {
    await normalizeObjectImageSource(obj);
    if (!obj.originalSrc) obj.originalSrc = obj.src;
    await ensureObjectMaskCanvas(obj);
    if (!obj.maskSrc) {
      obj.maskSrc = obj.maskCanvas.toDataURL("image/png");
      obj.maskImage = await loadImage(obj.maskSrc);
    }
    startMaskEdit(obj);
    setMaskStatus("已进入修边模式。用擦除画笔去背景，用保留画笔恢复主体。");
    persist();
  } catch (error) {
    setMaskStatus(error?.message || "无法进入修边模式。", "error");
  }
}

function stopMaskEdit(shouldPersist = true) {
  const obj = state.objects.find(item => item.id === maskEditor.objectId);
  if (shouldPersist && maskEditor.dirty && obj?.maskCanvas) {
    obj.maskSrc = obj.maskCanvas.toDataURL("image/png");
    obj.rmbgEdited = true;
  }
  maskEditor.active = false;
  maskEditor.painting = false;
  maskEditor.lastPoint = null;
  maskEditor.history = [];
  invalidateMaskOverlay();
  maskEditor.dirty = false;
  document.body.classList.remove("mask-editing");
  if (shouldPersist) persist();
  syncMaskControls();
  renderAll();
}

async function startStampEdit(obj = selected()) {
  if (!obj || obj.type !== "image") return;
  if (maskEditor.active) stopMaskEdit(false);
  if (cropEditor.active) stopCropEdit(false);
  if ((obj.maskCanvas || obj.maskImage) && obj.originalImage) {
    await composeMaskedImage(obj, obj.maskCanvas || cloneCanvas(obj.maskImage));
    obj.originalSrc = undefined;
    obj.originalImage = undefined;
    obj.maskSrc = undefined;
    obj.maskImage = undefined;
    obj.maskCanvas = undefined;
  }
  await ensureObjectCloneCanvas(obj);
  stampEditor.active = true;
  stampEditor.objectId = obj.id;
  stampEditor.painting = false;
  stampEditor.samplePoint = null;
  stampEditor.hoverPoint = null;
  stampEditor.sourceOffset = null;
  stampEditor.sourceSnapshot = null;
  stampEditor.history = [];
  stampEditor.dirty = false;
  setStampStatus("按住 Alt/Option 点击图片取样，然后拖动画笔盖印。");
  syncStampControls();
  renderAll();
}

function stopStampEdit(shouldPersist = true) {
  stampEditor.active = false;
  stampEditor.painting = false;
  stampEditor.samplePoint = null;
  stampEditor.hoverPoint = null;
  stampEditor.sourceOffset = null;
  stampEditor.sourceSnapshot = null;
  stampEditor.history = [];
  stampEditor.dirty = false;
  if (shouldPersist) persist();
  syncStampControls();
  renderAll();
}

function syncStampControls() {
  syncMaskControls();
}

function startCropEdit(obj = selected()) {
  if (!obj || obj.type !== "image") return;
  if (maskEditor.active) stopMaskEdit(false);
  if (stampEditor.active) stopStampEdit(false);
  cropEditor.active = true;
  cropEditor.objectId = obj.id;
  obj.crop = normalizeCrop(obj.crop);
  document.body.classList.add("crop-editing");
  syncCropControls(obj);
  renderAll();
  syncUi(false);
}

function stopCropEdit(shouldPersist = true) {
  cropEditor.active = false;
  cropEditor.objectId = null;
  document.body.classList.remove("crop-editing");
  if (shouldPersist) persist();
  syncCropControls();
  renderAll();
  syncUi(false);
}

function syncCropControls(obj = selected()) {
  const els = imageToolEls();
  const active = !!obj && obj.type === "image" && cropEditor.active && cropEditor.objectId === obj.id;
  els.cropPanel.classList.toggle("hidden", !active);
  els.toggleCropBtn.classList.toggle("active", active);
  els.toggleCropBtn.disabled = !obj || obj.type !== "image";
  if (!obj || obj.type !== "image") return;
  const crop = normalizeCrop(obj.crop);
  obj.crop = crop;
  els.cropLeft.value = Math.round(crop.left);
  els.cropRight.value = Math.round(crop.right);
  els.cropTop.value = Math.round(crop.top);
  els.cropBottom.value = Math.round(crop.bottom);
}

function syncMaskControls() {
  const els = imageToolEls();
  const obj = selected();
  const isImage = obj?.type === "image";
  els.maskEditPanel.classList.toggle("hidden", !isImage || !maskEditor.active || maskEditor.objectId !== obj.id);
  els.stampEditPanel.classList.toggle("hidden", !isImage || !stampEditor.active || stampEditor.objectId !== obj.id);
  els.maskKeepBtn.classList.toggle("active", maskEditor.mode === "keep");
  els.maskEraseBtn.classList.toggle("active", maskEditor.mode === "erase");
  els.maskBrushSize.value = String(maskEditor.brushSize);
  els.maskBrushSizeValue.textContent = String(maskEditor.brushSize);
  els.maskBrushHardness.value = String(maskEditor.hardness);
  els.maskBrushHardnessValue.textContent = `${Math.round(maskEditor.hardness * 100)}%`;
  els.maskShowOverlay.checked = maskEditor.showOverlay;
  els.startMaskEditBtn.disabled = !isImage;
  els.startStampEditBtn.disabled = !isImage;
  els.startStampEditBtn.classList.toggle("active", isImage && stampEditor.active && stampEditor.objectId === obj.id);
  els.stampBrushSize.value = String(stampEditor.brushSize);
  els.stampBrushSizeValue.textContent = String(stampEditor.brushSize);
  els.stampBrushHardness.value = String(stampEditor.hardness);
  els.stampBrushHardnessValue.textContent = `${Math.round(stampEditor.hardness * 100)}%`;
  els.restoreImageBtn.disabled = !isImage || !obj.originalSrc;
  els.finishMaskEditBtn.disabled = !maskEditor.active;
  els.finishStampEditBtn.disabled = !stampEditor.active;
  els.maskUndoBtn.disabled = !maskEditor.active || !maskEditor.history.length;
  els.stampUndoBtn.disabled = !stampEditor.active || !stampEditor.history.length;
  syncCropControls(obj);
}

function canvasPointToObject(point, obj) {
  const cx = obj.x + obj.width / 2;
  const cy = obj.y + obj.height / 2;
  const angle = -(obj.rotation || 0) * Math.PI / 180;
  const dx = point.x - cx;
  const dy = point.y - cy;
  return {
    x: dx * Math.cos(angle) - dy * Math.sin(angle) + obj.width / 2,
    y: dx * Math.sin(angle) + dy * Math.cos(angle) + obj.height / 2
  };
}

function objectPointToMask(point, obj, maskCanvas) {
  return {
    x: point.x / Math.max(1, obj.width) * maskCanvas.width,
    y: point.y / Math.max(1, obj.height) * maskCanvas.height
  };
}

function maskPointFromEvent(event) {
  const obj = state.objects.find(item => item.id === maskEditor.objectId);
  if (!obj) return null;
  const point = canvasPointToObject(toLocalPoint(event), obj);
  if (point.x < 0 || point.y < 0 || point.x > obj.width || point.y > obj.height) return null;
  return { obj, point };
}

function stampPointFromEvent(event) {
  const obj = state.objects.find(item => item.id === stampEditor.objectId);
  if (!obj) return null;
  const point = canvasPointToObject(toLocalPoint(event), obj);
  if (point.x < 0 || point.y < 0 || point.x > obj.width || point.y > obj.height) return null;
  return { obj, point };
}

function stampEditorCanvas(obj) {
  return obj.cloneCanvas || obj.image;
}

function cloneCanvas(source) {
  const canvasEl = document.createElement("canvas");
  canvasEl.width = source.naturalWidth || source.width;
  canvasEl.height = source.naturalHeight || source.height;
  canvasEl.getContext("2d").drawImage(source, 0, 0, canvasEl.width, canvasEl.height);
  return canvasEl;
}

async function ensureObjectCloneCanvas(obj) {
  if (!obj.cloneCanvas) obj.cloneCanvas = cloneCanvas(obj.image);
  return obj.cloneCanvas;
}

function objectPointToImagePixel(point, obj) {
  const image = stampEditorCanvas(obj);
  const crop = normalizeCrop(obj.crop);
  const rect = imageSourceRectForBox(image, crop);
  return {
    x: rect.sx + point.x / Math.max(1, obj.width) * rect.sw,
    y: rect.sy + point.y / Math.max(1, obj.height) * rect.sh
  };
}

function imagePixelToObjectPoint(pixel, obj) {
  const image = stampEditorCanvas(obj);
  const crop = normalizeCrop(obj.crop);
  const rect = imageSourceRectForBox(image, crop);
  return {
    x: (pixel.x - rect.sx) / Math.max(1, rect.sw) * obj.width,
    y: (pixel.y - rect.sy) / Math.max(1, rect.sh) * obj.height
  };
}

function pushMaskHistory(obj) {
  if (!obj.maskCanvas) return;
  maskEditor.history.push(obj.maskCanvas.toDataURL("image/png"));
  if (maskEditor.history.length > 20) maskEditor.history.shift();
}

function drawMaskStroke(maskCanvas, from, to) {
  const mctx = maskCanvas.getContext("2d");
  const radius = Math.max(1, maskEditor.brushSize / 2);
  const gradient = mctx.createRadialGradient(to.x, to.y, radius * maskEditor.hardness, to.x, to.y, radius);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  mctx.save();
  mctx.globalCompositeOperation = maskEditor.mode === "keep" ? "source-over" : "destination-out";
  mctx.lineCap = "round";
  mctx.lineJoin = "round";
  mctx.strokeStyle = gradient;
  mctx.fillStyle = gradient;
  mctx.lineWidth = maskEditor.brushSize;
  mctx.beginPath();
  if (from) {
    mctx.moveTo(from.x, from.y);
    mctx.lineTo(to.x, to.y);
    mctx.stroke();
  }
  mctx.beginPath();
  mctx.arc(to.x, to.y, radius, 0, Math.PI * 2);
  mctx.fill();
  mctx.restore();
  invalidateMaskOverlay();
}

async function paintMaskAt(event) {
  const hit = maskPointFromEvent(event);
  if (!hit) return;
  const maskCanvas = await ensureObjectMaskCanvas(hit.obj);
  const point = objectPointToMask(hit.point, hit.obj, maskCanvas);
  drawMaskStroke(maskCanvas, maskEditor.lastPoint, point);
  maskEditor.lastPoint = point;
  maskEditor.dirty = true;
  hit.obj.maskCanvas = maskCanvas;
  hit.obj.maskVersion = (hit.obj.maskVersion || 0) + 1;
  hit.obj.maskedRenderCache = null;
  scheduleMaskRender();
}

function pushStampHistory(obj) {
  if (!obj.cloneCanvas) return;
  stampEditor.history.push(obj.cloneCanvas.toDataURL("image/png"));
  if (stampEditor.history.length > 20) stampEditor.history.shift();
}

function scheduleStampRender() {
  if (stampEditor.renderQueued) return;
  stampEditor.renderQueued = true;
  requestAnimationFrame(() => {
    stampEditor.renderQueued = false;
    renderAll();
  });
}

function drawStampBrush(editCanvas, sourceCanvas, sourcePoint, destPoint, obj) {
  const scaleX = editCanvas.width / Math.max(1, obj.width);
  const scaleY = editCanvas.height / Math.max(1, obj.height);
  const radius = Math.max(1, stampEditor.brushSize / 2 * (scaleX + scaleY) / 2);
  const size = Math.max(2, Math.ceil(radius * 2));
  const temp = document.createElement("canvas");
  temp.width = size;
  temp.height = size;
  const tctx = temp.getContext("2d");
  tctx.drawImage(sourceCanvas, sourcePoint.x - radius, sourcePoint.y - radius, radius * 2, radius * 2, 0, 0, size, size);
  const gradient = tctx.createRadialGradient(size / 2, size / 2, radius * stampEditor.hardness, size / 2, size / 2, radius);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  tctx.globalCompositeOperation = "destination-in";
  tctx.fillStyle = gradient;
  tctx.fillRect(0, 0, size, size);
  editCanvas.getContext("2d").drawImage(temp, destPoint.x - radius, destPoint.y - radius, radius * 2, radius * 2);
}

async function paintStampAt(event) {
  const hit = stampPointFromEvent(event);
  if (!hit || !stampEditor.samplePoint) return;
  const editCanvas = await ensureObjectCloneCanvas(hit.obj);
  const destPoint = objectPointToImagePixel(hit.point, hit.obj);
  if (!stampEditor.sourceOffset) {
    stampEditor.sourceOffset = {
      x: stampEditor.samplePoint.x - destPoint.x,
      y: stampEditor.samplePoint.y - destPoint.y
    };
  }
  const sourcePoint = {
    x: destPoint.x + stampEditor.sourceOffset.x,
    y: destPoint.y + stampEditor.sourceOffset.y
  };
  drawStampBrush(editCanvas, stampEditor.sourceSnapshot || editCanvas, sourcePoint, destPoint, hit.obj);
  hit.obj.cloneCanvas = editCanvas;
  stampEditor.dirty = true;
  scheduleStampRender();
}

async function commitStampCanvas(obj) {
  if (!obj?.cloneCanvas) return;
  const dataUrl = obj.cloneCanvas.toDataURL("image/png");
  obj.src = dataUrl;
  obj.image = await loadImage(dataUrl);
  obj.cloneCanvas = undefined;
  obj.rmbgEdited = false;
  stampEditor.dirty = false;
}

async function undoStampStroke() {
  const obj = state.objects.find(item => item.id === stampEditor.objectId);
  const previous = stampEditor.history.pop();
  if (!obj || !previous) return;
  const image = await loadImage(previous);
  obj.cloneCanvas = cloneCanvas(image);
  stampEditor.dirty = true;
  setStampStatus("已撤销上一笔图章。");
  syncStampControls();
  renderAll();
}

async function undoMaskStroke() {
  const obj = state.objects.find(item => item.id === maskEditor.objectId);
  const previous = maskEditor.history.pop();
  if (!obj || !previous) return;
  const maskImage = await loadImage(previous);
  const canvasEl = document.createElement("canvas");
  canvasEl.width = maskImage.width;
  canvasEl.height = maskImage.height;
  canvasEl.getContext("2d").drawImage(maskImage, 0, 0);
  saveHistory();
  await composeMaskedImage(obj, canvasEl);
  setMaskStatus("已撤销上一笔修边。");
  renderAll();
  persist();
}

async function restoreSelectedImage() {
  const obj = selected();
  if (!obj || obj.type !== "image" || !obj.originalSrc) return;
  saveHistory();
  obj.src = obj.originalSrc;
  obj.image = await loadImage(obj.src);
  obj.originalSrc = undefined;
  obj.originalImage = undefined;
  obj.maskSrc = undefined;
  obj.maskImage = undefined;
  obj.maskCanvas = undefined;
  obj.cloneCanvas = undefined;
  obj.rmbgEdited = false;
  stopMaskEdit(false);
  stopStampEdit(false);
  setMaskStatus("已恢复原图。");
  renderAll();
  syncUi();
  persist();
}

function setupPromptGenerator() {
  const section = document.getElementById("promptSection");
  if (!section) return;
  const savedKey = localStorage.getItem(IMAGE_API_KEY_STORAGE);
  if (savedKey) document.getElementById("imageApiKey").value = savedKey;
  section.addEventListener("input", generateTourismPrompt);
  section.addEventListener("change", generateTourismPrompt);
  wire("imageApiKey", "input", e => {
    localStorage.setItem(IMAGE_API_KEY_STORAGE, e.target.value.trim());
  });
  wire("genUseCase", "change", () => {
    updatePromptSpecialFields();
    generateTourismPrompt();
  });
  wire("copyGeneratedBtn", "click", () => {
    copyPromptText(document.getElementById("generatedPrompt").value || generateTourismPrompt());
  });
  wire("generateImageBtn", "click", generateImageFromPrompt);
  updatePromptSpecialFields();
  syncPromptAspectToCanvas();
  generateTourismPrompt();
}

function setupUnsplashLibrary() {
  const els = unsplashEls();
  if (!els.accessKey || !els.query || !els.searchBtn) return;
  const savedKey = localStorage.getItem(UNSPLASH_ACCESS_KEY_STORAGE);
  if (savedKey) {
    els.accessKey.value = savedKey;
    setUnsplashStatus("已读取本地保存的 Unsplash Access Key。输入关键词即可搜索。");
  }
  els.accessKey.addEventListener("input", event => {
    localStorage.setItem(UNSPLASH_ACCESS_KEY_STORAGE, event.target.value.trim());
  });
  els.searchBtn.addEventListener("click", () => searchUnsplashPhotos({ reset: true }));
  els.loadMoreBtn.addEventListener("click", () => searchUnsplashPhotos({ reset: false }));
  els.keyHelpBtn.addEventListener("click", () => openExternalLink(UNSPLASH_KEY_HELP_URL));
  els.query.addEventListener("keydown", event => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    searchUnsplashPhotos({ reset: true });
  });
}

function setupMaskTools() {
  const els = imageToolEls();
  els.removeBgBtn.addEventListener("click", removeBackgroundFromSelected);
  els.startMaskEditBtn.addEventListener("click", startMaskEditFromSelected);
  els.startStampEditBtn.addEventListener("click", () => startStampEdit(selected()));
  els.restoreImageBtn.addEventListener("click", restoreSelectedImage);
  els.maskKeepBtn.addEventListener("click", () => {
    maskEditor.mode = "keep";
    syncMaskControls();
  });
  els.maskEraseBtn.addEventListener("click", () => {
    maskEditor.mode = "erase";
    syncMaskControls();
  });
  els.maskBrushSize.addEventListener("input", event => {
    maskEditor.brushSize = Number(event.target.value);
    syncMaskControls();
  });
  els.maskBrushHardness.addEventListener("input", event => {
    maskEditor.hardness = Number(event.target.value);
    syncMaskControls();
  });
  els.maskShowOverlay.addEventListener("change", event => {
    maskEditor.showOverlay = event.target.checked;
    renderAll();
  });
  els.maskUndoBtn.addEventListener("click", undoMaskStroke);
  els.finishMaskEditBtn.addEventListener("click", () => {
    stopMaskEdit(true);
    setMaskStatus("修边完成。");
  });
  els.stampBrushSize.addEventListener("input", event => {
    stampEditor.brushSize = Number(event.target.value);
    syncStampControls();
    renderAll();
  });
  els.stampBrushHardness.addEventListener("input", event => {
    stampEditor.hardness = Number(event.target.value);
    syncStampControls();
  });
  els.stampUndoBtn.addEventListener("click", undoStampStroke);
  els.finishStampEditBtn.addEventListener("click", async () => {
    const obj = state.objects.find(item => item.id === stampEditor.objectId);
    if (stampEditor.dirty && obj) await commitStampCanvas(obj);
    stopStampEdit(true);
    setStampStatus("图章编辑完成。");
    persist();
  });
  syncMaskControls();
}

function showToolPanel(panelId, button) {
  const left = document.querySelector(".left");
  const topLevel = ["sizeSection", "promptSection", "logoSection"];
  const sectionId = topLevel.includes(panelId) ? panelId : "addSection";
  left.classList.add("panel-open");
  document.querySelectorAll(".tool-chip").forEach(item => item.classList.toggle("active", item === button));
  document.querySelectorAll(".tool-panel > .section").forEach(section => {
    section.classList.toggle("panel-active", section.id === sectionId);
  });
  document.querySelectorAll(".add-subpanel").forEach(panel => {
    panel.classList.toggle("panel-active", panel.id === panelId);
  });
}

function hideToolPanelSoon() {
  window.clearTimeout(window.__toolPanelTimer);
  window.__toolPanelTimer = window.setTimeout(() => {
    const left = document.querySelector(".left");
    if (!left.matches(":hover") && !left.contains(document.activeElement)) {
      left.classList.remove("panel-open");
    }
  }, 120);
}

function setupToolPanelHover() {
  const left = document.querySelector(".left");
  const tools = document.getElementById("quickTools");
  tools.querySelectorAll(".tool-chip").forEach(button => {
    const panelId = button.dataset.panel || button.dataset.scroll;
    if (!panelId) return;
    const open = () => showToolPanel(panelId, button);
    button.addEventListener("mouseenter", open);
    button.addEventListener("focus", open);
    button.addEventListener("click", e => {
      open();
    });
  });
  left.addEventListener("mouseenter", () => window.clearTimeout(window.__toolPanelTimer));
  left.addEventListener("mouseleave", hideToolPanelSoon);
  showToolPanel("sizeSection", tools.querySelector(".tool-chip"));
  left.classList.remove("panel-open");
}

function addObjects(objects, selectedObj = objects[objects.length - 1]) {
  saveHistory();
  state.objects.push(...objects);
  setSelection([selectedObj.id]);
  renderAll();
  syncUi();
  persist();
}

wire("addTextBtn", "click", () => addObject(text("输入文字", 120, 260, 42, "#171411", { width: 520, fontWeight: 700 })));
wire("addTitleBtn", "click", () => addObject(text("输入你的封面标题", 120, 180, 82, "#171411", { stroke: "transparent", strokeWidth: 0 })));
wire("addSubtitleBtn", "click", () => addObject(text("这里填写补充说明", 124, 330, 38, "#6e6e73", { width: 640, fontWeight: 700 })));
wire("addBigNumberBtn", "click", () => addObject(text("07", 108, 190, 176, "#fff100", { width: 360, fontWeight: 900, stroke: "#1d1d1f", strokeWidth: 4, lockAspect: true })));
wire("addVerticalTextBtn", "click", () => {
  const obj = text("旅\n行\n攻\n略", state.width - 170, 188, 50, "#171411", { width: 88, fontWeight: 900, align: "center", lockAspect: true });
  obj.name = "竖排字";
  addObject(obj);
});

wire("addPillTagBtn", "click", () => {
  const x = state.width * .12;
  const y = state.height * .78;
  const bg = shape("rect", x, y, 320, 76, "#171411", { radius: 38, shadow: 6 });
  bg.name = "胶囊底";
  const label = text("收藏攻略", x + 54, y + 19, 32, "#ffffff", { width: 220, fontWeight: 900 });
  label.name = "胶囊文字";
  addObjects([bg, label], label);
});
wire("addCornerBadgeBtn", "click", () => {
  const x = state.width - 300;
  const y = 110;
  const bg = shape("rect", x, y, 210, 82, "#ff4d23", { radius: 24, shadow: 8 });
  bg.name = "角标底";
  bg.rotation = 4;
  const label = text("必看", x + 50, y + 19, 34, "#ffffff", { width: 130, fontWeight: 900 });
  label.name = "角标文字";
  label.rotation = 4;
  addObjects([bg, label], label);
});
wire("addTopBadgeBtn", "click", () => {
  const x = state.width * .12;
  const y = state.height * .1;
  const bg = shape("circle", x, y, 180, "#171411", { shadow: 10 });
  bg.name = "数字标签底";
  const top = text("TOP", x + 42, y + 42, 30, "#fff100", { width: 105, fontWeight: 900, align: "center" });
  top.name = "TOP 文字";
  const num = text("5", x + 61, y + 76, 62, "#ffffff", { width: 64, fontWeight: 900, align: "center" });
  num.name = "数字";
  addObjects([bg, top, num], num);
});
wire("addRectBtn", "click", () => addObject(shape("rect", 160, 260, 380, 220, "#ff4d23", { radius: 24 })));
wire("addCircleBtn", "click", () => addObject(shape("circle", 180, 280, 240, "#2563eb")));
wire("addTriangleBtn", "click", () => addObject(shape("triangle", 180, 280, 260, 260, "#ffb000", { lockAspect: true })));
wire("addStarBtn", "click", () => addObject(shape("star", 190, 280, 240, 240, "#fff100", { strokeWidth: 0, lockAspect: true })));
wire("addPolygonBtn", "click", () => addObject(shape("polygon", 180, 280, 260, 260, "#12b981", { sides: 6, lockAspect: true })));
wire("addDividerBtn", "click", () => {
  const obj = shape("line", 120, 470, 520, 24, "#171411", { stroke: "#171411", strokeWidth: 1, lockAspect: false });
  addObject(obj);
});
wire("addOverlayBtn", "click", () => {
  const obj = shape("rect", 0, 0, state.width, state.height, "#000000", { lockAspect: false });
  obj.name = "半透明遮罩";
  obj.opacity = .28;
  addObject(obj);
});
function normalizeHexColor(value) {
  const raw = String(value || "").trim();
  const withHash = raw.startsWith("#") ? raw : `#${raw}`;
  if (/^#[0-9a-fA-F]{6}$/.test(withHash)) return withHash.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(withHash)) {
    return `#${withHash[1]}${withHash[1]}${withHash[2]}${withHash[2]}${withHash[3]}${withHash[3]}`.toLowerCase();
  }
  return null;
}

function syncBackgroundColorUi(color = state.background) {
  const normalized = normalizeHexColor(color) || "#ffffff";
  const colorInput = document.getElementById("backgroundColor");
  const hexInput = document.getElementById("backgroundHex");
  const preview = document.getElementById("backgroundColorPreview");
  if (colorInput) colorInput.value = normalized;
  if (hexInput) hexInput.value = normalized.toUpperCase();
  if (preview) preview.style.setProperty("--preview-color", normalized);
  document.querySelectorAll("#swatches .swatch").forEach(button => {
    button.classList.toggle("active", normalizeHexColor(button.dataset.color) === normalized);
  });
}

function setBackgroundColor(color, shouldPersist = true) {
  const normalized = normalizeHexColor(color);
  if (!normalized) return false;
  state.background = normalized;
  syncBackgroundColorUi(normalized);
  renderAll();
  if (shouldPersist) persist();
  return true;
}

wire("backgroundColor", "input", e => {
  setBackgroundColor(e.target.value);
});

wire("backgroundHex", "input", e => {
  const normalized = normalizeHexColor(e.target.value);
  if (normalized) setBackgroundColor(normalized);
});

wire("backgroundHex", "blur", e => {
  if (!setBackgroundColor(e.target.value)) syncBackgroundColorUi();
});

wire("strokeDashToggle", "change", e => {
  const objects = selectedObjects().filter(obj => obj.type === "shape" && obj.kind === "line");
  if (!objects.length) return;
  saveHistory();
  objects.forEach(obj => { obj.strokeDash = e.target.checked; });
  renderAll();
  syncUi(false);
  persist();
});

wire("toggleCropBtn", "click", () => {
  const obj = selected();
  if (!obj || obj.type !== "image") return;
  if (cropEditor.active && cropEditor.objectId === obj.id) stopCropEdit();
  else startCropEdit(obj);
});

["cropLeft", "cropRight", "cropTop", "cropBottom"].forEach(id => {
  wire(id, "input", e => {
    const obj = selected();
    if (!obj || obj.type !== "image") return;
    saveHistory();
    const key = id.replace("crop", "").toLowerCase();
    setCropSideWithoutStretch(obj, key, e.target.value);
    syncCropControls(obj);
    renderAll();
    syncTransformInputs(obj);
    persist();
  });
});

wire("resetCropBtn", "click", () => {
  const obj = selected();
  if (!obj || obj.type !== "image") return;
  saveHistory();
  obj.crop = { left: 0, right: 0, top: 0, bottom: 0 };
  syncCropControls(obj);
  renderAll();
  persist();
});

wire("finishCropBtn", "click", () => stopCropEdit());
wire("booleanUnionBtn", "click", () => booleanShapeObjects("union"));
wire("booleanSubtractBtn", "click", () => booleanShapeObjects("subtract"));
wire("booleanIntersectBtn", "click", () => booleanShapeObjects("intersect"));
wire("booleanExcludeBtn", "click", () => booleanShapeObjects("exclude"));

["posX", "posY", "objWidth", "objHeight", "rotation", "textValue", "fontFamily", "fontSize", "fillColor", "strokeColor", "strokeWidth", "shapeRadius", "shapeSides", "shapeStarPoints", "opacity", "shadow", "lockAspect"].forEach(id => {
  const handler = e => {
    const obj = selected();
    if (!obj) return;
    const keyMap = {
      posX: "x",
      posY: "y",
      objWidth: "width",
      objHeight: "height",
      rotation: "rotation",
      textValue: "text",
      fontFamily: "fontFamily",
      fontSize: "fontSize",
      fillColor: "fill",
      strokeColor: "stroke",
      strokeWidth: "strokeWidth",
      shapeRadius: "radius",
      shapeSides: "sides",
      shapeStarPoints: "points",
      opacity: "opacity",
      shadow: "shadow",
      lockAspect: "lockAspect"
    };
    let value = id === "lockAspect" ? e.target.checked : e.target.value;
    if (obj.type === "shape" && obj.kind === "line" && id === "fillColor") return;
    if (["posX", "posY", "objWidth", "objHeight", "rotation", "fontSize", "strokeWidth", "shapeRadius", "shapeSides", "shapeStarPoints", "opacity", "shadow"].includes(id)) value = Number(value);
    if (id === "objWidth" || id === "objHeight") value = Math.max(1, value);
    if (id === "shapeRadius") value = Math.max(0, value);
    if (id === "shapeSides") value = Math.min(16, Math.max(3, Math.round(value)));
    if (id === "shapeStarPoints") value = Math.min(16, Math.max(3, Math.round(value)));
    saveHistory();
    const patch = { [keyMap[id]]: value };
    if ((id === "objWidth" || id === "objHeight") && defaultLockAspect(obj)) {
      const ratio = Math.max(.05, obj.width / Math.max(1, obj.height));
      if (id === "objWidth") patch.height = obj.kind === "circle" ? value : Math.max(1, value / ratio);
      if (id === "objHeight") patch.width = obj.kind === "circle" ? value : Math.max(1, value * ratio);
      if (obj.kind === "circle") {
        patch.width = value;
        patch.height = value;
      }
    }
    updateSelected(patch);
  };
  wire(id, id === "lockAspect" ? "change" : "input", handler);
  if (id === "fillColor" || id === "strokeColor") wire(id, "change", handler);
});

wire("radiusStraightBtn", "click", () => {
  const objects = selectedObjects().filter(obj => obj.type === "shape" && obj.kind === "rect");
  if (!objects.length) return;
  saveHistory();
  objects.forEach(obj => { obj.radius = 0; });
  renderAll();
  syncUi();
  persist();
});

wire("radiusRoundBtn", "click", () => {
  const objects = selectedObjects().filter(obj => obj.type === "shape" && obj.kind === "rect");
  if (!objects.length) return;
  saveHistory();
  objects.forEach(obj => { obj.radius = Math.round(Math.min(obj.width, obj.height) * .18); });
  renderAll();
  syncUi();
  persist();
});

function alignObjects(mode) {
  const objects = selectedObjects();
  if (!objects.length) return;
  const bounds = selectionBounds(objects);
  if (!bounds) return;
  const target = objects.length > 1
    ? mode === "left" ? bounds.x : mode === "right" ? bounds.right : bounds.x + bounds.width / 2
    : mode === "left" ? 0 : mode === "right" ? state.width : state.width / 2;
  saveHistory();
  objects.forEach(obj => {
    if (mode === "left") obj.x = target;
    if (mode === "center") obj.x = target - obj.width / 2;
    if (mode === "right") obj.x = target - obj.width;
  });
  renderAll();
  syncUi();
  persist();
}

function setTextAlign(align) {
  const objects = selectedObjects().filter(obj => obj.type === "text");
  if (!objects.length) return;
  saveHistory();
  objects.forEach(obj => { obj.align = align; });
  renderAll();
  syncUi();
  persist();
}

wire("alignLeftBtn", "click", () => alignObjects("left"));
wire("alignCenterBtn", "click", () => alignObjects("center"));
wire("alignRightBtn", "click", () => alignObjects("right"));
wire("textAlignLeftBtn", "click", () => setTextAlign("left"));
wire("textAlignCenterBtn", "click", () => setTextAlign("center"));
wire("textAlignRightBtn", "click", () => setTextAlign("right"));

wire("bringForwardBtn", "click", () => moveLayer(1));
wire("sendBackwardBtn", "click", () => moveLayer(-1));
wire("bringFrontBtn", "click", () => moveLayer(99));
wire("sendBackBtn", "click", () => moveLayer(-99));
wire("groupLayersBtn", "click", groupSelectedLayers);
wire("ungroupLayersBtn", "click", ungroupSelectedLayers);

function moveLayer(delta) {
  const index = state.objects.findIndex(o => o.id === state.selectedId);
  if (index < 0) return;
  saveHistory();
  const [obj] = state.objects.splice(index, 1);
  const next = delta > 50 ? state.objects.length : delta < -50 ? 0 : Math.max(0, Math.min(state.objects.length, index + delta));
  state.objects.splice(next, 0, obj);
  renderAll();
  syncUi();
  persist();
}

function reorderLayer(draggedId, targetId, after = false) {
  if (!draggedId || !targetId || draggedId === targetId) return;
  const visualIds = [...state.objects].reverse().map(obj => obj.id);
  const from = visualIds.indexOf(draggedId);
  let to = visualIds.indexOf(targetId);
  if (from < 0 || to < 0) return;
  saveHistory();
  visualIds.splice(from, 1);
  if (from < to) to -= 1;
  if (after) to += 1;
  visualIds.splice(to, 0, draggedId);
  const byId = new Map(state.objects.map(obj => [obj.id, obj]));
  state.objects = visualIds.reverse().map(id => byId.get(id)).filter(Boolean);
  setSelection(state.selectedIds && state.selectedIds.length ? state.selectedIds : [draggedId]);
  renderAll();
  syncUi();
  persist();
}

function duplicateSelected() {
  const objects = selectedObjects();
  if (!objects.length) return;
  saveHistory();
  const clones = cloneObjectsForPaste(objects);
  state.objects.push(...clones);
  setSelection(clones.map(obj => obj.id));
  renderAll();
  syncUi();
  persist();
}

function cloneObjectsForPaste(objects) {
  return objects.map(obj => {
    const clone = cloneObject(obj, { name: `${obj.name} 副本` });
    clone.x += 28;
    clone.y += 28;
    return clone;
  });
}

function copySelectedObjects() {
  const objects = selectedObjects();
  if (!objects.length) return;
  objectClipboard = objects.map(obj => cloneObject(obj, { keepIds: true }));
}

function pasteCopiedObjects() {
  if (!objectClipboard.length) return false;
  saveHistory();
  const clones = cloneObjectsForPaste(objectClipboard);
  state.objects.push(...clones);
  setSelection(clones.map(obj => obj.id));
  renderAll();
  syncUi();
  persist();
  return true;
}

wire("selectAllBtn", "click", () => {
  setSelection(state.objects.map(obj => obj.id));
  renderAll();
  syncUi();
});

function deleteSelected() {
  const ids = new Set(selectedObjects().map(o => o.id));
  if (!ids.size) return;
  saveHistory();
  state.objects = state.objects.filter(o => !ids.has(o.id));
  setSelection([]);
  renderAll();
  syncUi();
  persist();
}

wire("undoBtn", "click", undo);
wire("redoBtn", "click", redo);

async function undo() {
  if (!state.history.length) return;
  state.future.push(snapshot());
  await restore(state.history.pop());
  persist();
}

async function redo() {
  if (!state.future.length) return;
  state.history.push(snapshot());
  await restore(state.future.pop());
  persist();
}

document.addEventListener("keydown", e => {
  const tag = document.activeElement.tagName;
  const editingField = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || inlineEditing;
  const mod = e.metaKey || e.ctrlKey;
  if (editingField) return;
  if (e.code === "Space" && !e.repeat && !inlineEditing) {
    e.preventDefault();
    panState.spaceDown = true;
    document.body.classList.add("space-panning");
    return;
  }
  if (e.key === "Delete" || e.key === "Backspace") {
    e.preventDefault();
    deleteSelected();
    return;
  }
  if (mod && e.key.toLowerCase() === "a") {
    e.preventDefault();
    setSelection(state.objects.map(obj => obj.id));
    renderAll();
    syncUi();
    return;
  }
  if (mod && e.key.toLowerCase() === "d") {
    e.preventDefault();
    duplicateSelected();
    return;
  }
  if (mod && e.key.toLowerCase() === "c") {
    e.preventDefault();
    copySelectedObjects();
    return;
  }
  if (mod && e.key.toLowerCase() === "v" && objectClipboard.length) {
    e.preventDefault();
    pasteCopiedObjects();
    return;
  }
  if (mod && e.key.toLowerCase() === "g") {
    e.preventDefault();
    if (e.shiftKey) ungroupSelectedLayers();
    else groupSelectedLayers();
    return;
  }
  if (mod && e.key.toLowerCase() === "e" && e.shiftKey) {
    e.preventDefault();
    document.getElementById("exportBtn").click();
    return;
  }
  if (mod && e.key === "]") {
    e.preventDefault();
    moveLayer(e.shiftKey ? 99 : 1);
    return;
  }
  if (mod && e.key === "[") {
    e.preventDefault();
    moveLayer(e.shiftKey ? -99 : -1);
    return;
  }
  if (mod && e.key.toLowerCase() === "z") {
    e.preventDefault();
    if (e.shiftKey) redo();
    else undo();
    return;
  }
  if (mod && e.key.toLowerCase() === "y") {
    e.preventDefault();
    redo();
    return;
  }
  const objects = selectedObjects();
  if (!objects.length) return;
  const step = e.shiftKey ? 10 : 1;
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
    e.preventDefault();
    saveHistory();
    objects.forEach(obj => {
      if (e.key === "ArrowUp") obj.y -= step;
      if (e.key === "ArrowDown") obj.y += step;
      if (e.key === "ArrowLeft") obj.x -= step;
      if (e.key === "ArrowRight") obj.x += step;
    });
    renderAll();
    syncUi(false);
    syncTransformInputs();
    persist();
  }
});

document.addEventListener("keyup", e => {
  if (e.code !== "Space") return;
  panState.spaceDown = false;
  panState.active = false;
  document.body.classList.remove("space-panning", "is-panning");
});

wire("zoomSelect", "change", () => {
  applyZoom();
  renderAll();
});

stage.addEventListener("wheel", e => {
  if (!e.altKey) return;
  e.preventDefault();
  const before = canvas.getBoundingClientRect();
  const focusX = before.width ? (e.clientX - before.left) / before.width : .5;
  const focusY = before.height ? (e.clientY - before.top) / before.height : .5;
  const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
  const nextScale = (state.zoomScale || before.width / state.width || 1) * factor;
  const zoomSelect = document.getElementById("zoomSelect");
  zoomSelect.value = "custom";
  setCanvasScale(nextScale);
  const after = canvas.getBoundingClientRect();
  stage.scrollLeft += (after.width - before.width) * focusX;
  stage.scrollTop += (after.height - before.height) * focusY;
  renderAll();
  persist();
}, { passive: false });

window.addEventListener("resize", () => {
  if (inlineEditing) finishInlineTextEdit(true);
  applyZoom();
  renderAll();
});

wire("imageUploadBtn", "click", () => document.getElementById("imageInput").click());

wire("imageInput", "change", async e => {
  const file = e.target.files[0];
  if (!file) return;
  document.getElementById("imageUploadTitle").textContent = file.name;
  document.getElementById("imageUploadMeta").textContent = "正在读取图片...";
  const img = await addImageFileToCanvas(file, {
    x: state.width * .14,
    y: state.height * .22,
    name: file.name ? file.name.replace(/\.[^.]+$/, "") : "图片"
  });
  document.getElementById("imageUploadMeta").textContent = `${img.width} × ${img.height}，已添加到画布`;
  e.target.value = "";
});

async function addImageFileToCanvas(file, options = {}) {
  const src = await readFile(file);
  return addImageSourceToCanvas(src, options);
}

async function addImageSourceToCanvas(src, options = {}) {
  const img = await loadImage(src);
  const maxW = state.width * .72;
  const ratio = img.width / img.height;
  const w = Math.min(maxW, img.width);
  const h = w / ratio;
  const obj = imageObject(
    img,
    options.x ?? (state.width - w) / 2,
    options.y ?? (state.height - h) / 2,
    w,
    h,
    src
  );
  if (options.name) obj.name = options.name;
  addObject(obj);
  return img;
}

document.addEventListener("paste", async event => {
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || inlineEditing) return;
  const items = [...(event.clipboardData?.items || [])];
  const imageItem = items.find(item => item.kind === "file" && item.type.startsWith("image/"));
  if (!imageItem) {
    if (pasteCopiedObjects()) event.preventDefault();
    return;
  }
  const file = imageItem.getAsFile();
  if (!file) return;
  event.preventDefault();
  try {
    const img = await addImageFileToCanvas(file, { name: "粘贴图片" });
    document.getElementById("imageUploadTitle").textContent = "粘贴图片";
    document.getElementById("imageUploadMeta").textContent = `${img.width} × ${img.height}，已添加到画布`;
  } catch (error) {
    appAlert(error?.message || "剪贴板图片读取失败。", "粘贴图片失败", "danger");
  }
});

async function addLogoToCanvas(asset) {
  const img = await loadImage(asset.src);
  const maxW = state.width * .24;
  const maxH = state.height * .12;
  const ratio = img.width / img.height;
  let w = Math.min(maxW, img.width);
  let h = w / ratio;
  if (h > maxH) {
    h = maxH;
    w = h * ratio;
  }
  const obj = imageObject(img, state.width - w - state.width * .08, state.height * .07, w, h, asset.src);
  obj.name = asset.label;
  obj.lockAspect = true;
  addObject(obj);
  normalizeObjectImageSource(obj);
}

async function addMascotToCanvas(asset) {
  const img = await loadImage(asset.src);
  const maxW = state.width * .28;
  const maxH = state.height * .28;
  const ratio = img.width / img.height;
  let w = Math.min(maxW, img.width);
  let h = w / ratio;
  if (h > maxH) {
    h = maxH;
    w = h * ratio;
  }
  const obj = imageObject(img, state.width - w - state.width * .08, state.height - h - state.height * .08, w, h, asset.src);
  obj.name = `游小侠 ${asset.label}`;
  obj.lockAspect = true;
  addObject(obj);
  normalizeObjectImageSource(obj);
}

async function loadImageAssets(folder, fallbackNames) {
  const fromFallback = () => fallbackNames.map(name => ({
    label: fileLabel(name),
    src: `${folder}/${encodeURIComponent(name)}`
  }));
  try {
    const response = await fetch(`${folder}/`);
    if (!response.ok) throw new Error(`${folder} directory unavailable`);
    const html = await response.text();
    const matches = [...html.matchAll(/href="([^"]+\.(?:png|jpe?g|webp|svg))"/gi)]
      .map(match => decodeURIComponent(match[1]))
      .filter(path => !path.startsWith("."));
    const unique = [...new Set(matches)];
    return unique.length
      ? unique.map(path => ({ label: fileLabel(path), src: `${folder}/${encodeURIComponent(path.split("/").pop())}` }))
      : fromFallback();
  } catch (err) {
    return fromFallback();
  }
}

async function loadLogoAssets() {
  logoAssets = await loadImageAssets("logo", fallbackLogos);
  renderLogos();
}

async function loadMascotAssets() {
  mascotAssets = await loadImageAssets("游小侠", fallbackMascots);
  renderMascots();
}

function renderLogos() {
  const list = document.getElementById("logoList");
  list.innerHTML = "";
  logoAssets.forEach(asset => {
    const btn = document.createElement("button");
    btn.className = "logo-item";
    btn.type = "button";
    btn.innerHTML = `<img src="${asset.src}" alt=""><span>${asset.label}</span>`;
    btn.onclick = () => addLogoToCanvas(asset);
    list.appendChild(btn);
  });
  if (!logoAssets.length) list.innerHTML = `<div class="empty">没有找到 logo 图片，请把 PNG/JPG/WebP/SVG 放入 logo 文件夹。</div>`;
}

function renderMascots() {
  const list = document.getElementById("mascotList");
  list.innerHTML = "";
  mascotAssets.forEach(asset => {
    const btn = document.createElement("button");
    btn.className = "logo-item";
    btn.type = "button";
    btn.innerHTML = `<img src="${asset.src}" alt=""><span>${asset.label}</span>`;
    btn.onclick = () => addMascotToCanvas(asset);
    list.appendChild(btn);
  });
  if (!mascotAssets.length) list.innerHTML = `<div class="empty">没有找到游小侠贴纸，请把 PNG/JPG/WebP/SVG 放入游小侠文件夹。</div>`;
}

wire("exportBtn", "click", async () => {
  try {
    await document.fonts.ready;
    await normalizeAllImageSources();
    const scale = Number(document.getElementById("exportScale").value);
    const type = await chooseExportImageType();
    if (!type) return;
    if (type === "image/svg+xml") {
      const filename = `${state.platform}-${state.label}-${state.width}x${state.height}.svg`.replace(/[\\/:\s]+/g, "-");
      const savedPath = await saveExportFile({
        filename,
        text: exportSvgText(),
        type: "image/svg+xml"
      });
      if (savedPath) appAlert(`已导出到：${savedPath}`, "导出完成");
      return;
    }
    const out = document.createElement("canvas");
    out.width = state.width * scale;
    out.height = state.height * scale;
    assertExportSize(out.width, out.height);
    renderAll(true, scale, out.getContext("2d"));
    out.toBlob(async blob => {
      if (!blob) {
        appAlert("画布里有浏览器禁止导出的图片资源。请刷新页面后重新添加贴纸或图片。", "导出失败", "danger");
        return;
      }
      try {
        const ext = type === "image/jpeg" ? "jpg" : "png";
        const filename = `${state.platform}-${state.label}-${state.width}x${state.height}.${ext}`.replace(/[\\/:\s]+/g, "-");
        const dataUrl = window.youdesignDesktop?.saveExportFile ? await blobToDataUrl(blob) : null;
        const savedPath = await saveExportFile({ filename, blob, dataUrl });
        if (savedPath) appAlert(`已导出到：${savedPath}`, "导出完成");
      } catch (err) {
        appAlert(err?.message || String(err) || "请刷新页面后重试。", "导出失败", "danger");
      }
    }, type, .94);
  } catch (err) {
    appAlert(err?.message || "画布里有浏览器禁止导出的图片资源。请刷新页面后重新添加贴纸或图片。", "导出失败", "danger");
  }
});

wire("exportProjectBtn", "click", async () => {
  try {
    await normalizeAllImageSources();
    const filename = `${state.platform}-${state.label}-${state.width}x${state.height}.youdesign`.replace(/[\\/:\s]+/g, "-");
    const savedPath = await saveExportFile({
      filename,
      text: projectSnapshot(),
      type: "application/json"
    });
    if (savedPath) appAlert(`已导出到：${savedPath}`, "导出完成");
  } catch (err) {
    appAlert(err?.message || String(err) || "请刷新页面后重试。", "导出工程失败", "danger");
  }
});

wire("importProjectBtn", "click", () => document.getElementById("projectInput").click());

wire("projectInput", "change", async e => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    if (state.objects.length && !await appConfirm("导入工程会替换当前画布，是否继续？", {
      title: "导入工程",
      confirmText: "替换画布",
      kind: "danger"
    })) {
      e.target.value = "";
      return;
    }
    const raw = await readTextFile(file);
    saveHistory();
    await restore(raw);
    persist();
  } catch (err) {
    appAlert(err.message || "文件格式不正确", "导入工程失败", "danger");
  } finally {
    e.target.value = "";
  }
});

wire("localFontsBtn", "click", async () => {
  const fontStatus = document.getElementById("fontStatus");
  try {
    if (window.youdesignDesktop && window.youdesignDesktop.listLocalFonts) {
      fontStatus.textContent = "读取中";
      const fonts = await window.youdesignDesktop.listLocalFonts();
      applyLocalFonts(fonts);
      return;
    }
  } catch (err) {
    fontStatus.textContent = "读取失败";
    return;
  }

  if (!("queryLocalFonts" in window)) {
    document.getElementById("fontStatus").textContent = "当前浏览器不支持";
    return;
  }
  try {
    const fonts = await window.queryLocalFonts();
    applyLocalFonts(fonts);
  } catch (err) {
    document.getElementById("fontStatus").textContent = "授权被拒绝";
  }
});

function applyLocalFonts(fonts) {
  const seen = new Set();
  const safeFonts = fonts.filter(isSafeCommercialFont);
  localFonts = fonts
    .filter(isSafeCommercialFont)
    .filter(f => {
      const key = `${f.family}-${f.style}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(f => ({ family: f.family, label: `${f.family} ${f.style || "Regular"} · 可商用`, source: "local" }))
    .sort((a, b) => a.label.localeCompare(b.label, "zh-CN"));
  document.getElementById("fontStatus").textContent = `可商用 ${localFonts.length} 款，过滤 ${fonts.length - safeFonts.length} 款`;
  syncFontSelect();
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function assetSourceToDataUrl(src) {
  if (src.startsWith("data:")) return src;
  if (window.youdesignDesktop?.downloadRemoteAsset && /^https?:\/\//i.test(src)) {
    try {
      return await window.youdesignDesktop.downloadRemoteAsset(src);
    } catch (err) {}
  }
  try {
    const response = await fetch(src);
    if (!response.ok) throw new Error("asset fetch failed");
    const blob = await response.blob();
    return await readFile(blob);
  } catch (err) {
    return src;
  }
}

async function normalizeObjectImageSource(obj) {
  if (obj?.type === "group" && Array.isArray(obj.children)) {
    for (const child of obj.children) await normalizeObjectImageSource(child);
    return;
  }
  if (!obj || obj.type !== "image" || !obj.src || obj.src.startsWith("data:")) return;
  const dataUrl = await assetSourceToDataUrl(obj.src);
  if (dataUrl === obj.src) return;
  obj.src = dataUrl;
  obj.image = await loadImage(dataUrl);
  renderAll();
  persist();
}

async function normalizeAllImageSources() {
  for (const obj of state.objects) {
    await normalizeObjectImageSource(obj);
  }
}

function loadImage(src, useCrossOrigin = true) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (useCrossOrigin && !src.startsWith("data:") && !src.startsWith("blob:")) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function setPreset(preset, keepObjects = false) {
  saveHistory();
  const oldW = state.width;
  const oldH = state.height;
  state.width = preset.width;
  state.height = preset.height;
  state.platform = preset.platform;
  state.label = preset.label;
  if (keepObjects) {
    const sx = state.width / oldW;
    const sy = state.height / oldH;
    state.objects.forEach(o => {
      scaleObjectFromStart(o, cloneObject(o, { keepIds: true }), sx, sy);
    });
  } else {
    state.objects = [];
    setSelection([]);
  }
  resizeCanvas();
  syncPromptAspectToCanvas();
  generateTourismPrompt();
  renderAll();
  syncUi();
  persist();
}

function renderPresets() {
  const list = document.getElementById("presetList");
  const q = document.getElementById("presetSearch").value.trim().toLowerCase();
  list.innerHTML = "";
  presets
    .filter(p => `${p.platform} ${p.label} ${p.width} ${p.height}`.toLowerCase().includes(q))
    .sort((a, b) => Number(b.recommended) - Number(a.recommended))
    .forEach(p => {
      const btn = document.createElement("button");
      btn.className = `preset ${p.width === state.width && p.height === state.height && p.platform === state.platform ? "active" : ""}`;
      btn.innerHTML = `<strong>${p.platform} · ${p.label}</strong><span>${p.width} × ${p.height}${p.safe ? " · " + p.safe : ""}</span>`;
      btn.onclick = async () => {
        const keep = state.objects.length && await appConfirm("是否将现有元素等比适配到新尺寸？\n选择取消将创建空白画布。", {
          title: "切换画布尺寸",
          confirmText: "等比适配",
          cancelText: "新建空白"
        });
        setPreset(p, keep);
      };
      list.appendChild(btn);
    });
}

wire("presetSearch", "input", renderPresets);

wire("applyCustomSizeBtn", "click", async () => {
  const widthInput = document.getElementById("customCanvasWidth");
  const heightInput = document.getElementById("customCanvasHeight");
  const hint = document.getElementById("customSizeHint");
  const width = Math.round(Number(widthInput.value));
  const height = Math.round(Number(heightInput.value));
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 100 || height < 100 || width > 8000 || height > 8000) {
    hint.textContent = "请输入 100-8000 px 之间的宽度和高度。";
    return;
  }
  const keep = state.objects.length && await appConfirm("是否将现有元素等比适配到自定义尺寸？\n选择取消将创建空白画布。", {
    title: "应用自定义尺寸",
    confirmText: "等比适配",
    cancelText: "新建空白"
  });
  setPreset({
    platform: "自定义",
    label: `${width} × ${height}`,
    width,
    height
  }, keep);
  widthInput.value = width;
  heightInput.value = height;
  hint.textContent = `已应用自定义尺寸：${width} × ${height} px`;
});

wire("newBlankBtn", "click", async () => {
  if (state.objects.length && !await appConfirm("确定清空当前画布并新建空白画布吗？", {
    title: "新建空白画布",
    confirmText: "清空并新建",
    kind: "danger"
  })) return;
  saveHistory();
  state.objects = [];
  setSelection([]);
  setBackgroundColor("#ffffff", false);
  syncUi();
  persist();
});

function renderSwatches() {
  const box = document.getElementById("swatches");
  box.innerHTML = "";
  swatchColors.forEach(color => {
    const normalized = normalizeHexColor(color);
    const btn = document.createElement("button");
    btn.className = "swatch";
    btn.style.background = normalized;
    btn.dataset.color = normalized;
    btn.title = normalized.toUpperCase();
    btn.setAttribute("aria-label", `设置背景色 ${normalized.toUpperCase()}`);
    btn.onclick = () => {
      setBackgroundColor(normalized);
    };
    box.appendChild(btn);
  });
  syncBackgroundColorUi();
}

function syncFontSelect() {
  const select = document.getElementById("fontFamily");
  const current = select.value;
  select.innerHTML = "";
  [
    ["推荐字体", baseFonts],
    ["本地字体", localFonts]
  ].forEach(([label, fonts]) => {
    if (!fonts.length) return;
    const group = document.createElement("optgroup");
    group.label = label;
    fonts.forEach(f => {
      const option = document.createElement("option");
      option.value = f.family;
      option.textContent = f.label;
      option.style.fontFamily = `"${f.family}", sans-serif`;
      group.appendChild(option);
    });
    select.appendChild(group);
  });
  if (current) select.value = current;
}

function syncInspectorOutputs(obj = selected()) {
  if (!obj) return;
  document.getElementById("strokeWidthValue").textContent = String(obj.strokeWidth || 0);
  document.getElementById("shapeRadiusValue").textContent = String(Math.round(obj.radius || 0));
  document.getElementById("shapeSidesValue").textContent = String(Math.round(obj.sides || 6));
  document.getElementById("shapeStarPointsValue").textContent = String(Math.round(obj.points || 5));
  document.getElementById("opacityValue").textContent = `${Math.round((obj.opacity ?? 1) * 100)}%`;
  document.getElementById("shadowValue").textContent = String(obj.shadow || 0);
}

function syncTransformInputs(obj = selected()) {
  const objects = selectedObjects();
  const bounds = objects.length > 1 ? selectionBounds(objects) : obj;
  if (!bounds) return;
  document.getElementById("posX").value = Math.round(bounds.x || 0);
  document.getElementById("posY").value = Math.round(bounds.y || 0);
  document.getElementById("objWidth").value = Math.round(bounds.width || 0);
  document.getElementById("objHeight").value = Math.round(bounds.height || 0);
  document.getElementById("rotation").value = objects.length > 1 ? "" : Math.round(obj.rotation || 0);
  document.getElementById("lockAspect").checked = objects.length > 1 ? true : defaultLockAspect(obj);
}

function syncUi(updateValues = true) {
  renderPresets();
  renderLayers();
  const obj = selected();
  const objects = selectedObjects();
  const multi = objects.length > 1;
  document.querySelector(".right").classList.toggle("has-selection", !!objects.length);
  document.getElementById("emptyPanel").classList.toggle("hidden", !!objects.length);
  document.getElementById("propsPanel").classList.toggle("hidden", !objects.length);
  document.getElementById("selectionLabel").textContent = multi ? `${objects.length} 个图层` : obj ? obj.name : "未选中";
  syncBackgroundColorUi();
  document.getElementById("groupLayersBtn").disabled = objects.length < 2;
  document.getElementById("ungroupLayersBtn").disabled = !objects.some(item => item.type === "group");
  if (!objects.length || !updateValues) return;
  const isText = obj.type === "text";
  const isShape = obj.type === "shape";
  const isCompoundShape = obj.type === "compoundShape";
  const isImage = obj.type === "image";
  const isGroup = obj.type === "group";
  const isRect = isShape && obj.kind === "rect";
  const isLine = isShape && obj.kind === "line";
  const isTriangle = isShape && obj.kind === "triangle";
  const isPolygon = isShape && obj.kind === "polygon";
  const isStar = isShape && obj.kind === "star";
  const hasAppearance = isText || isShape || isCompoundShape || isImage || isGroup;
  const allText = objects.every(item => item.type === "text");
  const booleanReady = objects.length > 1 && objects.every(item => item.type === "shape" || item.type === "compoundShape");
  document.getElementById("textGroup").classList.toggle("hidden", multi ? !allText : !isText);
  document.getElementById("appearanceGroup").classList.toggle("hidden", multi || !hasAppearance);
  document.getElementById("booleanGroup").classList.toggle("hidden", !booleanReady);
  document.getElementById("imageGroup").classList.toggle("hidden", multi || !isImage);
  document.getElementById("appearanceGrid").classList.toggle("hidden", isImage || isGroup);
  document.getElementById("fillColor").closest(".compact-field").classList.toggle("hidden", isLine || isGroup);
  document.getElementById("strokeWidth").closest(".inline-control").classList.toggle("hidden", isImage || isGroup);
  document.getElementById("strokeDashControl").classList.toggle("hidden", !isLine);
  document.getElementById("shapeRadiusControl").classList.toggle("hidden", !(isRect || isTriangle || isPolygon || isStar));
  document.getElementById("shapeSidesControl").classList.toggle("hidden", !isPolygon);
  document.getElementById("shapeStarPointsControl").classList.toggle("hidden", !isStar);
  document.getElementById("shapeRadiusPresets").classList.toggle("hidden", !isRect);
  document.getElementById("fillColorLabel").textContent = isShape || isCompoundShape ? "填充颜色" : "文字颜色";
  document.getElementById("strokeColorLabel").textContent = isLine ? "线条颜色" : "描边颜色";
  syncTransformInputs(obj);
  if (multi) return;
  document.getElementById("textValue").value = obj.text || "";
  document.getElementById("fontFamily").value = obj.fontFamily || "PingFang SC";
  document.getElementById("fontSize").value = Math.round(obj.fontSize || 42);
  document.getElementById("fillColor").value = obj.fill || "#171411";
  document.getElementById("strokeColor").value = obj.stroke || "#171411";
  document.getElementById("strokeWidth").value = obj.strokeWidth || 0;
  document.getElementById("strokeDashToggle").checked = !!obj.strokeDash;
  document.getElementById("shapeRadius").value = obj.radius || 0;
  document.getElementById("shapeSides").value = obj.sides || 6;
  document.getElementById("shapeStarPoints").value = obj.points || 5;
  document.getElementById("opacity").value = obj.opacity ?? 1;
  document.getElementById("shadow").value = obj.shadow || 0;
  syncInspectorOutputs(obj);
  syncMaskControls();
  ["left", "center", "right"].forEach(align => {
    document.getElementById(`textAlign${align[0].toUpperCase()}${align.slice(1)}Btn`).classList.toggle("active", obj.align === align);
  });
}

function setupInspectorInteractions() {
  document.querySelectorAll(".inspector-group").forEach((group, index) => {
    const title = group.querySelector(".inspector-group-title");
    if (!title || title.dataset.ready) return;
    title.dataset.ready = "true";
    title.tabIndex = 0;
    title.setAttribute("role", "button");
    title.setAttribute("aria-expanded", "true");

    const toggle = document.createElement("span");
    toggle.className = "inspector-toggle";
    toggle.setAttribute("aria-hidden", "true");
    toggle.innerHTML = '<svg viewBox="0 0 16 16"><path d="M5.4 2.8L10.6 8L5.4 13.2L4.3 12.1L8.4 8L4.3 3.9L5.4 2.8Z"></path></svg>';
    title.appendChild(toggle);

    const setCollapsed = collapsed => {
      group.classList.toggle("collapsed", collapsed);
      title.setAttribute("aria-expanded", String(!collapsed));
    };

    title.addEventListener("click", () => setCollapsed(!group.classList.contains("collapsed")));
    title.addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      setCollapsed(!group.classList.contains("collapsed"));
    });

    if (index > 4 && window.innerHeight < 820) setCollapsed(true);
  });

  document.querySelectorAll(".right input[type='number']").forEach(input => {
    input.addEventListener("wheel", event => {
      if (document.activeElement !== input) return;
      event.preventDefault();
      const direction = event.deltaY < 0 ? 1 : -1;
      const step = Number(input.step || 1) || 1;
      input.value = String(Number(input.value || 0) + direction * step);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }, { passive: false });
  });
}

function renderLayers() {
  const box = document.getElementById("layers");
  box.innerHTML = "";
  [...state.objects].reverse().forEach(obj => {
    const btn = document.createElement("button");
    const active = selectedObjects().some(selectedObj => selectedObj.id === obj.id);
    btn.className = `layer ${active ? "active" : ""}`;
    btn.type = "button";
    btn.draggable = true;
    btn.dataset.layerId = obj.id;
    const typeLabel = obj.type === "compoundShape" ? "shape" : obj.type === "group" ? `group · ${(obj.children || []).length}` : obj.type;
    btn.innerHTML = `<span class="layer-name">${obj.name}</span><span class="layer-type">${typeLabel}</span>`;
    btn.onclick = event => {
      if (event.shiftKey || event.metaKey || event.ctrlKey) toggleSelection(obj.id);
      else setSelection([obj.id]);
      renderAll();
      syncUi();
    };
    btn.addEventListener("dragstart", event => {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", obj.id);
      btn.classList.add("dragging");
    });
    btn.addEventListener("dragend", () => {
      btn.classList.remove("dragging");
      document.querySelectorAll(".layer.drop-before, .layer.drop-after").forEach(item => item.classList.remove("drop-before", "drop-after"));
    });
    btn.addEventListener("dragover", event => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      document.querySelectorAll(".layer.drop-before").forEach(item => item.classList.remove("drop-before"));
      const rect = btn.getBoundingClientRect();
      btn.classList.toggle("drop-after", event.clientY > rect.top + rect.height / 2);
      btn.classList.toggle("drop-before", event.clientY <= rect.top + rect.height / 2);
    });
    btn.addEventListener("dragleave", () => {
      btn.classList.remove("drop-before", "drop-after");
    });
    btn.addEventListener("drop", event => {
      event.preventDefault();
      const after = btn.classList.contains("drop-after");
      btn.classList.remove("drop-before", "drop-after");
      reorderLayer(event.dataTransfer.getData("text/plain"), obj.id, after);
    });
    box.appendChild(btn);
  });
  if (!state.objects.length) box.innerHTML = `<div class="empty">暂无图层。添加文字、图片、Logo 或图形开始。</div>`;
}

function setUpdateUi(status, payload = {}) {
  const statusEl = document.getElementById("updateStatus");
  const checkBtn = document.getElementById("checkUpdateBtn");
  const installBtn = document.getElementById("installUpdateBtn");
  if (!statusEl || !checkBtn || !installBtn) return;

  statusEl.className = "update-pill";
  installBtn.classList.add("hidden");
  checkBtn.disabled = false;
  const installLabel = installBtn.querySelector("span");
  if (installLabel) installLabel.textContent = "重启安装";

  if (status === "idle") {
    statusEl.classList.add("hidden");
    statusEl.textContent = "更新就绪";
  } else if (status === "checking") {
    statusEl.classList.add("is-checking");
    statusEl.textContent = "正在检查更新";
    checkBtn.disabled = true;
  } else if (status === "available") {
    statusEl.classList.add("is-ready");
    statusEl.textContent = `发现 ${payload.version || "新版本"}`;
    installBtn.classList.remove("hidden");
    if (window.youdesignDesktop && window.youdesignDesktop.platform === "tauri" && !window.__youdesignUpdatePrompting) {
      window.__youdesignUpdatePrompting = true;
      setTimeout(async () => {
        const version = payload.version || "新版本";
        if (await appConfirm(`发现 YOUDESIGN ${version}，是否立即下载并重启安装？`, {
          title: "发现新版本",
          confirmText: "下载并安装",
          cancelText: "稍后",
          kind: "update"
        })) {
          window.youdesignDesktop.installUpdate().catch(() => setUpdateUi("error"));
        }
        window.__youdesignUpdatePrompting = false;
      }, 100);
    }
  } else if (status === "downloading") {
    statusEl.classList.add("is-downloading");
    statusEl.textContent = `下载中 ${payload.percent || 0}%`;
    checkBtn.disabled = true;
  } else if (status === "downloaded") {
    statusEl.classList.add("is-ready");
    statusEl.textContent = `已下载 ${payload.version || "新版"}`;
    installBtn.classList.remove("hidden");
  } else if (status === "manual-download") {
    statusEl.classList.add("is-ready");
    statusEl.textContent = `请手动下载 ${payload.version || "新版"}`;
    installBtn.classList.remove("hidden");
    if (installLabel) installLabel.textContent = "打开下载页";
  } else if (status === "not-available") {
    statusEl.textContent = "已是最新";
  } else if (status === "dev-mode") {
    statusEl.textContent = "开发模式";
  } else if (status === "error") {
    const message = payload.message || payload.error || "";
    statusEl.textContent = message ? `更新失败：${message}` : "更新检查失败";
    statusEl.title = message;
  }
}

function setUpdateError(error) {
  setUpdateUi("error", { message: error?.message || String(error || "未知错误") });
}

function setupUpdateUi() {
  const checkBtn = document.getElementById("checkUpdateBtn");
  const installBtn = document.getElementById("installUpdateBtn");
  if (!checkBtn || !installBtn) return;

  if (!window.youdesignDesktop) {
    checkBtn.classList.add("hidden");
    installBtn.classList.add("hidden");
    setUpdateUi("idle");
    return;
  }

  checkBtn.addEventListener("click", () => window.youdesignDesktop.checkForUpdates().catch(setUpdateError));
  installBtn.addEventListener("click", () => window.youdesignDesktop.installUpdate().catch(setUpdateError));
  window.youdesignDesktop.onUpdateStatus(payload => setUpdateUi(payload.status, payload));
  window.youdesignDesktop.onCheckUpdate(() => window.youdesignDesktop.checkForUpdates());
  setUpdateUi("idle");
  if (window.youdesignDesktop.platform === "tauri") {
    setTimeout(() => window.youdesignDesktop.checkForUpdates().catch(setUpdateError), 1800);
  }
}

function setupTauriDesktopBridge() {
  if (window.youdesignDesktop || !window.__TAURI__ || !window.__TAURI__.core) return;
  const { invoke } = window.__TAURI__.core;
  const listen = window.__TAURI__.event && window.__TAURI__.event.listen;

  window.youdesignDesktop = {
    platform: "tauri",
    version: APP_VERSION,
    onCheckUpdate() {},
    checkForUpdates() {
      return invoke("check_for_updates");
    },
    listLocalFonts() {
      return invoke("list_local_fonts");
    },
    generateOpenAIImage(options) {
      return invoke("openai_generate_image", { request: options });
    },
    downloadRemoteAsset(url) {
      return invoke("download_remote_asset", { request: { url } });
    },
    saveExportFile(options) {
      return invoke("save_export_file", {
        request: {
          filename: options.filename,
          text: options.text || null,
          dataUrl: options.dataUrl || null
        }
      });
    },
    installUpdate() {
      return invoke("install_update");
    },
    onUpdateStatus(callback) {
      if (!listen) return () => {};
      let unlisten = null;
      listen("youdesign:update-status", event => callback(event.payload))
        .then(fn => { unlisten = fn; })
        .catch(() => {});
      return () => {
        if (unlisten) unlisten();
      };
    }
  };

  invoke("app_version")
    .then(version => { window.youdesignDesktop.version = version; })
    .catch(() => {});
}

async function init() {
  applyIconSystem();
  setupInspectorInteractions();
  setupTauriDesktopBridge();
  setupPromptGenerator();
  setupUnsplashLibrary();
  setupMaskTools();
  setupToolPanelHover();
  setupUpdateUi();
  syncFontSelect();
  renderSwatches();
  loadLogoAssets();
  loadMascotAssets();
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) {
    try { await restore(cached); return; } catch (e) {}
  }
  resizeCanvas();
  syncPromptAspectToCanvas();
  state.background = "#ffffff";
  renderAll();
  syncUi();
  persist();
}

init();
