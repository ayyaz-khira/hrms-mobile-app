import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

type SkeletonProps = ViewProps & { width?: number | string; height?: number };

export const Skeleton = ({ style, width = '100%', height = 16, ...rest }: SkeletonProps) => {
  return <View style={[styles.skeleton, { width, height }, style]} {...rest} />;
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#EDEFF2',
    borderRadius: 6,
  },
});

export default Skeleton;
