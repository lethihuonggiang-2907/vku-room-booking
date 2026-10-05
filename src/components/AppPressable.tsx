import React, { useCallback } from 'react';
import {
  Pressable,
  PressableProps,
  PressableStateCallbackType,
  StyleProp,
  ViewStyle,
  GestureResponderEvent,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
      // Haptics không khả dụng trên một số thiết bị cũ hoặc môi trường web
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

  return (
    <AnimatedPressable
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={(state: PressableStateCallbackType) => {
        const resolvedStyle = typeof style === 'function' ? style(state) : style;
        return [resolvedStyle, animatedStyle] as any;
      }}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
};
