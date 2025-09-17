import React, {useEffect, useState, useCallback} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useFrameProcessor,
} from 'react-native-vision-camera';
import {loadTensorflowModel} from 'react-native-fast-tflite';
import {Worklets} from 'react-native-worklets-core';

export default function SegmentationCamera() {
  const [permission, setPermission] = useState(false);
  const [model, setModel] = useState(null);
  const device = useCameraDevice('back');

  // Request camera permission
  useEffect(() => {
    (async () => {
      let status = await Camera.getCameraPermissionStatus();
      if (status !== 'authorized' && status !== 'granted') {
        status = await Camera.requestCameraPermission();
      }
      setPermission(status === 'authorized' || status === 'granted');
    })();
  }, []);

  // Load TFLite model
  useEffect(() => {
    (async () => {
      try {
        const loadedModel = await loadTensorflowModel(
          require('../assets/2.tflite'),
        );
        setModel(loadedModel);

        console.log('Model loaded successfully');
        console.log('Model Inputs:', loadedModel.inputs);
        console.log('Model Outputs:', loadedModel.outputs);
      } catch (e) {
        console.error('Failed to load model', e);
      }
    })();
  }, []);

  // JS function to run model
  const runModel = useCallback(
    async inputTensor => {
      if (!model) return;
      try {
        // Allocate a fresh buffer
        const floatData = new Float32Array(inputTensor.data.length);
        for (let i = 0; i < inputTensor.data.length; i++) {
          floatData[i] = inputTensor.data[i];
        }

        const tensor = {data: floatData, shape: inputTensor.shape};
        const output = await model.run([tensor]);

        console.log('✅ Model output:', output);
      } catch (e) {
        console.error('❌ runModel error:', e);
      }
    },
    [model],
  );
  // Wrap the JS function
  const runModelJS = Worklets.createRunOnJS(runModel);

  // Frame processor
  // Frame processor
  const frameProcessor = useFrameProcessor(
    frame => {
      'worklet';

      // Just use plain JS array, no Float32Array here
      const size = 1 * 257 * 257 * 3;
      const data = new Array(size).fill(0.5);

      // Send only serializable data
      runModelJS({data, shape: [1, 257, 257, 3]});
    },
    [model],
  );
  if (!permission) return <Text>No camera permission</Text>;
  if (!device) return <Text>Loading camera...</Text>;

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive
        frameProcessor={frameProcessor}
        frameProcessorFps={10}
      />
      <Text style={styles.text}>Model ready!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  text: {color: 'white', fontSize: 18, position: 'absolute', bottom: 20},
});
