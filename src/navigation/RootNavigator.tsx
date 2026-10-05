import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, MainTabParamList } from '../types';
import { HomeScreen } from '../screens/HomeScreen';
import { MyBookingsScreen } from '../screens/MyBookingsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { RoomDetailScreen } from '../screens/RoomDetailScreen';
import { QRCodeModalScreen } from '../screens/QRCodeModalScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { useNotificationLifecycle } from '../hooks/useNotificationLifecycle';
import { theme } from '../theme';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

interface AnimatedTabIconProps {
  name: keyof typeof Ionicons.glyphMap;
  outlineName: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  color: string;
}

const AnimatedTabIcon: React.FC<AnimatedTabIconProps> = ({
  name,
  outlineName,
  focused,
  color,
}) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.18 : 1.0, {
      damping: 12,
      stiffness: 220,
    });
  }, [focused, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons
        name={focused ? name : outlineName}
        size={22}
        color={color}
      />
    </Animated.View>
  );
};

const handleTabPress = () => {
  if (Platform.OS !== 'web') {
    try {
      Haptics.selectionAsync();
    } catch {
      // Ignored
    }
  }
};

const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        listeners={{ tabPress: handleTabPress }}
        options={{
          tabBarLabel: 'Trang chủ',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              name="home"
              outlineName="home-outline"
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="MyBookingsTab"
        component={MyBookingsScreen}
        listeners={{ tabPress: handleTabPress }}
        options={{
          tabBarLabel: 'Lịch của tôi',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              name="calendar"
              outlineName="calendar-outline"
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        listeners={{ tabPress: handleTabPress }}
        options={{
          tabBarLabel: 'Hồ sơ',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              name="person"
              outlineName="person-outline"
              focused={focused}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export const RootNavigator: React.FC = () => {
  // Đồng bộ nhắc nhở check-in khi app mở và lắng nghe thông báo hệ thống
  useNotificationLifecycle();

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 280,
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      >
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen
          name="RoomDetail"
          component={RoomDetailScreen}
          options={{
            animation: 'slide_from_right',
            animationDuration: 280,
          }}
        />
        <Stack.Screen
          name="QRCodeModal"
          component={QRCodeModalScreen}
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            animationDuration: 320,
          }}
        />
        <Stack.Screen
          name="Notifications"
          component={NotificationsScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    height: 60,
    paddingBottom: 6,
    paddingTop: 6,
    ...theme.shadows.md,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabBarItem: {
    minHeight: theme.minTouchTarget,
  },
});
