import React from 'react';
import {Canvas, Image as SkiaImage, useImage} from '@shopify/react-native-skia';

export function SegmentationOverlay({mask}) {
  const image = useImage(mask);
  if (!image) return null;

  return (
    <Canvas style={{flex: 1}}>
      <SkiaImage image={image} x={0} y={0} width={257} height={257} />
    </Canvas>
  );
}
