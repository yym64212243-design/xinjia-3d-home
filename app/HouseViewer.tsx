"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type ModelId = "whole" | "b1" | "f1" | "f2";

type ModelDefinition = {
  id: ModelId;
  code: string;
  label: string;
  loadingLabel: string;
  src: string;
  orbit: string;
  size: string;
};

const MODELS: ModelDefinition[] = [
  {
    id: "whole",
    code: "ALL",
    label: "整栋",
    loadingLabel: "整栋",
    src: "/models/whole-house.glb",
    orbit: "35deg 68deg auto",
    size: "三层叠合",
  },
  {
    id: "b1",
    code: "B1",
    label: "地下室",
    loadingLabel: "地下室",
    src: "/models/basement.glb",
    orbit: "25deg 52deg auto",
    size: "10.20 × 9.30 m · 层高 2.70 m",
  },
  {
    id: "f1",
    code: "F1",
    label: "一楼",
    loadingLabel: "一楼",
    src: "/models/ground-floor.glb",
    orbit: "25deg 52deg auto",
    size: "10.34 × 8.88 m · 层高 3.00 m",
  },
  {
    id: "f2",
    code: "F2",
    label: "二楼",
    loadingLabel: "二楼",
    src: "/models/second-floor.glb",
    orbit: "25deg 52deg auto",
    size: "10.34 × 9.36 m · 层高 3.00 m",
  },
];

type ViewerElement = HTMLElement & {
  cameraOrbit?: string;
  cameraTarget?: string;
  fieldOfView?: string;
  jumpCameraToGoal?: () => void;
};

