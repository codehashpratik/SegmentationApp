// // import React, {useEffect, useState} from 'react';
// // import {View, Text} from 'react-native';
// // import {
// //   Camera,
// //   useCameraDevice,
// //   useCameraDevices,
// // } from 'react-native-vision-camera';
// // import {loadTFLiteModel} from 'react-native-fast-tflite';

// // export default function SegmentationCamera() {
// //   const [permission, setPermission] = useState(false);
// //   const [model, setModel] = useState(null);

// //   const devices = useCameraDevices();
// //   // const device = permission ? devices.back : undefined;
// //   const device = useCameraDevice('back');
// //   useEffect(() => {
// //     (async () => {
// //       let status = await Camera.getCameraPermissionStatus();
// //       if (status !== 'authorized' && status !== 'granted') {
// //         status = await Camera.requestCameraPermission();
// //       }

// //       setPermission(status === 'authorized' || status === 'granted');
// //     })();
// //   }, []);

// //   useEffect(() => {
// //     (async () => {
// //       const m = await loadTFLiteModel(
// //         'deeplabv3_257_mv_gpu.tflite', // must be in android/app/src/main/assets
// //       );
// //       setModel(m);

// //       // Example: run on dummy input (257x257 RGB)
// //       const input = new Float32Array(257 * 257 * 3).fill(0.5);
// //       const output = m.runSync([input]);

// //       console.log('Segmentation output', output);
// //     })();
// //   }, []);

// //   if (!permission) return <Text>No permission</Text>;
// //   if (!device) return <Text>Loading camera...</Text>;

// //   return (
// //     <View style={{flex: 1}}>
// //       <Camera style={{flex: 1}} device={device} isActive={true} />
// //     </View>
// //   );
// // }

// import React, {useEffect, useState} from 'react';
// import {View, Text, StyleSheet} from 'react-native';
// import {
//   Camera,
//   useCameraDevice,
//   useCameraDevices,
//   useFrameProcessor,
// } from 'react-native-vision-camera';
// import {runOnJS} from 'react-native-reanimated';
// import {loadTFLiteModel} from 'react-native-fast-tflite';

// export default function SegmentationCamera() {
//   const [permission, setPermission] = useState(false);
//   const [model, setModel] = useState(null);
//   const [segmentationMask, setSegmentationMask] = useState(null);

//   const devices = useCameraDevices();
//   const device = useCameraDevice('back');

//   // Request camera permission
//   useEffect(() => {
//     (async () => {
//       let status = await Camera.getCameraPermissionStatus();
//       if (status !== 'authorized' && status !== 'granted') {
//         status = await Camera.requestCameraPermission();
//       }
//       setPermission(status === 'authorized' || status === 'granted');
//     })();
//   }, []);

//   // Load TFLite model
//   useEffect(() => {
//     (async () => {
//       const m = await loadTFLiteModel('deeplabv3_257_mv_gpu.tflite'); // must be in android/app/src/main/assets
//       setModel(m);
//     })();
//   }, []);

//   // Frame processor
//   const frameProcessor = useFrameProcessor(
//     frame => {
//       if (!model) return;

//       // 1️⃣ Preprocess frame -> 257x257 Float32Array
//       const input = preprocessFrame(frame);

//       // 2️⃣ Run model
//       const mask = model.runSync([input]);

//       // 3️⃣ Send mask to JS
//       runOnJS(setSegmentationMask)(mask);
//     },
//     [model],
//   );

//   // Placeholder preprocessing function
//   const preprocessFrame = frame => {
//     // TODO: Resize frame to 257x257, extract RGB, normalize 0-1
//     return new Float32Array(257 * 257 * 3).fill(0.5); // dummy for now
//   };

//   if (!permission) return <Text>No permission</Text>;
//   if (!device) return <Text>Loading camera...</Text>;

//   return (
//     <View style={{flex: 1}}>
//       <Camera
//         style={{flex: 1}}
//         device={device}
//         isActive={true}
//         frameProcessor={frameProcessor}
//         frameProcessorFps={5} // limit FPS for performance
//       />
//       {segmentationMask && (
//         <View style={StyleSheet.absoluteFill}>
//           <Text
//             style={{
//               color: 'white',
//               position: 'absolute',
//               top: 20,
//               left: 20,
//             }}>
//             Segmentation Running
//           </Text>
//           {/* TODO: Overlay mask on camera feed */}
//         </View>
//       )}
//     </View>
//   );
// }

import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraDevices,
  useFrameProcessor,
} from 'react-native-vision-camera';
import {runOnJS} from 'react-native-reanimated';
import {loadTFLiteModel} from 'react-native-fast-tflite';

export default function SegmentationCamera() {
  const [permission, setPermission] = useState(false);
  const [model, setModel] = useState(null);
  const [segmentationMask, setSegmentationMask] = useState(null);

  const devices = useCameraDevices();
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
      const m = await loadTFLiteModel('deeplabv3_257_mv_gpu.tflite'); // must be in android/app/src/main/assets
      setModel(m);
    })();
  }, []);

  // Placeholder preprocessing function
  const preprocessFrame = frame => {
    // TODO: Resize frame to 257x257, extract RGB, normalize 0-1
    return new Float32Array(257 * 257 * 3).fill(0.5); // dummy for now
  };

  // ✅ Frame processor worklet
  const frameProcessor = useFrameProcessor(
    frame => {
      'worklet'; // <-- IMPORTANT, marks function as a worklet
      if (!model) return;

      const input = preprocessFrame(frame);
      const mask = model.runSync([input]);
      runOnJS(setSegmentationMask)(mask);
    },
    [model],
  );

  if (!permission) return <Text>No permission</Text>;
  if (!device) return <Text>Loading camera...</Text>;

  return (
    <View style={{flex: 1}}>
      <Camera
        style={{flex: 1}}
        device={device}
        isActive={true}
        frameProcessor={frameProcessor}
        frameProcessorFps={5}
      />
      {segmentationMask && (
        <View style={StyleSheet.absoluteFill}>
          <Text
            style={{color: 'white', position: 'absolute', top: 20, left: 20}}>
            Segmentation Running
          </Text>
        </View>
      )}
    </View>
  );
}
