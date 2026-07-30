const FLOOR_NAMES = {
  B1: "B1 · 地下室",
  F1: "F1 · 一楼",
  F2: "F2 · 二楼",
};

const app = document.querySelector("#vr-app");
const panoramaStage = document.querySelector("#panorama-stage");
const sceneName = document.querySelector("#scene-name");
const floorName = document.querySelector("#floor-name");
const styleName = document.querySelector("#style-name");
const activeSwatches = document.querySelector("#active-swatches");
const sceneIndex = document.querySelector("#scene-index");
const loadingScreen = document.querySelector("#loading-screen");
const loadingScene = document.querySelector("#loading-scene");
const errorScreen = document.querySelector("#error-screen");
const gestureGuide = document.querySelector("#gesture-guide");
const styleSheet = document.querySelector("#style-sheet");
const helpPanel = document.querySelector("#help-panel");
const styleGrid = document.querySelector("#style-grid");
const sceneList = document.querySelector("#scene-list");
const timeSwitch = document.querySelector("#time-switch");
const gyroButton = document.querySelector("#gyro-button");
const toast = document.querySelector("#toast");

let manifest;
let viewer;
let activeStyle = "modern_wood";
let activeTime = "noon";
let activeScene = "living";
let gyroActive = false;
let toastTimer;
let gestureTimer;

function assetPath(template) {
  return template.replace("{style}", activeStyle);
}

function currentStyle() {
  return manifest.styles.find((style) => style.id === activeStyle);
}

function currentScene() {
  return manifest.scenes.find((scene) => scene.id === activeScene);
}

function createHotspotTooltip(hotSpotDiv, args) {
  hotSpotDiv.classList.add("room-hotspot");
  const arrow = document.createElement("span");
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "⌃";
  const label = document.createElement("b");
  label.textContent = args.label;
  hotSpotDiv.append(arrow, label);
}

function panoramaConfig() {
  const scenes = {};
  for (const scene of manifest.scenes) {
    scenes[scene.id] = {
      type: "equirectangular",
      title: scene.name,
      panorama: assetPath(scene.panorama),
      haov: 360,
      vaov: 180,
      vOffset: 0,
      yaw: scene.yaw,
      hfov: 92,
      minHfov: 50,
      maxHfov: 112,
      hotSpots: scene.hotspots.map((hotspot) => ({
        pitch: hotspot.pitch,
        yaw: hotspot.yaw,
        type: "scene",
        sceneId: hotspot.target,
        targetYaw: "sameAzimuth",
        targetPitch: 0,
        text: hotspot.label,
        cssClass: "room-hotspot-shell",
        createTooltipFunc: createHotspotTooltip,
        createTooltipArgs: { label: hotspot.label },
      })),
    };
  }

  return {
    default: {
      firstScene: activeScene,
      autoLoad: true,
      showControls: false,
      keyboardZoom: true,
      mouseZoom: true,
      draggable: true,
      friction: 0.18,
      sceneFadeDuration: 550,
      compass: false,
      escapeHTML: true,
      strings: {
        loadButtonLabel: "进入全景",
        loadingLabel: "加载中…",
        bylineLabel: "作者：%s",
        noPanoramaError: "全景图没有加载出来。",
        fileAccessError: "无法打开本地文件。",
        malformedURLError: "链接格式不正确。",
        iOS8WebGLError: "当前设备不支持 WebGL。",
        genericWebGLError: "当前浏览器无法显示 360° 全景。",
        textureSizeError: "全景图片对当前设备过大。",
        unknownError: "发生未知错误。",
      },
    },
    scenes,
  };
}

function createViewer({ preserveView = false } = {}) {
  let view;
  if (preserveView && viewer) {
    view = {
      pitch: viewer.getPitch(),
      yaw: viewer.getYaw(),
      hfov: viewer.getHfov(),
    };
  }
  viewer?.destroy();
  loadingScreen.hidden = false;
  errorScreen.hidden = true;
  loadingScene.textContent = currentScene().name;
  viewer = pannellum.viewer("panorama", panoramaConfig());

  viewer.on("load", () => {
    loadingScreen.hidden = true;
    errorScreen.hidden = true;
    if (view) {
      viewer.lookAt(view.pitch, view.yaw, view.hfov, 0);
    }
    window.clearTimeout(gestureTimer);
    gestureGuide.classList.add("is-visible");
    gestureTimer = window.setTimeout(
      () => gestureGuide.classList.remove("is-visible"),
      3600,
    );
  });

  viewer.on("scenechange", (id) => {
    activeScene = id;
    updateSceneChrome();
  });

  viewer.on("error", () => {
    loadingScreen.hidden = true;
    errorScreen.hidden = false;
  });
}

