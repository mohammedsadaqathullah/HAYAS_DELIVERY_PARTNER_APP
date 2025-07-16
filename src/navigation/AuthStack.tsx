import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from '../screens/Login';
import Register from '../screens/Register';
import { useAuth } from './AuthContext';

const Stack = createNativeStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{ animation: 'slide_from_right' }}>
    <Stack.Screen
  name="Login"
  component={Login}
  options={{ headerShown: false }}
/>

      <Stack.Screen name="Register" component={Register} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};

export default AuthStack;
