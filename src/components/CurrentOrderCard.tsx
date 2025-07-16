"use client"

import type React from "react"
import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from "react-native"
import { useUpdateOrderStatusMutation } from "../redux/Api/ordersApi"
import Icon from "react-native-vector-icons/Ionicons"
import { useSelector } from "react-redux"
import type { RootState } from "../redux/store"

interface CurrentOrderCardProps {
  order: any
  onComplete: () => void
}

const CurrentOrderCard: React.FC<CurrentOrderCardProps> = ({ order, onComplete }) => {
  const [updateOrderStatus, { isLoading }] = useUpdateOrderStatusMutation()
  const [orderStatus, setOrderStatus] = useState(order.status || "CONFIRMED")

  // Get user email from Redux store
  const userDetails = useSelector((state: RootState) => state.user.userDetails)

  console.log("order", order)

  const handleStatusUpdate = async (status: string) => {
    try {
      // Use the actual user email from Redux store
      const userEmail = userDetails?.email

      if (!userEmail) {
        Alert.alert("Error", "User email not found. Please login again.")
        return
      }

      await updateOrderStatus({
        id: order._id,
        status: "DELIVERED",
        updatedByEmail: userEmail, // Use actual user email instead of hardcoded
      }).unwrap()

      setOrderStatus("DELIVERED")

      if (status === "DELIVERED") {
        Alert.alert("Order Completed!", "Great job! The order has been marked as delivered.", [
          { text: "OK", onPress: onComplete },
        ])
      }
    } catch (error) {
      console.error("Status update failed:", error)
      Alert.alert("Error", "Failed to update order status")
    }
  }

  const handleCall = () => {
    const phoneNumber = order.address?.phone
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`)
    }
  }

  const handleNavigate = () => {
    const address = `${order.address?.street}, ${order.address?.area}`
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    Linking.openURL(url)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "#2196F3"
      case "PICKED_UP":
        return "#FF9800"
      case "DELIVERED":
        return "#4CAF50"
      default:
        return "#888"
    }
  }

  const getNextAction = () => {
    switch (orderStatus) {
      case "CONFIRMED":
        return { text: "DELIVERED", status: "DELIVERED", icon: "checkmark-circle" }
      default:
        return null
    }
  }

  const nextAction = getNextAction()
  const totalAmount = order.products?.reduce((sum: number, product: any) => sum + product.price * product.count, 0) || 0

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Current Order</Text>
          <Text style={[styles.status, { color: getStatusColor(orderStatus) }]}>{orderStatus.replace("_", " ")}</Text>
        </View>
        <Text style={styles.amount}>₹{totalAmount}</Text>
      </View>

      <View style={styles.customerSection}>
        <View style={styles.customerInfo}>
          <Icon name="person" size={20} color="#FFD700" />
          <View style={styles.customerDetails}>
            <Text style={styles.customerName}>{order.address?.name}</Text>
            <Text style={styles.customerPhone}>{order.address?.phone}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.callButton} onPress={handleCall}>
          <Icon name="call" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.addressSection} onPress={handleNavigate}>
        <Icon name="location" size={20} color="#F44336" />
        <View style={styles.addressDetails}>
          <Text style={styles.addressText}>
            {order.address?.street}, {order.address?.area}
          </Text>
          <Text style={styles.addressSubtext}>{order.address?.defaultAddress}</Text>
        </View>
        <Icon name="navigate" size={20} color="#2196F3" />
      </TouchableOpacity>

      <View style={styles.itemsSection}>
        <Text style={styles.itemsTitle}>Items ({order.products?.length || 0})</Text>
        {order.products?.map((product: any, index: number) => (
          <View key={index} style={styles.itemRow}>
            <Text style={styles.itemName}>{product.title}</Text>
            <Text style={styles.itemQuantity}>
              {product.count} × {product.quantityType}
            </Text>
          </View>
        ))}
      </View>

      {nextAction && (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: getStatusColor(nextAction.status) }]}
          onPress={() => handleStatusUpdate(nextAction.status)}
          disabled={isLoading}
        >
          <Icon name={nextAction.icon} size={24} color="#fff" />
          <Text style={styles.actionText}>{nextAction.text}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#111",
    margin: 20,
    borderRadius: 16,
    padding: 20,
    borderColor: "#FFD700",
    borderWidth: 1,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  status: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 2,
  },
  amount: {
    color: "#4CAF50",
    fontSize: 20,
    fontWeight: "bold",
  },
  customerSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  customerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  customerPhone: {
    color: "#888",
    fontSize: 14,
    marginTop: 2,
  },
  callButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 20,
  },
  addressSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
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
  itemsSection: {
    backgroundColor: "#1a1a1a",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  itemsTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  itemName: {
    color: "#fff",
    fontSize: 13,
    flex: 1,
  },
  itemQuantity: {
    color: "#888",
    fontSize: 12,
  },
  moreItems: {
    color: "#888",
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 4,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
})

export default CurrentOrderCard
