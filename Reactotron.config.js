// ReactotronConfig.js
import Reactotron from 'reactotron-react-native';
import { reactotronRedux } from 'reactotron-redux';

Reactotron
  .configure({ name: 'HayasDeliveryPartnerApp' }) // optional: host, etc.
  .useReactNative()
  .use(reactotronRedux())
  .connect();

Reactotron.clear();

console.tron = Reactotron;

export default Reactotron;
