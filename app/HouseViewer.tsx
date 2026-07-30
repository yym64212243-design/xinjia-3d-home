"use client";

export function HouseViewer() {
  return (
    <main className="vr-embed">
      <iframe
        className="vr-frame"
        src="/vr.html"
        title="我们的新家沉浸式 VR"
        allow="fullscreen; accelerometer; gyroscope"
      />
    </main>
  );
}
