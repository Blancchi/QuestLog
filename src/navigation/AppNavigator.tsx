import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../hooks/useAuth';

// Screens
import HomeScreen from '../screens/HomeScreen';
import QuestListScreen from '../screens/QuestListScreen';
import QuestDetailScreen from '../screens/QuestDetailScreen';
import CreateQuestScreen from '../screens/CreateQuestScreen';
import EditQuestScreen from '../screens/EditQuestScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

export type RootStackParamList = {
  Tabs: undefined;
  QuestDetail: { questId: string };
  CreateQuest: undefined;
  EditQuest: { questId: string };
  Login: undefined;
  Register: undefined;
};

export type TabParamList = {
  Home: undefined;
  Quests: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const TabNavigator = () => (
  <Tab.Navigator screenOptions={{ headerShown: false }}>
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Quests" component={QuestListScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const AppNavigator = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={TabNavigator} />
        <Stack.Screen name="QuestDetail" component={QuestDetailScreen} />
        <Stack.Screen name="CreateQuest" component={CreateQuestScreen} />
        <Stack.Screen name="EditQuest" component={EditQuestScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
