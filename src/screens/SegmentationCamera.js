import React, {useEffect, useState, useCallback} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useFrameProcessor,
} from 'react-native-vision-camera';
import {loadTensorflowModel} from 'react-native-fast-tflite';
import {Worklets} from 'react-native-worklets-core';
import {SegmentationOverlay} from '../components/SegmentationOverlay';
import postprocessMask from '../utils/postprocess';
import {preprocessFrameToInput} from '../utils/preprocess';
import colorizeMask from '../utils/constants';

export default function SegmentationCamera() {
  const [permission, setPermission] = useState(false);
  const [model, setModel] = useState(null);
  const [maskImage, setMaskImage] = useState(null);
  const device = useCameraDevice('back');

  // Ask for camera permission
  useEffect(() => {
    (async () => {
      let status = await Camera.getCameraPermissionStatus();
      if (status !== 'authorized' && status !== 'granted') {
        status = await Camera.requestCameraPermission();
      }
      setPermission(status === 'authorized' || status === 'granted');
    })();
  }, []);

  // Load DeepLab model
  useEffect(() => {
    (async () => {
      try {
        const loadedModel = await loadTensorflowModel(
          require('../assets/2.tflite'),
        );
        setModel(loadedModel);
        console.log('✅ Model loaded successfully');
        console.log('Model Inputs:', loadedModel.inputs);
        console.log('Model Outputs:', loadedModel.outputs);
      } catch (e) {
        console.error('❌ Failed to load model', e);
      }
    })();
  }, []);

  // JS function to run the model
  const runModel = useCallback(
    async ({pixels, width, height}) => {
      if (!model) return;

      // Convert raw pixels to Float32Array (normalization, resize, RGB conversion)
      const inputTensor = preprocessPixels(pixels, width, height);

      const output = await model.run([inputTensor]);
      const {mask, width: w, height: h} = postprocessMask(output);
      const colored = colorizeMask(mask, w, h);
      setMaskImage(colored);
    },
    [model],
  );

  function preprocessPixels(pixels, width, height) {
    const inputWidth = 257;
    const inputHeight = 257;
    const floatArray = new Float32Array(inputWidth * inputHeight * 3);

    // TODO: resize + normalize pixels
    // For now, just zeros
    return {data: floatArray, shape: [1, inputWidth, inputHeight, 3]};
  }

  const runModelJS = Worklets.createRunOnJS(runModel);
  // Process each camera frame
  let frameCount = 0;
  const frameProcessor = useFrameProcessor(
    frame => {
      'worklet';
      frameCount++;
      if (frameCount % 5 !== 0) return; // only every 5th frame

      try {
        if (typeof frame.toArray === 'function') {
          const pixels = frame.toArray('RGBA');
          runModelJS({pixels, width: frame.width, height: frame.height});
        }
      } catch (e) {
        console.warn('FrameProcessor error:', e);
      }
    },
    [model],
  );
  if (!permission) return <Text>No camera permission</Text>;
  if (!device) return <Text>Loading camera...</Text>;

  return (
    <View style={{flex: 1}}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive
        frameProcessor={frameProcessor}
      />
      {maskImage && <SegmentationOverlay mask={maskImage} />}
    </View>
  );
}
