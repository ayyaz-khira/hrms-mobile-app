import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, ViewProps, DimensionValue } from 'react-native';

type SkeletonProps = ViewProps & {
  width?: DimensionValue;
  height?: number | string;
  borderRadius?: number;
};

export const Skeleton = ({ style, width = '100%', height = 16, borderRadius = 6, ...rest }: SkeletonProps) => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height: height as any,
          borderRadius,
          opacity: pulseAnim,
        },
        style,
      ]}
      {...rest}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E2E8F0', // Slate-200 theme matching premium modern applications
  },
});

export default Skeleton;
