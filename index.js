/**
 * @format
 */
if (__DEV__) {
    require('./Reactotron.config'); 
  }
  import TrackPlayer from 'react-native-track-player';
TrackPlayer.registerPlaybackService(() => require('./service'));

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
