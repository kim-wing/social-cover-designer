(function (root) {
  const MAX_FILE_BYTES = 30 * 1024 * 1024;
  const MAX_PIXELS = 64 * 1000 * 1000;
  function dimensions(buffer) {
    const view = new DataView(buffer);
    const bytes = new Uint8Array(buffer);
    const text = (offset, length) => String.fromCharCode(...bytes.slice(offset, offset + length));
    if (bytes.length >= 24 && view.getUint32(0) === 0x89504e47) return [view.getUint32(16), view.getUint32(20)];
    if (bytes.length >= 10 && text(0, 3) === 'GIF') return [view.getUint16(6, true), view.getUint16(8, true)];
    if (bytes.length >= 30 && text(0, 4) === 'RIFF' && text(8, 4) === 'WEBP') {
      const kind = text(12, 4);
      if (kind === 'VP8X') {
        const uint24 = offset => bytes[offset] | bytes[offset + 1] << 8 | bytes[offset + 2] << 16;
        return [1 + uint24(24), 1 + uint24(27)];
      }
      if (kind === 'VP8 ') return [view.getUint16(26, true) & 0x3fff, view.getUint16(28, true) & 0x3fff];
      if (kind === 'VP8L' && bytes[20] === 0x2f) {
        const bits = view.getUint32(21, true);
        return [(bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1];
      }
    }
    if (bytes.length >= 4 && view.getUint16(0) === 0xffd8) {
      let offset = 2;
      while (offset + 4 <= bytes.length) {
        if (bytes[offset++] !== 0xff) break;
        while (bytes[offset] === 0xff) offset++;
        const marker = bytes[offset++];
        if (marker === 0xd9 || marker === 0xda) break;
        if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
        if (offset + 2 > bytes.length) break;
        const size = view.getUint16(offset);
        if (size < 2 || offset + size > bytes.length) break;
        if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker) && size >= 7) {
          return [view.getUint16(offset + 5), view.getUint16(offset + 3)];
        }
        offset += size;
      }
    }
    throw new Error('无法读取图片尺寸，请转换为标准 JPG、PNG 或 WebP 后重试。');
  }
  async function inspect(file) {
    if (file.size > MAX_FILE_BYTES) throw new Error('图片超过 30MB，请先压缩后再上传。');
    // Read compressed bytes only, rejecting decompression bombs before image decode.
    const [width, height] = dimensions(await file.arrayBuffer());
    if (!width || !height || width > 16384 || height > 16384 || width * height > MAX_PIXELS) {
      throw new Error('图片尺寸过大，单边不能超过 16384px，总像素不能超过 6400 万。');
    }
    return { width, height, needsResize: width > 4096 || height > 4096 || width * height > 16000000 };
  }
  function resizedDimensions(width, height) {
    const scale = Math.min(1, 4096 / Math.max(width, height), Math.sqrt(16000000 / (width * height)));
    return [Math.max(1, Math.round(width * scale)), Math.max(1, Math.round(height * scale))];
  }
  root.YoudesignImages = { inspect, dimensions, resizedDimensions };
})(globalThis);