function updateSceneChrome() {
  const scene = currentScene();
  sceneName.textContent = scene.name;
  floorName.textContent = FLOOR_NAMES[scene.floor];
  loadingScene.textContent = scene.name;
  const index = manifest.scenes.findIndex((item) => item.id === scene.id);
  sceneIndex.textContent = String(index + 1).padStart(2, "0");
  document.querySelectorAll("[data-scene]").forEach((button) => {
    const selected = button.dataset.scene === scene.id;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
    if (selected) {
      button.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  });
}

function updateStyleChrome() {
  const style = currentStyle();
  styleName.textContent = style.name;
  activeSwatches.innerHTML = style.swatches
    .map((color) => `<i style="--swatch:${color}"></i>`)
    .join("");
  document.querySelectorAll("[data-style]").forEach((button) => {
    const selected = button.dataset.style === activeStyle;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}

function renderStyleGrid() {
  styleGrid.innerHTML = manifest.styles
    .map(
      (style, index) => `
        <button type="button" data-style="${style.id}" aria-pressed="${style.id === activeStyle}">
          <span class="style-number">${String(index + 1).padStart(2, "0")}</span>
          <span class="large-swatches" aria-hidden="true">
            ${style.swatches.map((color) => `<i style="--swatch:${color}"></i>`).join("")}
          </span>
          <span class="style-copy"><strong>${style.name}</strong><small>${style.tagline}</small></span>
          <span class="style-check" aria-hidden="true">✓</span>
        </button>`,
    )
    .join("");
}

function renderTimeSwitch() {
  timeSwitch.innerHTML = manifest.times
    .map(
      (time) => `
        <button type="button" data-time="${time.id}" aria-pressed="${time.id === activeTime}">
          <span aria-hidden="true">${time.id === "morning" ? "◔" : time.id === "noon" ? "☀" : "☾"}</span>
          ${time.name}
        </button>`,
    )
    .join("");
}

function renderSceneList() {
  sceneList.innerHTML = manifest.scenes
    .map(
      (scene) => `
        <button type="button" data-scene="${scene.id}" aria-pressed="${scene.id === activeScene}">
          <span class="scene-thumb" style="background-image:url('${assetPath(scene.thumbnail)}')">
            <i>${scene.floor}</i>
          </span>
          <strong>${scene.name}</strong>
        </button>`,
    )
    .join("");
}

function chooseStyle(id) {
  if (id === activeStyle) return;
  activeStyle = id;
  updateStyleChrome();
  renderSceneList();
  styleSheet.hidden = true;
  showToast(`已切换为${currentStyle().name}`);
  createViewer({ preserveView: true });
}

function chooseTime(id) {
  if (id === activeTime) return;
  activeTime = id;
  panoramaStage.dataset.time = id;
  renderTimeSwitch();
  const label = manifest.times.find((time) => time.id === id).name;
  showToast(`已切换为${label}光线`);
}

function chooseScene(id) {
  if (id === activeScene) return;
  activeScene = id;
  loadingScreen.hidden = false;
  loadingScene.textContent = currentScene().name;
  viewer.loadScene(id, 0, currentScene().yaw, 92);
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.hidden = false;
  toastTimer = window.setTimeout(() => {
    toast.hidden = true;
  }, 2300);
}

async function sharePage() {
  const data = {
    title: "我们的新家 · 沉浸式 VR",
    text: "在手机里站进房间，360°查看五种写实装修风格。",
    url: window.location.href,
  };
  try {
    if (navigator.share) {
      await navigator.share(data);
    } else {
      await navigator.clipboard.writeText(data.url);
      showToast("链接已复制，可以发给家人了");
    }
  } catch (error) {
    if (error?.name === "AbortError") return;
    showToast("请复制浏览器地址分享");
  }
}

async function toggleGyro() {
  try {
    if (gyroActive) {
      viewer.stopOrientation();
      gyroActive = false;
    } else {
      viewer.startOrientation();
      gyroActive = true;
    }
    gyroButton.classList.toggle("is-active", gyroActive);
    gyroButton.setAttribute("aria-pressed", String(gyroActive));
    showToast(gyroActive ? "转动手机即可环视" : "已关闭陀螺仪");
  } catch {
    showToast("请在浏览器设置中允许动作与方向访问");
  }
}

async function toggleFullscreen() {
  if (document.fullscreenElement) {
    await document.exitFullscreen();
    return;
  }
  try {
    await panoramaStage.requestFullscreen();
  } catch {
    app.classList.toggle("is-immersive");
  }
}

function bindEvents() {
  document.querySelector("#style-button").addEventListener("click", () => {
    styleSheet.hidden = false;
  });
  document.querySelectorAll("[data-close-sheet]").forEach((button) => {
    button.addEventListener("click", () => {
      styleSheet.hidden = true;
    });
  });
  document.querySelector("#help-button").addEventListener("click", () => {
    helpPanel.hidden = false;
  });
  document.querySelectorAll("[data-close-help]").forEach((button) => {
    button.addEventListener("click", () => {
      helpPanel.hidden = true;
    });
  });
  document.querySelector("#share-button").addEventListener("click", sharePage);
  document.querySelector("#gyro-button").addEventListener("click", toggleGyro);
  document.querySelector("#fullscreen-button").addEventListener("click", toggleFullscreen);
  document.querySelector("#retry-button").addEventListener("click", () => {
    createViewer({ preserveView: true });
  });
  styleGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-style]");
    if (button) chooseStyle(button.dataset.style);
  });
  timeSwitch.addEventListener("click", (event) => {
    const button = event.target.closest("[data-time]");
    if (button) chooseTime(button.dataset.time);
  });
  sceneList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-scene]");
    if (button) chooseScene(button.dataset.scene);
  });
  document.addEventListener("fullscreenchange", () => {
    viewer?.resize();
  });
}

async function init() {
  try {
    const response = await fetch("./tour-manifest.json", { cache: "no-cache" });
    if (!response.ok) throw new Error(`manifest ${response.status}`);
    manifest = await response.json();
    activeStyle = manifest.defaultStyle;
    activeTime = manifest.defaultTime;
    activeScene = manifest.defaultScene;
    panoramaStage.dataset.time = activeTime;
    renderStyleGrid();
    renderTimeSwitch();
    renderSceneList();
    updateStyleChrome();
    updateSceneChrome();
    bindEvents();
    createViewer();
  } catch (error) {
    console.error(error);
    loadingScreen.hidden = true;
    errorScreen.hidden = false;
  }
}

init();
