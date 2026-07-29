const MODELS = {
  whole: {
    label: "整栋",
    size: "三层叠合",
    src: "./models/whole-house.glb",
    woodSrc: "./models/whole-house-wood.glb",
    orbit: "35deg 68deg auto",
  },
  b1: {
    label: "地下室",
    size: "10.20 × 9.30 m · 层高 2.70 m",
    src: "./models/basement.glb",
    woodSrc: "./models/basement-wood.glb",
    orbit: "25deg 52deg auto",
  },
  f1: {
    label: "一楼",
    size: "10.34 × 8.88 m · 层高 3.00 m",
    src: "./models/ground-floor.glb",
    woodSrc: "./models/ground-floor-wood.glb",
    orbit: "25deg 52deg auto",
  },
  f2: {
    label: "二楼",
    size: "10.34 × 9.36 m · 层高 3.00 m",
    src: "./models/second-floor.glb",
    woodSrc: "./models/second-floor-wood.glb",
    orbit: "25deg 52deg auto",
  },
};

const STYLES = {
  original: { label: "规划模型色" },
  wood: { label: "简约原木风" },
};

const viewer = document.querySelector("#house-viewer");
const viewerShell = document.querySelector("#viewer-shell");
const viewerTitle = document.querySelector("#viewer-title");
const viewerSize = document.querySelector("#viewer-size");
const loadingPanel = document.querySelector("#loading-panel");
const loadingLabel = document.querySelector("#loading-label");
const progressTrack = document.querySelector("#progress-track");
const progressBar = document.querySelector("#progress-bar");
const progressLabel = document.querySelector("#progress-label");
const errorPanel = document.querySelector("#error-panel");
const gestureHint = document.querySelector("#gesture-hint");
const helpButton = document.querySelector("#help-button");
const helpCard = document.querySelector("#help-card");
const exitButton = document.querySelector("#exit-button");
const toast = document.querySelector("#toast");
const rotateButton = document.querySelector('[data-action="rotate"]');

let activeId = "whole";
let activeStyle = "original";
let reloadNumber = 0;
let hintTimer;
let toastTimer;

function activeModel() {
  return MODELS[activeId];
}

function activeModelSource() {
  const model = activeModel();
  return activeStyle === "wood" ? model.woodSrc : model.src;
}

function setLoading(value) {
  loadingPanel.hidden = !value;
  if (value) {
    errorPanel.hidden = true;
    gestureHint.hidden = true;
  }
}

function showHint() {
  window.clearTimeout(hintTimer);
  gestureHint.hidden = false;
  hintTimer = window.setTimeout(() => {
    gestureHint.hidden = true;
  }, 3800);
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.hidden = false;
  toastTimer = window.setTimeout(() => {
    toast.hidden = true;
  }, 2200);
}

function resetView() {
  viewer.cameraOrbit = activeModel().orbit;
  viewer.cameraTarget = "auto auto auto";
  viewer.fieldOfView = "35deg";
  viewer.jumpCameraToGoal?.();
}

function topView() {
  viewer.cameraOrbit = "0deg 1deg auto";
  viewer.cameraTarget = "auto auto auto";
  viewer.fieldOfView = "32deg";
  viewer.jumpCameraToGoal?.();
}

