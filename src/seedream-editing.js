(function exposeSeedreamEditing(global) {
  const MAX_NORMALIZED_COORDINATE = 999;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function normalizeAxis(value, size) {
    const safeSize = Math.max(1, Number(size) || 1);
    const scaled = Math.round(clamp(Number(value) || 0, 0, safeSize) / safeSize * 1000);
    return clamp(scaled, 0, MAX_NORMALIZED_COORDINATE);
  }

  function normalizePoint(point, width, height) {
    return {
      type: "point",
      x: normalizeAxis(point?.x, width),
      y: normalizeAxis(point?.y, height)
    };
  }

  function normalizeBoundingBox(start, end, width, height) {
    const first = normalizePoint(start, width, height);
    const second = normalizePoint(end, width, height);
    return {
      type: "bbox",
      x1: Math.min(first.x, second.x),
      y1: Math.min(first.y, second.y),
      x2: Math.max(first.x, second.x),
      y2: Math.max(first.y, second.y)
    };
  }

  function fitImageSize(width, height, maxWidth, maxHeight) {
    const sourceWidth = Math.max(1, Number(width) || 1);
    const sourceHeight = Math.max(1, Number(height) || 1);
    const availableWidth = Math.max(1, Number(maxWidth) || 1);
    const availableHeight = Math.max(1, Number(maxHeight) || 1);
    const scale = Math.min(1, availableWidth / sourceWidth, availableHeight / sourceHeight);
    return {
      width: Math.max(1, Math.floor(sourceWidth * scale)),
      height: Math.max(1, Math.floor(sourceHeight * scale))
    };
  }

  function annotationToken(annotation) {
    if (annotation?.type === "point") {
      return `<point>${annotation.x} ${annotation.y}</point>`;
    }
    if (annotation?.type === "bbox") {
      return `<bbox>${annotation.x1} ${annotation.y1} ${annotation.x2} ${annotation.y2}</bbox>`;
    }
    return "";
  }

  function imageProgressCopy(kind, options = {}) {
    if (kind === "decompose") return {
      title: "正在拆分图片图层",
      text: `正在识别并分离主体、文字和背景${options.elapsed !== undefined ? `，已等待 ${options.elapsed}s` : ""}。完成后会按原位置还原为独立图层。`,
      doneTitle: "图层拆分完成",
      doneText: "底图和透明图层已加入画布，可独立移动和缩放。",
      errorTitle: "图层拆分失败"
    };
    const isEdit = kind === "edit";
    const elapsed = Math.max(0, Math.round(Number(options.elapsed) || 0));
    const hasElapsed = options.elapsed !== undefined;
    const targetCount = Math.max(0, Math.round(Number(options.targetCount) || 0));
    if (isEdit) {
      const target = targetCount ? `正在处理 ${targetCount} 个定位` : "正在处理整图编辑";
      return {
        title: "正在精准编辑图片",
        text: hasElapsed
          ? `${target}，已等待 ${elapsed}s。完成后会自动替换画布中的当前图片。`
          : `${target}。通常需要 30–90 秒，完成后会自动替换画布中的当前图片。`,
        doneTitle: "图片编辑完成",
        doneText: "正在替换画布中的当前图片。",
        errorTitle: "图片编辑失败"
      };
    }
    return {
      title: "正在生成图片",
      text: hasElapsed
        ? `图片模型正在处理中，已等待 ${elapsed}s。完成后会自动加入画布。`
        : "图片模型正在根据 Prompt 生成。通常需要 30–90 秒，完成后会自动加入画布。",
      doneTitle: "图片生成完成",
      doneText: "正在把生成结果加入画布。",
      errorTitle: "图片生成失败"
    };
  }

  function decompositionLayout(data) {
    if (!Array.isArray(data) || data.length < 2 || data.length > 17) throw new Error("拆分结果缺少底图或独立图层。");
    const sorted = [...data].sort((a, b) => a.z_index - b.z_index);
    if (sorted[0].z_index !== 0) throw new Error("拆分结果缺少底图。");
    const dimensions = /^(\d+)x(\d+)$/.exec(sorted[0].size || "");
    const seen = new Set();
    return sorted.map(item => {
      if (!Number.isInteger(item.z_index) || item.z_index < 0 || seen.has(item.z_index)) throw new Error("拆分图层顺序无效。");
      seen.add(item.z_index);
      if (item.error) throw new Error(item.error.message || "部分图层生成失败。");
      if (!item.b64_json && !item.url) throw new Error("拆分图层缺少图片。");
      let rect = [0, 0, 1, 1];
      if (item.z_index > 0) {
        const absolute = item.bounding_box?.absolute;
        const normalized = item.bounding_box?.normalized;
        if (dimensions && Array.isArray(absolute)) {
          rect = absolute.map((value, index) => value / Number(dimensions[index % 2 + 1]));
        } else if (Array.isArray(normalized)) rect = normalized.map(value => value / 1000);
        else throw new Error("拆分图层缺少定位坐标。");
        if (rect.length !== 4 || !rect.every(Number.isFinite) || rect[0] < 0 || rect[1] < 0 || rect[2] > 1 || rect[3] > 1 || rect[2] <= rect[0] || rect[3] <= rect[1]) throw new Error("拆分图层坐标无效。");
      }
      return { item, rect };
    });
  }

  function buildEditPrompt(instruction, annotationInput) {
    const editInstruction = String(instruction || "").trim();
    const annotations = (Array.isArray(annotationInput) ? annotationInput : [annotationInput])
      .filter(annotation => annotationToken(annotation));
    if (!annotations.length) {
      return editInstruction ? `根据以下指令编辑 Image 1：${editInstruction}` : "";
    }
    const hasIndependentInstructions = annotations.some(annotation => String(annotation?.instruction || "").trim());
    const resolvedInstructions = annotations.map(annotation => (
      String(annotation?.instruction || "").trim() || editInstruction
    ));
    if (resolvedInstructions.some(value => !value)) return "";
    const annotation = annotations[0];
    if (hasIndependentInstructions && annotations.length > 1) {
      const targets = annotations.map((item, index) => {
        const location = item.type === "point" ? "附近的目标" : "区域内的目标";
        return `${index + 1}. 编辑 Image 1 ${annotationToken(item)} ${location}：${resolvedInstructions[index]}`;
      }).join("\n");
      return `${targets}\n保持所有定位目标之外的内容不变，并让修改内容与原图的透视、光线、材质和景深自然融合。`;
    }
    if (annotations.length > 1) {
      const targets = annotations.map((item, index) => {
        const location = item.type === "point" ? "附近的目标" : "区域内的目标";
        return `${index + 1}. ${annotationToken(item)} ${location}`;
      }).join("\n");
      return `编辑 Image 1 中以下 ${annotations.length} 个定位目标：\n${targets}\n对以上所有定位目标执行：${editInstruction}\n保持所有定位目标之外的内容不变，并让修改内容与原图的透视、光线、材质和景深自然融合。`;
    }
    const token = annotationToken(annotation);
    const resolvedInstruction = resolvedInstructions[0];
    if (annotation?.type === "point") {
      return `编辑 Image 1 中 ${token} 附近的目标：${resolvedInstruction}\n保持未指定区域不变，并让修改内容与原图的透视、光线、材质和景深自然融合。`;
    }
    if (annotation?.type === "bbox") {
      return `编辑 Image 1 中 ${token} 区域内的目标：${resolvedInstruction}\n保持区域外内容不变，并让区域边缘与原图的透视、光线、材质和景深自然融合。`;
    }
    return "";
  }

  global.SeedreamEditing = Object.freeze({
    MAX_NORMALIZED_COORDINATE,
    normalizePoint,
    normalizeBoundingBox,
    fitImageSize,
    annotationToken,
    imageProgressCopy,
    decompositionLayout,
    buildEditPrompt
  });
})(globalThis);
