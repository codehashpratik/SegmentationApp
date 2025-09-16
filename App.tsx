import React from 'react';
import {SafeAreaView, StyleSheet} from 'react-native';
import SegmentationCamera from './src/components/SegmentationCamera';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <SegmentationCamera />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: 'black'},
});
