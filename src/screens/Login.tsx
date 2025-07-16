import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback,
  Animated, Dimensions, Alert,
  ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import IntroLottie from '../components/Lotiie/IntroLottie';
import { useNavigation } from '@react-navigation/native';
import { useSendOtpMutation, useVerifyOtpMutation } from '../redux/Api/authApi';
import { useGetDeliveryPartnerByEmailMutation, useUpdateDeliveryPartnerStatusMutation } from '../redux/Api/DeliveryPartnerRegisterApi';
import { setDutyStatus, setOrderHistory, setUserDetails } from '../redux/slice/userSlice';
import { useDispatch } from 'react-redux';
import { useAuth } from '../navigation/AuthContext';

const { width, height } = Dimensions.get('window');

const Login = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loop, setLoop] = useState(false);
  const [sendOtp, { isLoading: isSending }] = useSendOtpMutation();
  const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation();
  const [isRegistered, setIsRegistered] = useState(false)
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const letters = ['H', 'A', 'Y', 'A', 'S'];
  const letterAnimations = useRef(letters.map(() => new Animated.Value(0))).current;
  const dispatch = useDispatch()
  const [getDeliveryPartnerByEmail] = useGetDeliveryPartnerByEmailMutation()
  const [updateDeliveryPartnerStatus] = useUpdateDeliveryPartnerStatusMutation()

  const { login } = useAuth(); 

  useEffect(() => {

    checkExistingRegistration()
  }, [])

  const checkExistingRegistration = async () => {
    setLoop(true)

    try {
      const savedEmail = await AsyncStorage.getItem("delivery_partner_email")
      if (savedEmail) {
        await checkUserStatus(savedEmail)
      }
    } catch (error) {
      Alert.alert("Error checking existing registration:", error.message)
    } finally {
      setLoop(false)
    }
  }

  const checkUserStatus = async (email: string) => {
    setLoop(true)

    try {
      const result = await getDeliveryPartnerByEmail(email).unwrap()
      if (result) {
        setIsRegistered(true)
        await AsyncStorage.setItem('status', result.userDetails.status || 'Pending')

        console.log('user', result)
        if (result.userDetails.status === "Approved") {
          await AsyncStorage.setItem('status', result.userDetails.status);
          dispatch(setUserDetails(result.userDetails));
          dispatch(setDutyStatus(result.dutyStatus));
          dispatch(setOrderHistory(result.orderHistory));
          setTimeout(() => {
            login();
          }, 2000);
        }


        if (result.status === "Rejected") {
          await AsyncStorage.setItem('status', result.userDetails.status)

        }
      }
    } catch (error) {
      console.log("User not found or error:", error)
      setIsRegistered(false)
    } finally {
      setLoop(false)
    }
  }

  useEffect(() => {
    Animated.stagger(400, letterAnimations.map(anim =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    )).start();
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();
  }, []);

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSendOtp = async () => {
    setLoop(true)
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    try {
      await sendOtp(email).unwrap();
      setOtpSent(true);
      setError('');
      // Alert.alert('OTP Sent', `OTP sent to ${email}`);
    } catch (err: any) {
      setError(err?.data?.message || 'Failed to send OTP');
      console.log('Error sending OTP:', err);
    } finally {
      setLoop(false)
    }
  };

  const handleVerifyOtp = async () => {
    setLoop(true)
    try {
      const res = await verifyOtp({ email, otp }).unwrap();
      await AsyncStorage.setItem('delivery_partner_email', email);


      await checkExistingRegistration();
    } catch (err: any) {
      Alert.alert('Invalid OTP', err?.data?.message || 'Verification failed');
    } finally {
      setLoop(false)
    }
  };

  const handleStatus = async (s: 'Approved' | 'Rejected') => {
    setLoop(true)
    try {
      const savedEmail = await AsyncStorage.getItem('delivery_partner_email');
      if (!savedEmail) throw new Error('Email not found in storage');

      const result = await updateDeliveryPartnerStatus({ email: savedEmail, status: 'Approved' }).unwrap();
      console.log('Status updated:', result.message);
    } catch (err: any) {
      // console.log('Error updating status:', err?.message || err);
      setLoop(false)
    }
  };


  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.inner}>
            <Animated.View style={[styles.centered, { opacity: fadeAnim }]}>
              <IntroLottie loop={loop} />
              <View style={styles.brandContainer}>
                {letters.map((letter, index) => (
                  <Animated.Text key={index} style={[styles.brandMainLetter, { opacity: letterAnimations[index] }]}>
                    {letter}
                  </Animated.Text>
                ))}
              </View>
              <Text style={styles.brandSub}>Delivery Partner</Text>
            </Animated.View>

            <View style={styles.loginBox}>
              <Text style={styles.title}>Login</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#888"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loop}
              />
              {otpSent && (
                <TextInput
                  style={styles.input}
                  placeholder="Enter OTP"
                  placeholderTextColor="#888"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="numeric"
                />
              )}
              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                style={styles.loginButton}
                onPress={otpSent ? handleVerifyOtp : handleSendOtp}
                disabled={isSending || isVerifying}

              >
                <Text style={styles.loginText}>
                  {otpSent ? (isVerifying ? 'Verifying...' : 'Verify OTP') : (isSending ? 'Sending OTP...' : 'Log In')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.registerButton} onPress={() => navigation.navigate('Register' as never)}>
                <Text style={styles.registerText}>Register Here</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.registerButton} onPress={() => handleStatus('Approved')}>
                <Text style={styles.registerText}>status </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>

    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'space-around',
    backgroundColor: 'black'
  },
  container: {
    flex: 1,
    backgroundColor: 'black'

  },
  inner: {
    flex: 1,
    justifyContent: 'space-around',
    // padding: 20,
  },
  centered: {
    height: height * 0.6,
    alignItems: 'center',
    justifyContent: 'center',

  },
  brandContainer: {

    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '-12%',
  },
  brandMainLetter: {
    color: 'white',
    fontSize: width * 0.11,
    fontWeight: 'bold',
    letterSpacing: 5,
  },

  brandSub: {
    color: 'white',
    fontSize: 18,
    fontWeight: '300',
    // marginTop: 4,
  },
  loginBox: {
    height: height * 0.3,
    backgroundColor: 'transparent',
    padding: 20,
    borderRadius: 16,
    justifyContent: 'flex-end'
  },
  title: {
    color: 'white',
    fontSize: 22,
    left: '3%',
    fontWeight: '600',
    marginBottom: 15,
  },
  input: {
    height: 50,

    borderRadius: 8,
    color: 'white',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  loginButton: {
    backgroundColor: 'white',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 5,
  },
  loginText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
  },
  registerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'orange',
    marginBottom: 10,
    fontSize: 14,
    left: '3%',
  },
});

export default Login;