export function HouseViewer() {
  const [activeId, setActiveId] = useState<ModelId>("whole");
  const [moduleReady, setModuleReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [autoRotate, setAutoRotate] = useState(false);
  const [hintVisible, setHintVisible] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [immersive, setImmersive] = useState(false);
  const [toast, setToast] = useState("");

  const viewerRef = useRef<ViewerElement | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const active = useMemo(
    () => MODELS.find((model) => model.id === activeId) ?? MODELS[0],
    [activeId],
  );

  useEffect(() => {
    let mounted = true;
    import("@google/model-viewer").then(() => {
      if (mounted) {
        setModuleReady(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!moduleReady || !viewerRef.current) {
      return;
    }

    const viewer = viewerRef.current;
    const onProgress = (event: Event) => {
      const value =
        (event as CustomEvent<{ totalProgress?: number }>).detail
          ?.totalProgress ?? 0;
      setProgress(Math.max(0, Math.min(100, Math.round(value * 100))));
    };
    const onLoad = () => {
      setProgress(100);
      setLoading(false);
      setFailed(false);
    };
    const onError = () => {
      setLoading(false);
      setFailed(true);
    };
    const onDoubleClick = () => resetView();

    viewer.addEventListener("progress", onProgress);
    viewer.addEventListener("load", onLoad);
    viewer.addEventListener("error", onError);
    viewer.addEventListener("dblclick", onDoubleClick);

    return () => {
      viewer.removeEventListener("progress", onProgress);
      viewer.removeEventListener("load", onLoad);
      viewer.removeEventListener("error", onError);
      viewer.removeEventListener("dblclick", onDoubleClick);
    };
    // resetView intentionally uses the current active model.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleReady, active.id, reloadKey]);

  useEffect(() => {
    if (loading || failed) {
      return;
    }
    setHintVisible(true);
    const timer = window.setTimeout(() => setHintVisible(false), 3800);
    return () => window.clearTimeout(timer);
  }, [loading, failed, active.id]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function selectModel(id: ModelId) {
    if (id === activeId) {
      return;
    }
    setActiveId(id);
    setLoading(true);
    setProgress(0);
    setFailed(false);
    setAutoRotate(false);
  }

  function resetView() {
    const viewer = viewerRef.current;
    if (!viewer) {
      return;
    }
    viewer.cameraOrbit = active.orbit;
    viewer.cameraTarget = "auto auto auto";
    viewer.fieldOfView = "35deg";
    viewer.jumpCameraToGoal?.();
  }

  function topView() {
    const viewer = viewerRef.current;
    if (!viewer) {
      return;
    }
    viewer.cameraOrbit = "0deg 1deg auto";
    viewer.cameraTarget = "auto auto auto";
    viewer.fieldOfView = "32deg";
    viewer.jumpCameraToGoal?.();
  }

  async function toggleFullscreen() {
    const shell = shellRef.current;
    if (!shell) {
      return;
    }

    if (document.fullscreenElement) {
      await document.exitFullscreen();
      setImmersive(false);
      return;
    }

    if (shell.requestFullscreen) {
      await shell.requestFullscreen();
      setImmersive(true);
    } else {
      setImmersive((current) => !current);
    }
  }

  async function sharePage() {
    const shareData = {
      title: "我们的新家 · 3D 户型",
      text: "打开后可以拖动旋转、双指放大缩小，也可以逐层查看。",
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setToast("链接已复制");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      try {
        await navigator.clipboard.writeText(window.location.href);
        setToast("链接已复制");
      } catch {
        setToast("请复制浏览器地址分享");
      }
    }
  }

  function retryLoad() {
    setLoading(true);
    setFailed(false);
    setProgress(0);
    setReloadKey((key) => key + 1);
  }

  const viewerProps: Record<string, unknown> = {
    ref: (element: ViewerElement | null) => {
      viewerRef.current = element;
    },
    key: `${active.id}-${reloadKey}`,
    src: `${active.src}?v=${reloadKey}`,
    poster: "/house-preview.png",
    alt: `${active.label}三维住宅模型`,
    "camera-controls": "",
    "touch-action": "none",
    "interaction-prompt": "auto",
    "interaction-prompt-threshold": "1200",
    "shadow-intensity": "0.7",
    "shadow-softness": "0.85",
    exposure: "1.08",
    "environment-image": "neutral",
    "camera-orbit": active.orbit,
    "camera-target": "auto auto auto",
    "field-of-view": "35deg",
    "min-field-of-view": "18deg",
    "max-field-of-view": "58deg",
    "auto-rotate-delay": "1200",
    "rotation-per-second": "16deg",
    className: "model-viewer",
  };
  if (autoRotate) {
    viewerProps["auto-rotate"] = "";
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark" aria-hidden="true">
          <span />
        </div>
        <div>
          <p className="eyebrow">家庭住宅 · 3D 户型</p>
          <h1>我们的新家</h1>
        </div>
        <button
          className="icon-button"
          type="button"
          onClick={() => setShowHelp((value) => !value)}
          aria-label="查看操作帮助"
          aria-expanded={showHelp}
        >
          ?
        </button>
      </header>

      <section
        ref={shellRef}
        className={`viewer-shell ${immersive ? "viewer-shell--immersive" : ""}`}
        aria-label="住宅三维模型查看器"
      >
        <div className="viewer-heading">
          <div>
            <strong>{active.label}</strong>
            <span>{active.size}</span>
          </div>
          {immersive && (
            <button
              className="close-immersive"
              type="button"
              onClick={toggleFullscreen}
              aria-label="退出全屏"
            >
              退出
            </button>
          )}
        </div>

        {React.createElement("model-viewer", viewerProps)}

        {(loading || !moduleReady) && !failed && (
          <div className="loading-panel" role="status" aria-live="polite">
            <div className="loading-house" aria-hidden="true">
              <span />
            </div>
            <strong>正在加载{active.loadingLabel}模型…</strong>
            <div
              className="progress-track"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
            >
              <span style={{ width: `${Math.max(6, progress)}%` }} />
            </div>
            <small>{progress > 0 ? `${progress}%` : "首次打开需要几秒钟"}</small>
          </div>
        )}

        {failed && (
          <div className="error-panel" role="alert">
            <strong>模型没加载出来</strong>
            <p>可能是网络暂时不稳定，请重新试一次。</p>
            <div>
              <button type="button" onClick={retryLoad}>
                重新加载
              </button>
              {active.id !== "whole" && (
                <button type="button" onClick={() => selectModel("whole")}>
                  查看整栋
                </button>
              )}
            </div>
          </div>
        )}

        {hintVisible && !loading && !failed && (
          <div className="gesture-hint" role="status">
            单指拖动旋转 · 双指放大缩小 · 双击回正
          </div>
        )}

        <div className="view-controls" aria-label="视角控制">
          <button type="button" onClick={resetView} aria-label="回到立体视角">
            <span aria-hidden="true">↺</span>
            回正
          </button>
          <button type="button" onClick={topView} aria-label="切换到俯视图">
            <span aria-hidden="true">⌾</span>
            俯视
          </button>
          <button
            type="button"
            className={autoRotate ? "is-active" : ""}
            onClick={() => setAutoRotate((value) => !value)}
            aria-pressed={autoRotate}
            aria-label="切换自动旋转"
          >
            <span aria-hidden="true">◌</span>
            旋转
          </button>
          <button type="button" onClick={toggleFullscreen} aria-label="全屏查看">
            <span aria-hidden="true">⤢</span>
            全屏
          </button>
          <button type="button" onClick={sharePage} aria-label="分享查看链接">
            <span aria-hidden="true">↗</span>
            分享
          </button>
        </div>
      </section>

      <nav className="floor-tabs" aria-label="选择要查看的楼层">
        {MODELS.map((model) => (
          <button
            key={model.id}
            type="button"
            className={model.id === active.id ? "is-selected" : ""}
            aria-pressed={model.id === active.id}
            onClick={() => selectModel(model.id)}
          >
            <strong>{model.code}</strong>
            <span>{model.label}</span>
          </button>
        ))}
      </nav>

      {showHelp && (
        <aside className="help-card" aria-label="操作说明">
          <strong>怎么查看</strong>
          <p>
            在房子上单指拖动可以旋转，双指张合可以缩放。点击下方楼层按钮可单独查看地下室、一楼和二楼。
          </p>
        </aside>
      )}

      <section className="model-notes" aria-label="模型信息">
        <div>
          <span>B1</span>
          <strong>地下室</strong>
          <small>10.20 × 9.30 m · 2.70 m</small>
        </div>
        <div>
          <span>F1</span>
          <strong>一楼</strong>
          <small>10.34 × 8.88 m · 3.00 m</small>
        </div>
        <div>
          <span>F2</span>
          <strong>二楼</strong>
          <small>10.34 × 9.36 m · 3.00 m</small>
        </div>
      </section>

      <footer>
        模型依据现有平面图制作，用于查看空间与装修布局，不代替现场复尺或施工图。
      </footer>

      {toast && (
        <div className="toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </main>
  );
}