function chooseModel(id) {
  if (!MODELS[id] || id === activeId) return;

  activeId = id;
  const model = activeModel();
  viewerTitle.textContent = model.label;
  viewerSize.textContent = `${model.size} · ${STYLES[activeStyle].label}`;
  viewer.alt = `${model.label}${STYLES[activeStyle].label}三维住宅模型`;
  loadingLabel.textContent = `正在加载${model.label}·${STYLES[activeStyle].label}…`;
  progressBar.style.width = "6%";
  progressLabel.textContent = "正在准备模型";
  progressTrack.setAttribute("aria-valuenow", "0");
  errorPanel.hidden = true;
  setLoading(true);
  rotateButton.classList.remove("is-active");
  rotateButton.setAttribute("aria-pressed", "false");
  viewer.removeAttribute("auto-rotate");
  viewer.src = `${activeModelSource()}?v=${reloadNumber}`;

  document.querySelectorAll("[data-model]").forEach((button) => {
    const selected = button.dataset.model === id;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}

function chooseStyle(id) {
  if (!STYLES[id] || id === activeStyle) return;

  activeStyle = id;
  const model = activeModel();
  viewerSize.textContent = `${model.size} · ${STYLES[id].label}`;
  viewer.alt = `${model.label}${STYLES[id].label}三维住宅模型`;
  loadingLabel.textContent = `正在加载${model.label}·${STYLES[id].label}…`;
  progressBar.style.width = "6%";
  progressLabel.textContent = "正在准备装修效果";
  progressTrack.setAttribute("aria-valuenow", "0");
  errorPanel.hidden = true;
  setLoading(true);
  rotateButton.classList.remove("is-active");
  rotateButton.setAttribute("aria-pressed", "false");
  viewer.removeAttribute("auto-rotate");
  viewer.src = `${activeModelSource()}?v=${reloadNumber}`;

  document.querySelectorAll("[data-style]").forEach((button) => {
    const selected = button.dataset.style === id;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });

  showToast(id === "wood" ? "已切换为简约原木装修" : "已切换为原始模型色");
}

viewer.addEventListener("progress", (event) => {
  const progress = Math.max(
    0,
    Math.min(100, Math.round((event.detail?.totalProgress ?? 0) * 100)),
  );
  progressBar.style.width = `${Math.max(6, progress)}%`;
  progressLabel.textContent = progress > 0 ? `${progress}%` : "首次打开需要几秒钟";
  progressTrack.setAttribute("aria-valuenow", String(progress));
});

viewer.addEventListener("load", () => {
  setLoading(false);
  errorPanel.hidden = true;
  showHint();
});

viewer.addEventListener("error", () => {
  setLoading(false);
  errorPanel.hidden = false;
});

viewer.addEventListener("dblclick", resetView);

document.querySelectorAll("[data-model]").forEach((button) => {
  button.addEventListener("click", () => chooseModel(button.dataset.model));
});

document.querySelectorAll("[data-style]").forEach((button) => {
  button.addEventListener("click", () => chooseStyle(button.dataset.style));
});

document.querySelector('[data-action="reset"]').addEventListener("click", resetView);
document.querySelector('[data-action="top"]').addEventListener("click", topView);

rotateButton.addEventListener("click", () => {
  const enabled = !viewer.hasAttribute("auto-rotate");
  viewer.toggleAttribute("auto-rotate", enabled);
  rotateButton.classList.toggle("is-active", enabled);
  rotateButton.setAttribute("aria-pressed", String(enabled));
});

async function toggleFullscreen() {
  if (document.fullscreenElement) {
    await document.exitFullscreen();
    viewerShell.classList.remove("is-immersive");
    return;
  }

  if (viewerShell.requestFullscreen) {
    await viewerShell.requestFullscreen();
  } else {
    viewerShell.classList.toggle("is-immersive");
  }
}

document
  .querySelector('[data-action="fullscreen"]')
  .addEventListener("click", toggleFullscreen);
exitButton.addEventListener("click", toggleFullscreen);

document.querySelector('[data-action="share"]').addEventListener("click", async () => {
  const data = {
    title: "我们的新家 · 3D 户型",
    text: "打开后可以拖动旋转、双指放大缩小、逐层查看，还能一键切换简约原木装修效果。",
    url: window.location.href,
  };

  try {
    if (navigator.share) {
      await navigator.share(data);
    } else {
      await navigator.clipboard.writeText(window.location.href);
      showToast("链接已复制");
    }
  } catch (error) {
    if (error?.name === "AbortError") return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast("链接已复制");
    } catch {
      showToast("请复制浏览器地址分享");
    }
  }
});

helpButton.addEventListener("click", () => {
  const expanded = helpCard.hidden;
  helpCard.hidden = !expanded;
  helpButton.setAttribute("aria-expanded", String(expanded));
});

document.querySelector("#retry-button").addEventListener("click", () => {
  reloadNumber += 1;
  setLoading(true);
  errorPanel.hidden = true;
  viewer.src = `${activeModelSource()}?v=${reloadNumber}`;
});

document.querySelector("#fallback-button").addEventListener("click", () => {
  if (activeId === "whole") {
    reloadNumber += 1;
    setLoading(true);
    errorPanel.hidden = true;
    viewer.src = `${activeModelSource()}?v=${reloadNumber}`;
  } else {
    chooseModel("whole");
  }
});
