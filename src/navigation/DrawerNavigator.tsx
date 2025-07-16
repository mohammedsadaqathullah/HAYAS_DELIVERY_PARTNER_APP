// navigation/DrawerNavigator.tsx
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import BottomTabs from './BottomTabs';
import OrderHistoryScreen from '../screens/OrderHistory';
import EarningsScreen from '../screens/EarningScreen';
import CustomDrawer from '../components/CustomDrawer'; // adjust path if needed
import EarningsReportScreen from '../screens/EarningsReportScreen';
import WithdrawalScreen from '../screens/WithdrawalScreen';
import OrderDetailsScreen from '../screens/OrderDetailsScreen';

const Drawer = createDrawerNavigator();

const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: '#111',
          width: 280,
        },
      }}
    >
      <Drawer.Screen name="Home" component={BottomTabs} />
      <Drawer.Screen name="OrderHistory" component={OrderHistoryScreen} />
      <Drawer.Screen name="Earnings" component={EarningsScreen} />
      <Drawer.Screen name='EarningsReport' component={EarningsReportScreen}/>
      <Drawer.Screen name='Withdrawal' component={WithdrawalScreen}/>
      <Drawer.Screen name='OrderDetails' component={OrderDetailsScreen}/>

    </Drawer.Navigator>
  );
};

export default DrawerNavigator;
