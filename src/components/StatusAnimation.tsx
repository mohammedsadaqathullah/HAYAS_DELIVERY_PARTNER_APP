"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import { View, Text, Animated, StyleSheet, Dimensions } from "react-native"
import Icon from "react-native-vector-icons/MaterialIcons"
import { useNavigation } from "@react-navigation/native"

const { width } = Dimensions.get("window")

interface StatusAnimationProps {
  status: "Pending" | "Approved" | "Rejected"
}

const StatusAnimation: React.FC<StatusAnimationProps> = ({ status }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current
  const rotateAnim = useRef(new Animated.Value(0)).current
  const pulseAnim = useRef(new Animated.Value(1)).current

  const navigation = useNavigation()

  useEffect(() => {
    // Initial scale animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 3,
      useNativeDriver: true,
    }).start()

    if (status === "Approved") {
      // Navigate to login after showing success animation
      const timer = setTimeout(() => {
        navigation.navigate("Login" as never) // Replace 'Login' with your actual login screen name
      }, 3000) // 3 second delay to show the success animation

      return () => clearTimeout(timer)
    }

    if (status === "Pending") {
      // Continuous rotation for pending
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      )
      rotateAnimation.start()

      // Pulse animation for pending
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      )
      pulseAnimation.start()

      return () => {
        rotateAnimation.stop()
        pulseAnimation.stop()
      }
    }
  }, [status, scaleAnim, rotateAnim, pulseAnim, navigation])

  const getStatusConfig = () => {
    switch (status) {
      case "Pending":
        return {
          icon: "hourglass-empty",
          color: "#FF9800",
          backgroundColor: "#FFF3E0",
          borderColor: "#FFB74D",
          title: "Application Pending",
          message: "Your application is under review. We will notify you once it's processed.",
        }
      case "Approved":
        return {
          icon: "check-circle",
          color: "#4CAF50",
          backgroundColor: "#E8F5E8",
          borderColor: "#81C784",
          title: "Application Approved",
          message: "Congratulations! Your application has been approved. Redirecting to login...",
        }
      case "Rejected":
        return {
          icon: "cancel",
          color: "#F44336",
          backgroundColor: "#FFEBEE",
          borderColor: "#E57373",
          title: "Application Rejected",
          message: "Unfortunately, your application was not approved. Please contact support for more information.",
        }
      default:
        return {
          icon: "help",
          color: "#666",
          backgroundColor: "#f5f5f5",
          borderColor: "#ccc",
          title: "Unknown Status",
          message: "Please contact support.",
        }
    }
  }

  const config = getStatusConfig()
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  })

  return (
    <View style={[styles.container, { backgroundColor: config.backgroundColor, borderColor: config.borderColor }]}>
      <Animated.View
        style={[
          styles.iconContainer,
          {
            transform: [
              { scale: scaleAnim },
              ...(status === "Pending" ? [{ rotate: spin }, { scale: pulseAnim }] : []),
            ],
          },
        ]}
      >
        <Icon name={config.icon} size={60} color={config.color} />
      </Animated.View>

      <Text style={[styles.title, { color: config.color }]}>{config.title}</Text>
      <Text style={styles.message}>{config.message}</Text>

      {status === "Pending" && (
        <View style={styles.loadingDots}>
          <Animated.View style={[styles.dot, { backgroundColor: config.color }]} />
          <Animated.View style={[styles.dot, { backgroundColor: config.color }]} />
          <Animated.View style={[styles.dot, { backgroundColor: config.color }]} />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 30,
    margin: 20,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 20,
  },
  loadingDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
})

export default StatusAnimation
