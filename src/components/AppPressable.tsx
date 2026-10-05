import React, { useCallback } from 'react';
import {
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
  StyleSheet,
  GestureResponderEvent,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export interface AppPressableProps extends PressableProps {
  /**
   * Scale factor khi chạm vào (mặc định 0.97)
   */
  scaleTo?: number;
  /**
   * Kiểu phản hồi rung (mặc định là light, hoặc false để tắt)
   */
  haptic?: Haptics.ImpactFeedbackStyle | 'selection' | false;
  /**
   * Style container
   */
  style?: StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
  children: React.ReactNode | ((state: { pressed: boolean }) => React.ReactNode);
}

export const AppPressable: React.FC<AppPressableProps> = ({
  scaleTo = 0.97,
  haptic = Haptics.ImpactFeedbackStyle.Light,
  style,
  disabled,
  onPressIn,
  onPressOut,
  children,
  ...rest
}) => {
  const scale = useSharedValue(1);

  const triggerHaptic = useCallback(async () => {
    if (disabled || haptic === false || Platform.OS === 'web') return;
    try {
      if (haptic === 'selection') {
        await Haptics.selectionAsync();
      } else {
        await Haptics.impactAsync(haptic);
      }
    } catch {
      // Haptics không khả dụng trên một số thiết bị hoặc web
    }
  }, [disabled, haptic]);

  const handlePressIn = useCallback(
    (e: GestureResponderEvent) => {
      if (!disabled) {
        scale.value = withSpring(scaleTo, {
          damping: 15,
          stiffness: 300,
          mass: 0.5,
        });
        triggerHaptic();
      }
      onPressIn?.(e);
    },
    [disabled, scaleTo, triggerHaptic, onPressIn, scale]
  );

  const handlePressOut = useCallback(
    (e: GestureResponderEvent) => {
      if (!disabled) {
        scale.value = withSpring(1, {
          damping: 15,
          stiffness: 300,
          mass: 0.5,
        });
      }
      onPressOut?.(e);
    },
    [disabled, onPressOut, scale]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Kế thừa các thuộc tính flex/width từ style (nếu là object/array) để Animated.View co giãn đúng với container
  const flattened = typeof style === 'function' ? null : StyleSheet.flatten(style);
  const layoutWrapperStyle: ViewStyle = {};
  if (flattened?.flex !== undefined) layoutWrapperStyle.flex = flattened.flex;
  if (flattened?.width !== undefined) layoutWrapperStyle.width = flattened.width;
  if (flattened?.alignSelf !== undefined) layoutWrapperStyle.alignSelf = flattened.alignSelf;

  return (
    <Animated.View style={[layoutWrapperStyle, animatedStyle]}>
      <Pressable
        disabled={disabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={style}
        {...rest}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
};
