import React, { useRef } from 'react';
import { View, ViewProps, TouchableOpacity, TouchableOpacityProps, Animated } from 'react-native';
import tw from '../../utils/tw';
import { motionPresets } from '../../lib/motion';

export const Card = ({ style, children, ...props }: ViewProps) => {
  return (
    <View
      style={[tw`bg-surface rounded-xl p-16 shadow-resting border border-neutral-200`, style]}
      {...props}
    >
      {children}
    </View>
  );
};

export const TouchableCard = ({ style, children, ...props }: TouchableOpacityProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: motionPresets.tap.scale,
      useNativeDriver: true,
      damping: motionPresets.spring.damping,
      stiffness: motionPresets.spring.stiffness,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: motionPresets.spring.damping,
      stiffness: motionPresets.spring.stiffness,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[tw`bg-surface rounded-xl p-16 shadow-resting border border-neutral-200`, style]}
        {...props}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};
