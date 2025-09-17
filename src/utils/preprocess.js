// utils/preprocess.js
export function preprocessFrameToInput(frame) {
  const inputWidth = 257;
  const inputHeight = 257;

  // Create a Float32Array in JS thread
  const floatArray = new Float32Array(inputWidth * inputHeight * 3);

  // Fill with zeros for now
  for (let i = 0; i < floatArray.length; i++) {
    floatArray[i] = 0;
  }

  return {
    data: floatArray,
    shape: [1, inputWidth, inputHeight, 3],
  };
}
