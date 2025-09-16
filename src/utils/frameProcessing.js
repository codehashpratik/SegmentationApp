import {useFrameProcessor} from 'react-native-vision-camera';
import {runOnJS} from 'react-native-reanimated';
import {preprocessFrame} from '../utils/frameProcessing';

// JS callback to run model
const runModelJS = async (model, inputTensor) => {
  if (!model) return;
  try {
    const output = await model.run(inputTensor);
    console.log('Model output:', output);
  } catch (e) {
    console.error(e);
  }
};

// Frame processor WORKLET
const frameProcessor = model =>
  useFrameProcessor(
    frame => {
      'worklet';
      if (!model) return;

      const inputTensor = preprocessFrame(frame);

      // Send tensor to JS thread
      runOnJS(runModelJS)(model, inputTensor);
    },
    [model],
  );
