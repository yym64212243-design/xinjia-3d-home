import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import test from "node:test";

const STYLES = [
  "modern_wood",
  "new_chinese",
  "cream_wabi",
  "italian_minimal",
  "modern_luxury",
];
const SCENES = [
  "living",
  "dining",
  "entry",
  "master",
  "guest",
  "second",
  "bathroom",
  "tea",
];

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server renders the immersive home VR shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /我们的新家/);
  assert.match(html, /vr\.html/);
  assert.match(html, /沉浸式 VR/);
  assert.doesNotMatch(html, /codex-preview|Building your site|Starter Project/i);
});

test("static tour wires five styles, eight scenes and three times", async () => {
  const [index, viewer, manifestText] = await Promise.all([
    readFile(new URL("../docs/index.html", import.meta.url), "utf8"),
    readFile(new URL("../docs/viewer.js", import.meta.url), "utf8"),
    readFile(new URL("../docs/tour-manifest.json", import.meta.url), "utf8"),
  ]);
  const manifest = JSON.parse(manifestText);

  assert.equal(manifest.format, "equirectangular");
  assert.equal(manifest.styles.length, 5);
  assert.equal(manifest.scenes.length, 8);
  assert.deepEqual(
    manifest.times.map((time) => time.id),
    ["morning", "noon", "night"],
  );
  assert.match(index, /沉浸式住宅 VR/);
  assert.match(index, /ai-panoramas\/modern_wood\/living\.png/);
  assert.match(viewer, /type: "equirectangular"/);
  assert.match(viewer, /function chooseStyle/);
  assert.match(viewer, /function chooseTime/);
  assert.match(viewer, /panoramaStage\.dataset\.time/);
});

test("all 40 photoreal panoramas are present and exactly 2:1", async () => {
  for (const style of STYLES) {
    for (const scene of SCENES) {
      const url = new URL(
        `../docs/ai-panoramas/${style}/${scene}.png`,
        import.meta.url,
      );
      await access(url);
      assert.ok((await stat(url)).size > 900_000, `${style}/${scene} too small`);
      const png = await readFile(url);
      assert.equal(png.toString("ascii", 1, 4), "PNG");
      const width = png.readUInt32BE(16);
      const height = png.readUInt32BE(20);
      assert.equal(width, height * 2, `${style}/${scene} is not 2:1`);
    }
  }
});

test("static public site contains no private filesystem or local URLs", async () => {
  const [index, viewer, manifest] = await Promise.all([
    readFile(new URL("../docs/index.html", import.meta.url), "utf8"),
    readFile(new URL("../docs/viewer.js", import.meta.url), "utf8"),
    readFile(new URL("../docs/tour-manifest.json", import.meta.url), "utf8"),
  ]);
  const source = `${index}\n${viewer}\n${manifest}`;

  assert.doesNotMatch(source, /localhost|127\.0\.0\.1|file:\/\/|\/Users\//i);
  assert.doesNotMatch(source, /\.blend\b|Blender/i);
});
