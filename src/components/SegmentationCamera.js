import React, {useEffect, useState} from 'react';
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
      } catch (e) {
        console.error('Failed to load model', e);
      }
    })();
  }, []);

  // JS function to run model
  const runModel = async inputTensor => {
    if (!model) return;
    try {
      const output = await model.run(inputTensor);
      console.log('Model output:', output);
    } catch (e) {
      console.error(e);
    }
  };

  // Wrap the JS function using the new API
  const runModelJS = Worklets.createRunOnJS(runModel);

  // Frame processor
  const frameProcessor = useFrameProcessor(
    frame => {
      'worklet';

      // Dummy preprocessing inside worklet
      const size = 257 * 257 * 3;
      const inputTensor = new Float32Array(size).fill(0.5);

      // Call JS function safely from worklet
      runModelJS(inputTensor);
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
        frameProcessorFps={5}
      />
      <Text style={styles.text}>Model ready!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  text: {color: 'white', fontSize: 18, position: 'absolute', bottom: 20},
});
