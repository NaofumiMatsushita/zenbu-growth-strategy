import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import MeasurementResultScreen from './src/screens/MeasurementResultScreen';
import ReportScreen from './src/screens/ReportScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Home Stack
function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0066cc',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'ZENBU騒音チェッカー' }}
      />
      <Stack.Screen
        name="MeasurementResult"
        component={MeasurementResultScreen}
        options={{ title: '測定結果' }}
      />
      <Stack.Screen
        name="Report"
        component={ReportScreen}
        options={{ title: 'レポート' }}
      />
    </Stack.Navigator>
  );
}

// History Stack
function HistoryStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0066cc',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="HistoryList"
        component={HistoryScreen}
        options={{ title: '測定履歴' }}
      />
      <Stack.Screen
        name="MeasurementResult"
        component={MeasurementResultScreen}
        options={{ title: '測定結果' }}
      />
      <Stack.Screen
        name="Report"
        component={ReportScreen}
        options={{ title: 'レポート' }}
      />
    </Stack.Navigator>
  );
}

// Settings Stack
function SettingsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0066cc',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="SettingsList"
        component={SettingsScreen}
        options={{ title: '設定' }}
      />
    </Stack.Navigator>
  );
}

function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === '測定') {
              iconName = 'mic';
            } else if (route.name === '履歴') {
              iconName = 'history';
            } else if (route.name === '設定') {
              iconName = 'settings';
            }

            return <Icon name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#0066cc',
          tabBarInactiveTintColor: 'gray',
          headerShown: false,
        })}
      >
        <Tab.Screen name="測定" component={HomeStack} />
        <Tab.Screen name="履歴" component={HistoryStack} />
        <Tab.Screen name="設定" component={SettingsStack} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default App;
