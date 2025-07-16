"use client"

import { useEffect, useState, useCallback } from "react"
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, Alert } from "react-native"
import { useGetAllOrdersQuery, useUpdateOrderStatusMutation } from "../redux/Api/ordersApi"
import { useSocket } from "../utils/useSocket"

const ReceiveOrders = () => {
  const { data: orders, isLoading, isError, refetch } = useGetAllOrdersQuery()
  const [updateOrderStatus] = useUpdateOrderStatusMutation()
  const [newOrders, setNewOrders] = useState([])

  const { socket, isConnected, userEmail, onEvent, offEvent } = useSocket()

  // Helper function to get assigned email from statusHistory
  const getAssignedEmail = (order) => {
    if (!order.statusHistory || order.statusHistory.length === 0) return null

    // Find the most recent CONFIRMED status in statusHistory
    const confirmedEntry = order.statusHistory
      .filter((entry) => entry.status === "CONFIRMED")
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0]

    return confirmedEntry ? confirmedEntry.email : null
  }

  // Helper function to check if user has confirmed this order
  const hasUserConfirmed = (order, userEmail) => {
    if (!order.statusHistory || !userEmail) return false

    return order.statusHistory.some((entry) => entry.email === userEmail && entry.status === "CONFIRMED")
  }

  // Helper function to check if user has cancelled this order
  const hasUserCancelled = (order, userEmail) => {
    if (!order.statusHistory || !userEmail) return false

    return order.statusHistory.some((entry) => entry.email === userEmail && entry.status === "CANCELLED")
  }

  // Helper function to check if user has delivered this order
  const hasUserDelivered = (order, userEmail) => {
    if (!order.statusHistory || !userEmail) return false

    return order.statusHistory.some((entry) => entry.email === userEmail && entry.status === "DELIVERED")
  }

  // Handle new order notifications
  const handleNewOrder = useCallback(({ order, message }) => {
    console.log("🆕 New order received:", order)
    console.log("📢 Message:", message)

    setNewOrders((prev) => {
      const exists = prev.find((o) => o._id === order._id)
      if (exists) {
        console.log("⚠️ Order already exists in newOrders")
        return prev
      }
      return [order, ...prev]
    })

    // Show alert for new order
    Alert.alert("New Order!", `New order received from ${order.userEmail}`, [{ text: "OK" }])
  }, [])

  // Handle order status updates
  const handleStatusUpdate = useCallback(
    ({ order, message }) => {
      console.log("🔄 Order status updated:", order)
      console.log("📢 Message:", message)

      // Remove from newOrders if it was there
      setNewOrders((prev) => prev.filter((o) => o._id !== order._id))

      // Refetch all orders to get updated data
      refetch()
    },
    [refetch],
  )

  // Set up socket event listeners
  useEffect(() => {
    if (!socket || !isConnected) {
      console.log("⏳ Waiting for socket connection...")
      return
    }

    console.log("🎧 Setting up socket event listeners")

    onEvent("new-order", handleNewOrder)
    onEvent("order-status-updated", handleStatusUpdate)

    return () => {
      console.log("🧹 Cleaning up socket event listeners")
      offEvent("new-order", handleNewOrder)
      offEvent("order-status-updated", handleStatusUpdate)
    }
  }, [socket, isConnected, handleNewOrder, handleStatusUpdate, onEvent, offEvent])

  const handleStatusUpdateAction = async (id, status) => {
    if (!userEmail) {
      Alert.alert("Error", "User email not found")
      return
    }

    try {
      console.log(`🔄 Updating order ${id} to ${status} by ${userEmail}`)

      const result = await updateOrderStatus({
        id,
        status,
        updatedByEmail: userEmail,
      }).unwrap()

      console.log("✅ Order status updated successfully:", result)

      // Remove from newOrders immediately for better UX
      setNewOrders((prev) => prev.filter((o) => o._id !== id))

      // Show success message
      let actionText = ""
      switch (status) {
        case "CONFIRMED":
          actionText = "accepted"
          break
        case "CANCELLED":
          actionText = "rejected"
          break
        case "DELIVERED":
          actionText = "marked as delivered"
          break
        default:
          actionText = "updated"
      }

      Alert.alert("Success", `Order ${actionText} successfully`)
    } catch (err) {
      console.error("❌ Status update failed:", err)

      // More detailed error handling
      let errorMessage = "Failed to update order status"

      if (err.status === 404) {
        errorMessage = "Order not found"
      } else if (err.status === 400) {
        errorMessage = err.data?.message || "Invalid request"
      } else if (err.status === 403) {
        errorMessage = err.data?.message || "Action not allowed"
      } else if (err.status === 409) {
        errorMessage = err.data?.message || "Order already accepted by another captain"
      } else if (err.status === 500) {
        errorMessage = "Server error. Please try again."
      } else if (err.data?.message) {
        errorMessage = err.data.message
      }

      Alert.alert("Error", errorMessage)
    }
  }

  const renderOrderItem = ({ item }) => {
    const assignedEmail = getAssignedEmail(item)
    const userHasConfirmed = hasUserConfirmed(item, userEmail)
    const userHasCancelled = hasUserCancelled(item, userEmail)
    const userHasDelivered = hasUserDelivered(item, userEmail)

    // Determine which buttons to show
    const canAcceptOrReject =
      item.status === "PENDING" &&
      (!assignedEmail || assignedEmail === userEmail) &&
      (!item.rejectedByEmails || !item.rejectedByEmails.includes(userEmail)) &&
      !userHasCancelled // Hide buttons if user has cancelled

    const canMarkDelivered = item.status === "CONFIRMED" && assignedEmail === userEmail && !userHasDelivered

    // Get status color
    const getStatusColor = (status) => {
      switch (status) {
        case "PENDING":
          return "#FF9800"
        case "CONFIRMED":
          return "#2196F3"
        case "DELIVERED":
          return "#4CAF50"
        case "CANCELLED":
          return "#F44336"
        default:
          return "#fff"
      }
    }

    return (
      <View style={styles.card}>
        <Text style={styles.title}>Order ID: {item._id}</Text>
        <Text style={[styles.text, { color: getStatusColor(item.status) }]}>Status: {item.status}</Text>
        <Text style={styles.text}>User: {item.userEmail}</Text>
        <Text style={styles.text}>
          Address: {item.address?.street}, {item.address?.area}
        </Text>

        {/* Show assignment info from statusHistory */}
        {assignedEmail && (
          <Text style={styles.assignedText}>Assigned to: {assignedEmail === userEmail ? "You" : assignedEmail}</Text>
        )}

        {/* Show rejection info */}
        {item.rejectedByEmails && item.rejectedByEmails.length > 0 && (
          <Text style={styles.rejectedText}>Rejected by: {item.rejectedByEmails.length} captain(s)</Text>
        )}

        {/* Show status history */}
        {item.statusHistory && item.statusHistory.length > 0 && (
          <View style={styles.historyContainer}>
            <Text style={styles.historyTitle}>Recent Activity:</Text>
            {item.statusHistory
              .slice(-3) // Show last 3 activities
              .reverse()
              .map((entry, index) => (
                <Text key={index} style={styles.historyText}>
                  • {entry.status} by {entry.email === userEmail ? "You" : entry.email}
                </Text>
              ))}
          </View>
        )}

        {item.products && (
          <View style={styles.productsContainer}>
            <Text style={styles.productsTitle}>Products:</Text>
            {item.products.map((product, index) => (
              <Text key={index} style={styles.productText}>
                • {product.title} - {product.count} {product.quantityType}
              </Text>
            ))}
          </View>
        )}

        {/* Accept/Reject buttons for pending orders */}
        {canAcceptOrReject && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.acceptButton]}
              onPress={() => handleStatusUpdateAction(item._id, "CONFIRMED")}
            >
              <Text style={styles.buttonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.rejectButton]}
              onPress={() => handleStatusUpdateAction(item._id, "CANCELLED")}
            >
              <Text style={styles.buttonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Delivery completed button for confirmed orders */}
        {canMarkDelivered && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.deliveredButton]}
              onPress={() => handleStatusUpdateAction(item._id, "DELIVERED")}
            >
              <Text style={styles.buttonText}>Mark as Delivered</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Show message if user has cancelled */}
        {userHasCancelled && (
          <View style={styles.cancelledContainer}>
            <Text style={styles.cancelledText}>You have rejected this order</Text>
          </View>
        )}

        {/* Show message if user has delivered */}
        {userHasDelivered && (
          <View style={styles.deliveredContainer}>
            <Text style={styles.deliveredText}>✅ You have completed this delivery</Text>
          </View>
        )}
      </View>
    )
  }

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    )
  }

  if (isError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load orders</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // Combine and deduplicate orders
  const combined = [...(orders || []), ...newOrders]
  const uniqueOrders = combined.reduce((acc, curr) => {
    if (!acc.some((o) => o._id === curr._id)) {
      acc.push(curr)
    }
    return acc
  }, [])

  return (
    <View style={styles.container}>
      {/* Connection Status */}
      <View style={[styles.statusBar, { backgroundColor: isConnected ? "#4CAF50" : "#F44336" }]}>
        <Text style={styles.statusText}>{isConnected ? "🟢 Connected" : "🔴 Disconnected"}</Text>
        {userEmail && <Text style={styles.emailText}>Logged in as: {userEmail}</Text>}
      </View>

      <FlatList
        data={uniqueOrders}
        keyExtractor={(item) => item._id}
        onRefresh={refetch}
        refreshing={isLoading}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  statusBar: {
    padding: 8,
    alignItems: "center",
  },
  statusText: {
    color: "#fff",
    fontWeight: "bold",
  },
  emailText: {
    color: "#fff",
    fontSize: 12,
    opacity: 0.8,
  },
  listContainer: {
    padding: 12,
  },
  card: {
    backgroundColor: "#1c1c1e",
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  title: {
    fontWeight: "bold",
    color: "#fff",
    fontSize: 16,
    marginBottom: 8,
  },
  text: {
    color: "#fff",
    marginBottom: 4,
  },
  assignedText: {
    color: "#4CAF50",
    marginBottom: 4,
    fontWeight: "bold",
  },
  rejectedText: {
    color: "#FF9800",
    marginBottom: 4,
    fontSize: 12,
  },
  historyContainer: {
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: "#2c2c2e",
    padding: 8,
    borderRadius: 6,
  },
  historyTitle: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
    marginBottom: 4,
  },
  historyText: {
    color: "#ccc",
    fontSize: 11,
    marginLeft: 4,
  },
  productsContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  productsTitle: {
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 4,
  },
  productText: {
    color: "#ccc",
    fontSize: 12,
    marginLeft: 8,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  acceptButton: {
    backgroundColor: "#4CAF50",
  },
  rejectButton: {
    backgroundColor: "#F44336",
  },
  deliveredButton: {
    backgroundColor: "#2196F3",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  cancelledContainer: {
    marginTop: 12,
    padding: 8,
    backgroundColor: "#F44336",
    borderRadius: 6,
    alignItems: "center",
  },
  cancelledText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  deliveredContainer: {
    marginTop: 12,
    padding: 8,
    backgroundColor: "#4CAF50",
    borderRadius: 6,
    alignItems: "center",
  },
  deliveredText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  loadingText: {
    color: "#fff",
    marginTop: 10,
  },
  errorText: {
    color: "#F44336",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#2196F3",
    padding: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
})

export default ReceiveOrders
