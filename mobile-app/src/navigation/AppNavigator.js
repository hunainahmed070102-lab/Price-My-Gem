import { TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  Home,
  History,
  ScanLine,
  TrendingUp,
  Settings,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Screens
import WelcomeScreen from '../screens/WelcomeScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ResultScreen from '../screens/ResultScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ComparisonScreen from '../screens/ComparisonScreen';
import GemstoneDetailScreen from '../screens/GemstoneDetailScreen';
import ScanScreen from '../screens/ScanScreen';
import PersonalInfoScreen from '../screens/PersonalInfoScreen';
import AboutAppScreen from '../screens/AboutAppScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

import { COLORS } from '../constants/config';
import { FONT_FAMILIES } from '../constants/typography';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_CONFIG = {
  HomeTab: { label: 'Home', Icon: Home },
  HistoryTab: { label: 'History', Icon: History },
  ScanTab: { label: 'Scan', Icon: ScanLine },
  CompareTab: { label: 'Market', Icon: TrendingUp },
  SettingsTab: { label: 'Settings', Icon: Settings },
};

function TabBarButton({
  android_ripple,
  pressOpacity,
  hoverEffect,
  href,
  children,
  ...rest
}) {
  return (
    <TouchableOpacity {...rest} activeOpacity={0.7}>
      {children}
    </TouchableOpacity>
  );
}

// Standard Root Bottom Tab Navigator with Lucide Icons
function MainTabs() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const cfg = TAB_CONFIG[route.name] || {
          label: route.name,
          Icon: Home,
        };
        const TabIcon = cfg.Icon;

        return {
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarLabel: cfg.label,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.inactive,
          tabBarButton: (props) => <TabBarButton {...props} />,
          tabBarLabelStyle: {
            fontFamily: FONT_FAMILIES.medium,
            fontSize: 11,
            marginBottom: 2,
          },
          tabBarStyle: {
            backgroundColor: COLORS.surface,
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
            elevation: 0,
            paddingTop: 6,
            paddingBottom: bottomInset,
            height: 58 + bottomInset,
          },
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              size={focused ? 22 : 20}
              color={color}
              strokeWidth={focused ? 2.3 : 1.8}
            />
          ),
        };
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="HistoryTab" component={HistoryScreen} />
      <Tab.Screen name="ScanTab" component={ScanScreen} />
      <Tab.Screen name="CompareTab" component={ComparisonScreen} />
      <Tab.Screen name="SettingsTab" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

// Root Navigator
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: COLORS.white },
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen 
          name="Result" 
          component={ResultScreen}
          options={{ 
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="GemstoneDetail" 
          component={GemstoneDetailScreen}
          options={{ 
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="PersonalInfo" 
          component={PersonalInfoScreen}
          options={{ 
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="AboutApp" 
          component={AboutAppScreen}
          options={{ 
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="ChangePassword" 
          component={ChangePasswordScreen}
          options={{ 
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}