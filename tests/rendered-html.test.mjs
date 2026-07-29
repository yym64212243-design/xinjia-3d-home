import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import test from "node:test";

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

test("server renders the finished 3D home viewer", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /我们的新家/);
  assert.match(html, /简约原木/);
  assert.match(html, /切换装修风格/);
  assert.doesNotMatch(html, /codex-preview|Building your site|Starter Project/i);
});

test("both React and static viewers wire all floor and style variants", async () => {
  const [component, index, viewer] = await Promise.all([
    readFile(new URL("../app/HouseViewer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../docs/index.html", import.meta.url), "utf8"),
    readFile(new URL("../docs/viewer.js", import.meta.url), "utf8"),
  ]);

  for (const model of [
    "whole-house",
    "basement",
    "ground-floor",
    "second-floor",
  ]) {
    assert.match(component, new RegExp(`${model}\\.glb`));
    assert.match(component, new RegExp(`${model}-wood\\.glb`));
    assert.match(viewer, new RegExp(`${model}\\.glb`));
    assert.match(viewer, new RegExp(`${model}-wood\\.glb`));
  }

  assert.match(index, /data-style="original"/);
  assert.match(index, /data-style="wood"/);
  assert.match(index, /原木装修/);
  assert.match(component, /aria-label="切换装修风格"/);
  assert.match(viewer, /function chooseStyle/);
});

test("public and static model assets are present and non-empty", async () => {
  for (const directory of ["public/models", "docs/models"]) {
    for (const model of [
      "whole-house.glb",
      "whole-house-wood.glb",
      "basement.glb",
      "basement-wood.glb",
      "ground-floor.glb",
      "ground-floor-wood.glb",
      "second-floor.glb",
      "second-floor-wood.glb",
    ]) {
      const url = new URL(`../${directory}/${model}`, import.meta.url);
      await access(url);
      assert.ok((await stat(url)).size > 500_000, `${directory}/${model} too small`);
    }
  }

  await access(new URL("../public/og.png", import.meta.url));
  await access(new URL("../docs/og.png", import.meta.url));
});

test("static public site contains no private filesystem or local URLs", async () => {
  const [index, viewer] = await Promise.all([
    readFile(new URL("../docs/index.html", import.meta.url), "utf8"),
    readFile(new URL("../docs/viewer.js", import.meta.url), "utf8"),
  ]);
  const source = `${index}\n${viewer}`;

  assert.doesNotMatch(source, /localhost|127\.0\.0\.1|file:\/\/|\/Users\//i);
  assert.doesNotMatch(source, /\.blend\b|Blender/i);
});
