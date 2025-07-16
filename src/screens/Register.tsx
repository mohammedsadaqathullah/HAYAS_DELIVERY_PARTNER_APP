"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import Icon from "react-native-vector-icons/MaterialIcons"
import {
  useRegisterDeliveryPartnerMutation,
  useSendOtpMutation,
  useVerifyOtpMutation,
  useGetDeliveryPartnerByEmailMutation,
} from "../redux/Api/DeliveryPartnerRegisterApi"

import { useNavigation } from "@react-navigation/native"
import StatusAnimation from "../components/StatusAnimation"
import ImageUploader from "../components/ImageUploader"
import { encryptData } from "../components/encryptDecrypt"
import { useUploadMultipleImagesMutation } from "../redux/Api/DeliveryPartnersImageApi"

const { width, height } = Dimensions.get("window")

interface FormData {
  name: string
  parentName: string
  email: string
  phone: string
  address: string
  pincode: string
}

interface UploadedImages {
  profile: boolean
  driving_license_front: boolean
  driving_license_back: boolean
  aadhaar_front: boolean
  aadhaar_back: boolean
}

const Register: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    parentName: "",
    email: "",
    phone: "",
    address: "",
    pincode: "",
  })

  const [uploadedImages, setUploadedImages] = useState<UploadedImages>({
    profile: false,
    driving_license_front: false,
    driving_license_back: false,
    aadhaar_front: false,
    aadhaar_back: false,
  })

  const [imageUris, setImageUris] = useState<Record<string, string>>({})
  const [otp, setOtp] = useState("")
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [errors, setErrors] = useState<Partial<FormData & { otp: string }>>({})
  const [userStatus, setUserStatus] = useState<"Pending" | "Approved" | "Rejected" | null>(null)
  const [isRegistered, setIsRegistered] = useState(false)

  const [registerDeliveryPartner, { isLoading: isRegistering }] = useRegisterDeliveryPartnerMutation()
  const [sendOtp, { isLoading: isSendingOtp }] = useSendOtpMutation()
  const [verifyOtp, { isLoading: isVerifyingOtp }] = useVerifyOtpMutation()
  const [getDeliveryPartnerByEmail] = useGetDeliveryPartnerByEmailMutation()

  const navigation = useNavigation()
  const [selectedImagePaths, setSelectedImagePaths] = useState<Record<string, string>>({})
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [uploadMultipleImages] = useUploadMultipleImagesMutation()
  const [uploadedTime, setUploadedTime] = useState<string>('')
  const handleImageSelected = (type: string, imagePath: string) => {
    setSelectedImagePaths((prev) => ({ ...prev, [type]: imagePath }))
  }

  useEffect(() => {
    checkExistingRegistration()
  }, [])

  const checkExistingRegistration = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem("delivery_partner_email")
      if (savedEmail) {
        setFormData((prev) => ({ ...prev, email: savedEmail.toLowerCase() }))
        await checkUserStatus(savedEmail)
      }
    } catch (error) {
      console.log("Error checking existing registration:", error)
    }
  }

  const checkUserStatus = async (email: string) => {
    try {
      const result = await getDeliveryPartnerByEmail(email).unwrap()
      if (result) {
        setUserStatus(result.userDetails.status || "Pending")
        setIsRegistered(true)
        await AsyncStorage.setItem('status', result.userDetails.status || 'Pending')

        if (result.status === "Approved") {
          await AsyncStorage.setItem('status', result.userDetails.status)
          setTimeout(() => {
            navigation.navigate("Login" as never) 
          }, 2000) 
        }
        
        if(result.status === "Rejected"){
          await AsyncStorage.setItem('status', result.userDetails.status )

        }
      }
    } catch (error) {
      console.log("User not found or error:", error)
      setIsRegistered(false)
    }
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^\d{10}$/
    return phoneRegex.test(phone)
  }

  const validatePincode = (pincode: string): boolean => {
    const pincodeRegex = /^\d{6}$/
    return pincodeRegex.test(pincode)
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData & { otp: string }> = {}

    if (!formData.name.trim()) newErrors.name = "Name is required"
    if (!formData.parentName.trim()) newErrors.parentName = "Parent name is required"
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email"
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required"
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = "Please enter a valid 10-digit phone number"
    }
    if (!formData.address.trim()) newErrors.address = "Address is required"
    if (!formData.pincode.trim()) {
      newErrors.pincode = "Pincode is required"
    } else if (!validatePincode(formData.pincode)) {
      newErrors.pincode = "Please enter a valid 6-digit pincode"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isFormComplete = (): boolean => {
    const allFieldsFilled = Object.values(formData).every((value) => value.trim() !== "")
    const allImagesUploaded = Object.values(uploadedImages).every((uploaded) => uploaded)
    return allFieldsFilled && allImagesUploaded && isEmailVerified
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    const newValue = field === "email" ? value.toLowerCase() : value
  
    setFormData((prev) => ({ ...prev, [field]: newValue }))
    
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }
  

  const handleImageUploadSuccess = (type: string, backendImageUrl: string) => {
    setUploadedImages((prev) => ({ ...prev, [type]: true }))
    setImageUris((prev) => ({ ...prev, [type]: backendImageUrl })) // Now using backend URL
  }

  const handleSendOtp = async () => {
    if (!formData.email.trim()) {
      setErrors((prev) => ({ ...prev, email: "Email is required" }))
      return
    }
    if (!validateEmail(formData.email)) {
      setErrors((prev) => ({ ...prev, email: "Please enter a valid email" }))
      return
    }

    try {
      await sendOtp(formData.email).unwrap()
      setIsOtpSent(true)
      Alert.alert("Success", "OTP sent to your email")
    } catch (error: any) {
      Alert.alert("Error", error?.data?.error || "Failed to send OTP")
    }
  }

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setErrors((prev) => ({ ...prev, otp: "OTP is required" }))
      return
    }

    try {
      await verifyOtp({ email: formData.email, otp }).unwrap()
      setIsEmailVerified(true)
      Alert.alert("Success", "Email verified successfully")
    } catch (error: any) {
      Alert.alert("Error", error?.data?.error || "Invalid OTP")
    }
  }

  const handleRegister = async () => {
    if (!validateForm() || !isFormComplete()) {
      Alert.alert("Error", "Please fill all fields, upload all images, and verify your email")
      return
    }

    try {
      const registerPayload = {
        ...formData,
        profileImage: imageUris.profile || "",
        dlFront: imageUris.driving_license_front || "",
        dlBack: imageUris.driving_license_back || "",
        aadhaarFront: imageUris.aadhaar_front || "",
        aadhaarBack: imageUris.aadhaar_back || "",
      }

      await registerDeliveryPartner(registerPayload).unwrap()

      // Save email to AsyncStorage
      // const email = encodeURIComponent(formData.email)
      // const encryptedEmail = encryptData(email)
      await AsyncStorage.setItem("delivery_partner_email", formData.email)

      // console.log('encryptwed email',formData.email, email, encryptedEmail)
      setIsRegistered(true)
      setUserStatus("Pending")
      checkExistingRegistration()
      // Alert.alert("Success", "Registration completed successfully!")
    } catch (error: any) {
      Alert.alert("Error", error?.data?.error || "Registration failed")
    }
  }

  const handleStartNewRegistration = () => {
    setIsRegistered(false)
    setUserStatus(null)
    setFormData({
      name: "",
      parentName: "",
      email: "",
      phone: "",
      address: "",
      pincode: "",
    })
    setUploadedImages({
      profile: false,
      driving_license_front: false,
      driving_license_back: false,
      aadhaar_front: false,
      aadhaar_back: false,
    })
    setImageUris({})
    setOtp("")
    setIsOtpSent(false)
    setIsEmailVerified(false)
    AsyncStorage.removeItem("delivery_partner_email")
  }

  const renderInput = (
    field: keyof FormData,
    placeholder: string,
    icon: string,
    keyboardType: any = "default",
    multiline = false,
  ) => (
    <View style={styles.inputContainer}>
      <View style={styles.inputWrapper}>
        <Icon name={icon} size={20} color="#666" style={styles.inputIcon} />
        <TextInput
          style={[styles.input, multiline && styles.multilineInput]}
          placeholder={placeholder}
          placeholderTextColor="#666"
          value={formData[field]}
          onChangeText={(value) => handleInputChange(field, value)}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          editable={field !== "email" || !isEmailVerified}
        />
        {field === "email" && isEmailVerified && (
          <Icon name="verified" size={20} color="#4CAF50" style={styles.verifiedIcon} />
        )}
      </View>
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  )

  if (isRegistered && userStatus) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.statusContainer}>
          <StatusAnimation status={userStatus} />

          <TouchableOpacity style={styles.newRegistrationButton} onPress={handleStartNewRegistration}>
            <Icon name="person-add" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.newRegistrationButtonText}>Start New Registration</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    )
  }
  const handleUploadAllImages = async () => {
    if (!formData.email) return Alert.alert("Error", "Please enter email first")
    if (!isEmailVerified) return Alert.alert("Error", "Please verify your email first")

    try {
      setIsUploadingImages(true)

      const images = Object.entries(selectedImagePaths).map(([type, path]) => ({
        uri: path,
        name: `${type}_${Date.now()}.jpg`,
        type: "image/jpeg",
      }))

      const types = Object.keys(selectedImagePaths)

      const response = await uploadMultipleImages({
        email: formData.email,
        types,
        images,
      }).unwrap()

      const uploadedImageMap: Record<string, string> = {}
      types.forEach((type) => {
        uploadedImageMap[type] = response?.images?.[type]?.url || selectedImagePaths[type]
      })

      setUploadedImages(
        types.reduce((acc, type) => ({ ...acc, [type]: true }), {} as UploadedImages)
      )
      setImageUris(uploadedImageMap)
      Alert.alert("Success", response?.message || "All images uploaded successfully!")
      setUploadedTime(new Date().toISOString())
    } catch (error: any) {
      Alert.alert("Error", error?.data?.error || "Failed to upload images")
    } finally {
      setIsUploadingImages(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Icon name="motorcycle" size={40} color="#fff" />
          <Text style={styles.title}>Delivery Partner Registration</Text>
          <Text style={styles.subtitle}>Join our delivery network</Text>
        </View>

        <View style={styles.form}>
          {renderInput("name", "Full Name", "person")}
          {renderInput("parentName", "Parent's Name", "family-restroom")}

          <View style={styles.emailSection}>
            {renderInput("email", "Email Address", "email", "email-address")}

            {!isEmailVerified && (
              <View style={styles.otpSection}>
                <TouchableOpacity
                  style={[styles.otpButton, (isSendingOtp || isEmailVerified) && styles.disabledButton]}
                  onPress={handleSendOtp}
                  disabled={isSendingOtp || isEmailVerified}
                >
                  {isSendingOtp ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.otpButtonText}>{isOtpSent ? "Resend OTP" : "Send OTP"}</Text>
                  )}
                </TouchableOpacity>

                {isOtpSent && (
                  <View style={styles.otpInputContainer}>
                    <View style={styles.inputWrapper}>
                      <Icon name="security" size={20} color="#666" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter OTP"
                        placeholderTextColor="#666"
                        value={otp}
                        onChangeText={setOtp}
                        keyboardType="numeric"
                        maxLength={6}
                      />
                    </View>
                    {errors.otp && <Text style={styles.errorText}>{errors.otp}</Text>}

                    <TouchableOpacity
                      style={[styles.verifyButton, isVerifyingOtp && styles.disabledButton]}
                      onPress={handleVerifyOtp}
                      disabled={isVerifyingOtp}
                    >
                      {isVerifyingOtp ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.verifyButtonText}>Verify</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {isEmailVerified && (
              <View style={styles.verifiedContainer}>
                <Icon name="check-circle" size={20} color="#4CAF50" />
                <Text style={styles.verifiedText}>Email Verified</Text>
              </View>
            )}
          </View>

          {renderInput("phone", "Phone Number", "phone", "phone-pad")}
          {renderInput("address", "Address", "location-on", "default", true)}
          {renderInput("pincode", "Pincode", "pin-drop", "numeric")}

          <View style={styles.imagesSection}>
            <Text style={styles.sectionTitle}>Upload Documents</Text>

            <ImageUploader
              type="profile"
              label="Profile Photo"
              onImageSelected={handleImageSelected}
              isProfileImage={true}
            />

            <ImageUploader
              type="driving_license_front"
              label="Driving License (Front)"
              onImageSelected={handleImageSelected}
            />

            <ImageUploader
              type="driving_license_back"
              label="Driving License (Back)"
              onImageSelected={handleImageSelected}
            />

            <ImageUploader
              type="aadhaar_front"
              label="Aadhaar Card (Front)"
              onImageSelected={handleImageSelected}
            />

            <ImageUploader
              type="aadhaar_back"
              label="Aadhaar Card (Back)"
              onImageSelected={handleImageSelected}
            />

            <TouchableOpacity
              style={[styles.uploadButton, Object.keys(selectedImagePaths).length < 5 && styles.disabledButton]}
              onPress={handleUploadAllImages}
              disabled={Object.keys(selectedImagePaths).length < 5 || isUploadingImages}
            >
              {isUploadingImages ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Icon name="cloud-upload" size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.registerButtonText}>Upload All Images</Text>
                </>
              )}
            </TouchableOpacity>


          </View>

          <TouchableOpacity
            style={[styles.registerButton, !isFormComplete() && styles.disabledButton]}
            onPress={handleRegister}
            disabled={!isFormComplete() || isRegistering}
          >
            {isRegistering ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name="how-to-reg" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.registerButtonText}>Register</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  statusContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  header: {
    alignItems: "center",
    paddingTop: height * 0.06,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: width * 0.06,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: width * 0.04,
    color: "#ccc",
    marginTop: 5,
    textAlign: "center",
  },
  form: {
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    paddingHorizontal: 15,
    minHeight: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    paddingVertical: 12,
  },
  multilineInput: {
    textAlignVertical: "top",
    paddingTop: 12,
    paddingBottom: 12,
  },
  verifiedIcon: {
    marginLeft: 10,
  },
  errorText: {
    color: "#ff4444",
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  emailSection: {
    marginBottom: 20,
  },
  otpSection: {
    marginTop: 10,
  },
  otpButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  otpButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  otpInputContainer: {
    marginBottom: 10,
  },
  verifyButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  verifyButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  verifiedContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#1b4332",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  verifiedText: {
    color: "#4CAF50",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  imagesSection: {
    marginTop: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  uploadButton: {
    alignSelf: "center",
    backgroundColor: "#2196F3",
    paddingVertical: 15,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    width: '70%'
  },
  registerButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 15,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  buttonIcon: {
    marginRight: 8,
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  newRegistrationButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 15,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
  },
  newRegistrationButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
})

export default Register
