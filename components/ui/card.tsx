import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

type CardProps = ViewProps & {
  children: React.ReactNode;
  elevation?: number;
};

export const Card = ({ children, style, elevation = 3, ...rest }: CardProps) => {
  return (
    <View style={[styles.card, { elevation }, style]} {...rest}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
});

export default Card;
