import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, MainTabParamList, AuthStackParamList } from '../types';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { MyBookingsScreen } from '../screens/MyBookingsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { RoomDetailScreen } from '../screens/RoomDetailScreen';
import { QRCodeModalScreen } from '../screens/QRCodeModalScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationLifecycle } from '../hooks/useNotificationLifecycle';
import { theme } from '../theme';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

const Stack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
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

/**
 * Tab Navigator chính của người dùng đã xác thực
 */
export const MainTabs: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: [
          styles.tabBar,
          {
            paddingBottom: Math.max(insets.bottom, 8),
            paddingTop: 8,
          },
        ],
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

/**
 * Auth Navigator dành cho người dùng chưa đăng nhập
 */
const AuthNavigator: React.FC = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 280,
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
};

export const RootNavigator: React.FC = () => {
  const { user, isRestoringSession, restoreSession } = useAuthStore();

  // Khôi phục phiên làm việc an toàn từ SecureStore / AsyncStorage khi app khởi động
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Đồng bộ nhắc nhở check-in khi app mở và lắng nghe thông báo hệ thống
  useNotificationLifecycle();

  // Màn hình chờ ngắn lúc khôi phục phiên (Splash loader)
  if (isRestoringSession) {
    return (
      <View style={styles.splashContainer}>
        <View style={styles.splashBadge}>
          <Text style={styles.splashBadgeText}>VKU</Text>
        </View>
        <Text style={styles.splashTitle}>VKU Room Booking</Text>
        <Text style={styles.splashSubtitle}>Trường ĐH CNTT & TT Việt - Hàn</Text>
        <ActivityIndicator
          size="small"
          color={theme.colors.primary}
          style={{ marginTop: 28 }}
        />
        <Text style={styles.splashLoadingText}>Đang kiểm tra phiên đăng nhập...</Text>
      </View>
    );
  }

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
        {!user ? (
          // Chưa đăng nhập -> Chỉ thấy AuthStack (Đăng nhập, Đăng ký)
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          // Đã đăng nhập -> Thấy luồng chính
          <>
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
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    ...theme.shadows.md,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  tabBarItem: {
    minHeight: theme.minTouchTarget,
    paddingVertical: 2,
  },
  splashContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  splashBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  splashBadgeText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.heavy,
    letterSpacing: 3,
  },
  splashTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  splashSubtitle: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  splashLoadingText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 10,
  },
});
