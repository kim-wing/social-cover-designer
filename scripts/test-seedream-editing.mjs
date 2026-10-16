import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../src/seedream-editing.js", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const context = {};
vm.runInNewContext(source, context);

const editing = context.SeedreamEditing;
assert.ok(editing);
const splitLayout = editing.decompositionLayout([
  { z_index: 1, b64_json: "test", bounding_box: { absolute: [200, 100, 600, 300] } },
  { z_index: 0, b64_json: "test", size: "1000x500" }
]);
assert.equal(splitLayout[0].item.z_index, 0);
assert.deepEqual(Array.from(splitLayout[1].rect), [.2, .2, .6, .6]);
assert.throws(() => editing.decompositionLayout([{ z_index: 0, b64_json: "test" }, { z_index: 1, b64_json: "test" }]));
assert.equal(editing.imageProgressCopy("decompose").title, "正在拆分图片图层");

const editingProgress = editing.imageProgressCopy("edit", { targetCount: 3, elapsed: 12 });
assert.equal(editingProgress.title, "正在精准编辑图片");
assert.match(editingProgress.text, /3 个定位/);
assert.match(editingProgress.text, /已等待 12s/);
assert.equal(editingProgress.doneTitle, "图片编辑完成");
assert.equal(editingProgress.errorTitle, "图片编辑失败");

const generationProgress = editing.imageProgressCopy("generate", { elapsed: 4 });
assert.equal(generationProgress.title, "正在生成图片");
assert.match(generationProgress.text, /已等待 4s/);
assert.deepEqual(
  { ...editing.normalizePoint({ x: 100, y: 50 }, 200, 100) },
  { type: "point", x: 500, y: 500 }
);
assert.deepEqual(
  { ...editing.normalizePoint({ x: 200, y: 100 }, 200, 100) },
  { type: "point", x: 999, y: 999 }
);
assert.deepEqual(
  { ...editing.normalizeBoundingBox({ x: 180, y: 80 }, { x: 20, y: 10 }, 200, 100) },
  { type: "bbox", x1: 100, y1: 100, x2: 900, y2: 800 }
);

assert.deepEqual(
  { ...editing.fitImageSize(778, 778, 558, 413) },
  { width: 413, height: 413 },
  "The preview image must fit inside the real stage content box so the overlay cannot clip it"
);
assert.deepEqual(
  { ...editing.fitImageSize(2000, 1000, 600, 400) },
  { width: 600, height: 300 },
  "The preview fit must preserve the source aspect ratio"
);

const pointPrompt = editing.buildEditPrompt("把帽子改成黄色", { type: "point", x: 520, y: 460 });
assert.match(pointPrompt, /<point>520 460<\/point>/);
assert.match(pointPrompt, /保持未指定区域不变/);

const boxPrompt = editing.buildEditPrompt("替换为花园", {
  type: "bbox",
  x1: 120,
  y1: 180,
  x2: 640,
  y2: 760
});
assert.match(boxPrompt, /<bbox>120 180 640 760<\/bbox>/);
assert.match(boxPrompt, /保持区域外内容不变/);

const wholePrompt = editing.buildEditPrompt("整体改成夜景", null);
assert.equal(wholePrompt, "根据以下指令编辑 Image 1：整体改成夜景");

const multiPrompt = editing.buildEditPrompt("全部改成暖黄色灯光", [
  { type: "point", x: 220, y: 310 },
  { type: "bbox", x1: 580, y1: 180, x2: 860, y2: 520 }
]);
assert.match(multiPrompt, /2 个定位目标/);
assert.match(multiPrompt, /1\. <point>220 310<\/point> 附近的目标/);
assert.match(multiPrompt, /2\. <bbox>580 180 860 520<\/bbox> 区域内的目标/);
assert.match(multiPrompt, /对以上所有定位目标执行：全部改成暖黄色灯光/);
assert.match(multiPrompt, /保持所有定位目标之外的内容不变/);

const independentPrompt = editing.buildEditPrompt("", [
  { type: "point", x: 250, y: 300, instruction: "把帽子改成红色" },
  { type: "bbox", x1: 350, y1: 550, x2: 680, y2: 820, instruction: "删除区域内的路人" }
]);
assert.match(independentPrompt, /1\. 编辑 Image 1 <point>250 300<\/point> 附近的目标：把帽子改成红色/);
assert.match(independentPrompt, /2\. 编辑 Image 1 <bbox>350 550 680 820<\/bbox> 区域内的目标：删除区域内的路人/);
assert.match(independentPrompt, /保持所有定位目标之外的内容不变/);

const singleIndependentPrompt = editing.buildEditPrompt("", {
  type: "point",
  x: 410,
  y: 260,
  instruction: "只把背包改成绿色"
});
assert.match(singleIndependentPrompt, /<point>410 260<\/point> 附近的目标：只把背包改成绿色/);
assert.equal(editing.buildEditPrompt("", { type: "point", x: 410, y: 260 }), "");

const mixedInstructionPrompt = editing.buildEditPrompt("统一改成蓝色", [
  { type: "point", x: 120, y: 180, instruction: "改成红色" },
  { type: "point", x: 720, y: 280, instruction: "" }
]);
assert.match(mixedInstructionPrompt, /<point>120 180<\/point> 附近的目标：改成红色/);
assert.match(mixedInstructionPrompt, /<point>720 280<\/point> 附近的目标：统一改成蓝色/);

const incompleteIndependentPrompt = editing.buildEditPrompt("", [
  { type: "point", x: 100, y: 200, instruction: "保留" },
  { type: "point", x: 300, y: 400, instruction: "" }
]);
assert.equal(incompleteIndependentPrompt, "");

const filteredMultiPrompt = editing.buildEditPrompt("改成蓝色", [
  null,
  { type: "unknown" },
  { type: "point", x: 180, y: 240 }
]);
assert.match(filteredMultiPrompt, /<point>180 240<\/point>/);
assert.doesNotMatch(filteredMultiPrompt, /unknown/);

const overlayRule = styles.match(/\.seedream-studio-canvas canvas\s*\{([^}]+)\}/)?.[1] || "";
assert.match(
  overlayRule,
  /background:\s*transparent\s*;/,
  "Seedream annotation canvas must stay transparent so it does not cover the preview image"
);

const annotationStripRules = [...styles.matchAll(/\.seedream-annotation-strip\s*\{([^}]+)\}/g)];
const focusedAnnotationStripRule = annotationStripRules.at(-1)?.[1] || "";
assert.match(
  focusedAnnotationStripRule,
  /top:\s*auto\s*;/,
  "The focused annotation strip must release its earlier top inset so point chips cannot stretch into large blocks"
);

assert.match(
  appSource,
  /function fitSeedreamStudioCanvas\(\)[\s\S]*canvas\.style\.width[\s\S]*canvas\.style\.height/,
  "The workbench must explicitly synchronize the preview wrapper to the available stage size"
);
assert.match(
  appSource,
  /function promptEls\(\)[\s\S]*"seedreamStudioCanvas"/,
  "The preview wrapper must be available to the fitting routine through promptEls"
);

const pointerUpHandler = appSource.match(/function handleSeedreamStudioPointerUp\(event\)\s*\{([\s\S]*?)\n\}/)?.[1] || "";
assert.match(
  pointerUpHandler,
  /seedreamStudioPointFromEvent\(event, true\)/,
  "Bounding-box selection must use the pointer-up coordinate instead of the last pointer-move coordinate"
);

console.log("Seedream interactive editing tests passed");
