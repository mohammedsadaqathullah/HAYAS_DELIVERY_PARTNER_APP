import React from 'react';
import { StyleSheet, PermissionsAndroid, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import AppNavigator from './src/navigation/AppNavigator';
import { store } from './src/redux/store';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { AuthProvider } from './src/navigation/AuthContext';

function App(): React.JSX.Element {
  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.CAMERA,
      ]);
    } else if (Platform.OS === 'ios') {
      const photoStatus = await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
      const cameraStatus = await request(PERMISSIONS.IOS.CAMERA);
  
      if (
        photoStatus === RESULTS.BLOCKED ||
        cameraStatus === RESULTS.BLOCKED
      ) {
        console.warn('Please enable photo or camera permissions in settings');
      }
    }
  };
  requestPermissions();

  return (
    <Provider store={store}>
          <AuthProvider>

      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="black" />
        <AppNavigator />
      </SafeAreaView>
      </AuthProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingBottom:Platform.OS === 'ios' ? '1%' :0,
    backgroundColor: 'black', // <-- Set global background here
  },
});

export default App;
