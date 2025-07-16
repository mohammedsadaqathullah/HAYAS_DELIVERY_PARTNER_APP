import { View, Text } from 'react-native'
import React, { useEffect } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import AuthStack from './AuthStack'
import MainStack from './MainStack'
import { useAuth } from './AuthContext'

const AppNavigator = () => {
  const { loggedIn } = useAuth();

  useEffect(()=>{

  },[loggedIn])

  return (
   <NavigationContainer>
    {!loggedIn ? <AuthStack /> : <MainStack/>}
   </NavigationContainer>
  )
}

export default AppNavigator