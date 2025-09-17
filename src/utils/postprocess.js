import {
  VOC_COLORS,
  NUM_CLASSES,
  MODEL_INPUT_WIDTH,
  MODEL_INPUT_HEIGHT,
} from './constants';

export function postprocessMask(outputTensor) {
  const [h, w] = [MODEL_INPUT_HEIGHT, MODEL_INPUT_WIDTH];
  const mask = new Uint8Array(h * w);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let maxVal = -Infinity;
      let classIdx = 0;
      for (let c = 0; c < NUM_CLASSES; c++) {
        const idx = (y * w + x) * NUM_CLASSES + c;
        if (outputTensor[idx] > maxVal) {
          maxVal = outputTensor[idx];
          classIdx = c;
        }
      }
      mask[y * w + x] = classIdx;
    }
  }

  return {mask, width: w, height: h};
}

export function colorizeMask(maskData, width, height) {
  const rgba = new Uint8ClampedArray(width * height * 4);

  for (let i = 0; i < maskData.length; i++) {
    const classIdx = maskData[i];
    const [r, g, b] = VOC_COLORS[classIdx] || [255, 255, 255];
    rgba[i * 4] = r;
    rgba[i * 4 + 1] = g;
    rgba[i * 4 + 2] = b;
    rgba[i * 4 + 3] = 128;
  }

  return {data: rgba, width, height};
}
