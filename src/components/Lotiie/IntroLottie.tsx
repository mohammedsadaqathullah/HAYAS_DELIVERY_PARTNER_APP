import { Dimensions, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import LottieView from 'lottie-react-native'

const IntroLottie = ({loop}:{loop:boolean}) => {
    const width = Dimensions.get('window').width
    const height = Dimensions.get('window').height
  return (
   <LottieView
   source={require('./introBike.json')}
   loop={loop}
   style={{ width: width * 0.7, aspectRatio: 1}}
   autoPlay
   resizeMode="contain"
/>
)}

export default IntroLottie
