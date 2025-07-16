"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Alert } from "react-native"
import { useUpdateOrderStatusMutation } from "../redux/Api/ordersApi"
import Icon from "react-native-vector-icons/Ionicons"
import { pauseAudio, playAudio, setupAudio, stopAudio } from "./AlertController"
import { __DEV__ } from "react-native"

const { width, height } = Dimensions.get("window")
const TIMER_DURATION = 60 // 60 seconds

interface OrderModalProps {
  visible: boolean
  order: any
  onAccept: () => void
  onReject: () => void
  userEmail: string | null
}

const OrderModal: React.FC<OrderModalProps> = ({ visible, order, onAccept, onReject, userEmail }) => {
  const [updateOrderStatus] = useUpdateOrderStatusMutation()
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION)
  const [scaleAnim] = useState(new Animated.Value(0))
  const [pulseAnim] = useState(new Animated.Value(1))
  const [isProcessing, setIsProcessing] = useState(false)

  // Use useRef to store timer reference to prevent multiple timers
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    setupAudio()
  }, [])

  useEffect(() => {
    if (visible && order) {
      playAudio()
      setIsProcessing(false) // Reset processing state when new order appears

      // Clear any existing timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      // Reset timer
      setTimeLeft(TIMER_DURATION)
      startTimeRef.current = Date.now()

      // Start new timer with more accurate timing
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - (startTimeRef.current || 0)) / 1000)
        const remaining = Math.max(0, TIMER_DURATION - elapsed)

        setTimeLeft(remaining)

        if (remaining <= 0) {
          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
          handleAutoReject()
        }
      }, 100) // Update every 100ms for smoother countdown

      // Cleanup function
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
      }
    } else {
      // Modal is not visible, cleanup
      stopAudio()
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      setTimeLeft(TIMER_DURATION)
      startTimeRef.current = null
      setIsProcessing(false)
    }
  }, [visible, order])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      pauseAudio()
    }
  }, [])

  const handleAutoReject = async () => {
    if (isProcessing) return // Prevent multiple auto-rejects

    try {
      setIsProcessing(true)
      if (userEmail && order) {
        console.log("⏰ Auto-rejecting order after 60 seconds for:", userEmail)
        await updateOrderStatus({
          id: order._id,
          status: "CANCELLED",
          updatedByEmail: userEmail,
        }).unwrap()
      }
      onReject()
    } catch (error) {
      console.error("Auto reject failed:", error)
      onReject()
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAccept = async () => {
    // 🚀 CRITICAL: Prevent double clicks and race conditions
    if (isProcessing) {
      console.log("⚠️ Already processing, ignoring click")
      return
    }

    try {
      setIsProcessing(true)

      // Clear timer immediately when accepting
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      if (!userEmail) {
        console.error("No user email available")
        Alert.alert("Error", "User email not found. Please login again.")
        return
      }

      console.log(`🚀 ${userEmail} attempting to accept order ${order._id}`)

      const response = await updateOrderStatus({
        id: order._id,
        status: "CONFIRMED",
        updatedByEmail: userEmail,
      }).unwrap()

      // 🚀 CRITICAL: Check if the acceptance was successful
      if (response.success === false) {
        // Someone else got the order first
        console.log(`❌ ${userEmail} failed to accept - order already taken`)
        Alert.alert("Order Taken", "Sorry! Another delivery partner accepted this order first.", [{ text: "OK" }])
        onReject() // Close modal
        return
      }

      console.log(`✅ ${userEmail} successfully accepted order ${order._id}`)
      Alert.alert("Order Accepted!", "Great! You've successfully accepted this order.", [{ text: "OK" }])
      onAccept()
    } catch (error: any) {
      console.error("Accept order failed:", error)
      // Handle specific error cases
      if (error?.status === 409) {
        Alert.alert("Order Taken", "Sorry! Another delivery partner accepted this order first.", [{ text: "OK" }])
        onReject() // Close modal
      } else {
        Alert.alert("Error", "Failed to accept order. Please try again.")
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    // 🚀 CRITICAL: Prevent double clicks
    if (isProcessing) {
      console.log("⚠️ Already processing, ignoring click")
      return
    }

    try {
      setIsProcessing(true)

      // Clear timer immediately when rejecting
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      if (!userEmail) {
        console.error("No user email available")
        return
      }

      await updateOrderStatus({
        id: order._id,
        status: "CANCELLED",
        updatedByEmail: userEmail,
      }).unwrap()

      console.log("❌ Order rejected by:", userEmail)
      onReject()
    } catch (error) {
      console.error("Reject order failed:", error)
      onReject()
    } finally {
      setIsProcessing(false)
    }
  }

  if (!order) return null

  const totalAmount = order.products?.reduce((sum: number, product: any) => sum + product.price * product.count, 0) || 30
  const progressPercentage = (timeLeft / TIMER_DURATION) * 100

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.newOrderBadge}>
              <Icon name="notifications" size={20} color="#000" />
              <Text style={styles.newOrderText}>NEW ORDER</Text>
            </View>
            <View style={styles.timerContainer}>
              <Text style={[styles.timerText, { color: timeLeft <= 10 ? "#FF4444" : "#F44336" }]}>{timeLeft}s</Text>
              <View style={styles.timerBar}>
                <Animated.View
                  style={[
                    styles.timerProgress,
                    {
                      width: `${progressPercentage}%`,
                      backgroundColor: timeLeft <= 10 ? "#FF4444" : "#F44336",
                    },
                  ]}
                />
              </View>
            </View>
          </View>

          {/* Order Details */}
          <View style={styles.content}>
            <View style={styles.customerInfo}>
              <Icon name="person" size={24} color="#FFD700" />
              <View style={styles.customerDetails}>
                <Text style={styles.customerName}>{order.address?.name || "Customer"}</Text>
                <Text style={styles.customerPhone}>{order.address?.phone}</Text>
              </View>
              <View style={styles.amountContainer}>
                <Text style={styles.amountLabel}>Total</Text>
                <Text style={styles.amount}>₹{totalAmount}</Text>
              </View>
            </View>

            <View style={styles.addressContainer}>
              <Icon name="location" size={20} color="#F44336" />
              <View style={styles.addressDetails}>
                <Text style={styles.addressText}>
                  {order.address?.street}, {order.address?.area}
                </Text>
                <Text style={styles.addressSubtext}>{order.address?.defaultAddress}</Text>
              </View>
            </View>

            {/* Products */}
            <View style={styles.productsContainer}>
              <Text style={styles.productsTitle}>Items ({order.products?.length || 0})</Text>
              {order.products?.map((product: any, index: number) => (
                <View key={index} style={styles.productItem}>
                  <Text style={styles.productName}>{product.title}</Text>
                  <Text style={styles.productQuantity}>
                    {product.count} × {product.quantityType}
                  </Text>
                </View>
              ))}
              {/* {order.products?.length > 3 && (
                <Text style={styles.moreItems}>+{order.products.length - 3} more items</Text>
              )} */}
            </View>

            {/* Debug info - remove in production */}
            {__DEV__ && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugText}>Partner: {userEmail}</Text>
                <Text style={styles.debugText}>Timer: {timeLeft}s remaining</Text>
                <Text style={styles.debugText}>Processing: {isProcessing ? "YES" : "NO"}</Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.rejectButton, isProcessing && styles.disabledButton]}
              onPress={handleReject}
              activeOpacity={0.8}
              disabled={!userEmail || isProcessing}
            >
              <Icon name="close" size={24} color="#fff" />
              <Text style={styles.rejectText}>REJECT</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.acceptButton, (!userEmail || isProcessing) && styles.disabledButton]}
              onPress={handleAccept}
              activeOpacity={0.8}
              disabled={!userEmail || isProcessing}
            >
              <Icon name="checkmark" size={24} color="#000" />
              <Text style={styles.acceptText}>{isProcessing ? "ACCEPTING..." : "ACCEPT"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    backgroundColor: "#111",
    borderRadius: 20,
    width: width - 40,
    maxHeight: height - 100,
    borderColor: "#FFD700",
    borderWidth: 2,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomColor: "#333",
    borderBottomWidth: 1,
  },
  newOrderBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFD700",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  newOrderText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "bold",
  },
  timerContainer: {
    alignItems: "center",
    gap: 4,
  },
  timerText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  timerBar: {
    width: 60,
    height: 4,
    backgroundColor: "#333",
    borderRadius: 2,
    overflow: "hidden",
  },
  timerProgress: {
    height: "100%",
  },
  content: {
    padding: 20,
    gap: 16,
  },
  customerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  customerPhone: {
    color: "#888",
    fontSize: 14,
    marginTop: 2,
  },
  amountContainer: {
    alignItems: "flex-end",
  },
  amountLabel: {
    color: "#888",
    fontSize: 12,
  },
  amount: {
    color: "#4CAF50",
    fontSize: 20,
    fontWeight: "bold",
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#1a1a1a",
    padding: 12,
    borderRadius: 8,
  },
  addressDetails: {
    flex: 1,
  },
  addressText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  addressSubtext: {
    color: "#888",
    fontSize: 12,
    marginTop: 2,
  },
  productsContainer: {
    backgroundColor: "#1a1a1a",
    padding: 12,
    borderRadius: 8,
  },
  productsTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
  },
  productItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  productName: {
    color: "#fff",
    fontSize: 13,
    flex: 1,
  },
  productQuantity: {
    color: "#888",
    fontSize: 12,
  },
  moreItems: {
    color: "#888",
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 4,
  },
  debugContainer: {
    backgroundColor: "#333",
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  debugText: {
    color: "#FFD700",
    fontSize: 10,
    fontFamily: "monospace",
  },
  actions: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: "#F44336",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  rejectText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  acceptButton: {
    flex: 1,
    backgroundColor: "#FFD700",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  acceptText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#666",
    opacity: 0.5,
  },
})

export default OrderModal
