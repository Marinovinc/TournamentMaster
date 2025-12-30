/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/navigation/MainTabNavigator.tsx
 * Creato: 2025-12-30
 * Descrizione: Bottom tab navigator per navigazione principale
 *
 * Dipendenze:
 * - @react-navigation/bottom-tabs
 * - react-native-vector-icons
 *
 * Utilizzato da:
 * - src/navigation/AppNavigator.tsx
 * =============================================================================
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

import HomeScreen from '@screens/HomeScreen';
import TournamentsScreen from '@screens/TournamentsScreen';
import LeaderboardScreen from '@screens/LeaderboardScreen';
import ProfileScreen from '@screens/ProfileScreen';

import { MainTabParamList } from '@/types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Tournaments':
              iconName = focused ? 'trophy' : 'trophy-outline';
              break;
            case 'Leaderboard':
              iconName = focused ? 'podium' : 'podium-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#0066CC',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
          paddingBottom: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: '#0066CC',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Home', headerTitle: 'TournamentMaster' }}
      />
      <Tab.Screen
        name="Tournaments"
        component={TournamentsScreen}
        options={{ title: 'Tornei' }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{ title: 'Classifica' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profilo' }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
