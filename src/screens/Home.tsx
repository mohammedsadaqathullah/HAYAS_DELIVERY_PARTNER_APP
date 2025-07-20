"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  BackHandler,
  SafeAreaView,
} from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useUpdateDutyStatusMutation } from "../redux/Api/DeliveryPartnerDutyStatusApi"
import { useSocket } from "../utils/useSocket"
import CurrentOrderCard from "../components/CurrentOrderCard"
import StatsCard from "../components/StatsCard"
import OrderModal from "../components/OrderModal"
import Icon from "react-native-vector-icons/Ionicons"
import { useGetActiveOrdersQuery, useGetPendingLiveOrdersQuery } from "../redux/Api/ordersApi"
import { useSelector } from "react-redux"
import type { RootState } from "../redux/store"
import { DrawerActions } from "@react-navigation/native"
import { Image } from "react-native"
import { useGetDeliveryPartnerSummaryQuery } from "../redux/Api/deliveryPartnerStatsApi"
import { useGetAvailableEarningsQuery } from "../redux/Api/withdrawalApi"
import baseurl from "../redux/baseurl"

const Home = ({ navigation }: any) => {
  const [currentOrder, setCurrentOrder] = useState(null)
  const [incomingOrder, setIncomingOrder] = useState(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [dutyStatus, setDutyStatus] = useState(false)
  const [updateDutyStatus, { isLoading }] = useUpdateDutyStatusMutation()
  const userDetails = useSelector((state: RootState) => state.user.userDetails)

  const { data: activeDatas, refetch } = useGetActiveOrdersQuery(userDetails?.email)
  const [fetchPending, setFetchPending] = useState(false);
  const { data: pendingOrders, error: pendingError, isLoading: isPendingLoading, refetch: refetchPending } = useGetPendingLiveOrdersQuery(undefined, { skip: !fetchPending });

  // Fetch pending orders only when duty is ON (on mount or toggle)
  useEffect(() => {
    if (dutyStatus) {
      setFetchPending(true);
    } else {
      setFetchPending(false);
    }
  }, [dutyStatus]);

  useEffect(() => {
    if (
      fetchPending &&
      dutyStatus &&
      pendingOrders &&
      pendingOrders.length > 0 &&
      !currentOrder &&
      !showOrderModal
    ) {
      const order = pendingOrders[0];
      setIncomingOrder(order);
      setShowOrderModal(true);
      setFetchPending(false); // Only show once after fetch
    }
  }, [pendingOrders, fetchPending, dutyStatus, currentOrder, showOrderModal]);

  // Get today's stats
  const { data: todayStats,refetch : summaryRefetch } = useGetDeliveryPartnerSummaryQuery(
    { email: userDetails?.email, period: "week" },
    { skip: !userDetails?.email },

  )

  // Get available earnings
  const { data: earningsData } = useGetAvailableEarningsQuery(userDetails?.email, { skip: !userDetails?.email })

  const { socket, isConnected, userEmail } = useSocket()

  useEffect(() => {
    loadDutyStatus()
    getActiveData()
    const backHandler = BackHandler.addEventListener("hardwareBackPress", handleBackPress)
    return () => backHandler.remove()
  }, [])

  // Socket event handlers (keeping your existing logic)
  useEffect(() => {
    if (socket && isConnected) {
      const handleNewOrder = (payload: any) => {
        console.log("📦 New order received:", payload)
        if (dutyStatus && !currentOrder && !showOrderModal) {
          const order = payload.order
          console.log("🔔 Showing order modal for partner:", userEmail)
          setIncomingOrder(order)
          setShowOrderModal(true)
        } else {
          console.log(
            "⚠️ Order not shown - dutyStatus:",
            dutyStatus,
            "currentOrder:",
            !!currentOrder,
            "modalOpen:",
            showOrderModal,
          )
        }
      }

      const handleOrderAssigned = (payload: any) => {
        console.log("🎯 Order assigned to another partner:", payload)
        setIncomingOrder((currentIncomingOrder) => {
          if (currentIncomingOrder && currentIncomingOrder._id === payload.orderId) {
            console.log("❌ Hiding order modal - order assigned to:", payload.assignedTo)
            setShowOrderModal(false)
            setTimeout(() => {
              Alert.alert("Order Assigned", "This order has been assigned to another delivery partner.", [
                { text: "OK" },
              ])
            }, 100)
            return null
          }
          return currentIncomingOrder
        })
      }

      const handleOrderAvailableAgain = (payload: any) => {
        console.log("🔄 Order available again:", payload)
        if (dutyStatus && !currentOrder && !showOrderModal) {
          console.log("🔔 Showing available order again for partner:", userEmail)
          setIncomingOrder(payload.order)
          setShowOrderModal(true)
        }
      }

      const handleOrderCancelled = (orderId: string) => {
        if (currentOrder?._id === orderId) {
          setCurrentOrder(null)
          Alert.alert("Order Cancelled", "The current order has been cancelled by the customer.")
        }
      }

      socket.on("new-order", handleNewOrder)
      socket.on("order-assigned", handleOrderAssigned)
      socket.on("order-available-again", handleOrderAvailableAgain)
      socket.on("order-cancelled", handleOrderCancelled)

      return () => {
        socket.off("new-order", handleNewOrder)
        socket.off("order-assigned", handleOrderAssigned)
        socket.off("order-available-again", handleOrderAvailableAgain)
        socket.off("order-cancelled", handleOrderCancelled)
      }
    }
  }, [socket, isConnected, dutyStatus, currentOrder, showOrderModal, userEmail])

  // Heartbeat: Send every 12 minutes when ON duty
  useEffect(() => {
    const sendHeartbeat = async () => {
      try {
        const email = userEmail || userDetails?.email;
        if (!email) return;
        await fetch(`${baseurl}/duty-status/heartbeat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
      } catch (err) {
        console.error('Heartbeat error:', err);
      }
    };

    let interval: NodeJS.Timeout | null = null;
    if (dutyStatus) {
      sendHeartbeat(); // Send immediately
      interval = setInterval(sendHeartbeat, 12 * 60 * 1000); // Every 12 minutes
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [dutyStatus, userEmail, userDetails?.email]);

  const loadDutyStatus = async () => {
    try {
      const savedStatus = await AsyncStorage.getItem("dutyStatus")
      if (savedStatus !== null) {
        setDutyStatus(JSON.parse(savedStatus))
      }
    } catch (error) {
      console.error("Error loading duty status:", error)
    }
  }

  const saveDutyStatus = async (status: boolean) => {
    try {
      await AsyncStorage.setItem("dutyStatus", JSON.stringify(status))
      setDutyStatus(status)
    } catch (error) {
      console.error("Error saving duty status:", error)
    }
  }

  const getActiveData = async () => {
    try {
      const result = await refetch()
      console.log("activedatas", result)
      if (result.data && result.data.length > 0) {
        setCurrentOrder(result.data[0])
      } else {
        setCurrentOrder(null)
      }
    } catch (error) {
      console.error("Failed to fetch active orders:", error)
    }
  }

  const handleAcceptOrder = async () => {
    await getActiveData()
    setIncomingOrder(null)
    setShowOrderModal(false)
  }

  const handleRejectOrder = () => {
    setIncomingOrder(null)
    setShowOrderModal(false)
  }

  const handleOrderComplete = () => {
    summaryRefetch()
    setCurrentOrder(null)
  }

  const handleBackPress = () => {
    if (showOrderModal) {
      return true
    }
    return false
  }

  const toggleDuty = async () => {
    if (currentOrder && dutyStatus) {
      Alert.alert("Active Order", "You have an active order. Please complete it before going off duty.", [
        { text: "OK" },
      ])
      return
    }

    try {
      const email = userEmail || userDetails?.email
      if (!email) {
        Alert.alert("Error", "User email not found. Please login again.")
        return
      }

      const duty = !dutyStatus
      const result = await updateDutyStatus({ email, duty }).unwrap()
      saveDutyStatus(duty)
      Alert.alert("Duty Status Updated", `You are now ${duty ? "ON" : "OFF"} duty`, [{ text: "OK" }])
    } catch (err: any) {
      console.error("Error updating duty status:", err)
      Alert.alert("Error", err?.data?.message || "Failed to update duty status")
    }
  }

  const handleDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer())
  }

  // Calculate today's stats from the weekly summary
  const todayCompletedOrders = todayStats?.summary?.totalCompletedOrders || 0
  const todayEarnings = todayStats?.summary?.totalEarnings || 0
  const availableBalance = earningsData?.availableEarnings || 0

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Connection Status */}
        <View style={[styles.statusBar, { backgroundColor: isConnected ? "#4CAF50" : "#F44336" }]}>
          <Icon name={isConnected ? "wifi" : "wifi-outline"} size={16} color="#fff" />
          <Text style={styles.statusText}>{isConnected ? `Connected (${userEmail})` : "Disconnected"}</Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={1} style={{ flexDirection: "row", gap: 5 }}>
            <TouchableOpacity onPress={handleDrawer}>
              <Image source={{ uri: userDetails?.profileImage }} style={styles.profileImage} />
            </TouchableOpacity>
            <View>
              <Text style={styles.greeting}>Welcome Back!</Text>
              <Text style={styles.name}>{userDetails?.name || "Partner"}</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.dutyContainer}>
            <Text style={[styles.dutyLabel, { color: dutyStatus ? "#4CAF50" : "#F44336" }]}>
              {dutyStatus ? "ON DUTY" : "OFF DUTY"}
            </Text>
            <View style={styles.switchContainer}>
              {isLoading && <ActivityIndicator size="small" color="#FFD700" />}
              <Switch
                value={dutyStatus}
                onValueChange={toggleDuty}
                trackColor={{ false: "#333", true: "#FFD700" }}
                thumbColor={dutyStatus ? "#000" : "#666"}
                disabled={isLoading}
              />
            </View>
          </View>
        </View>

        {/* Current Order */}
        {currentOrder ? (
          <CurrentOrderCard order={currentOrder} onComplete={handleOrderComplete} />
        ) : (
          <View style={styles.noOrderCard}>
            <Icon name="bicycle" size={48} color="#666" />
            <Text style={styles.noOrderTitle}>{dutyStatus ? "Waiting for Orders..." : "You are Off Duty"}</Text>
            <Text style={styles.noOrderSubtitle}>
              {dutyStatus ? "New orders will appear here when available" : "Turn on duty to start receiving orders"}
            </Text>
          </View>
        )}

        {/* Stats - Updated with real data */}
        <View style={styles.statsContainer}>
          <StatsCard title="Today's Orders" value={todayCompletedOrders.toString()} icon="list" />
          <StatsCard title="Available Balance" value={`₹${availableBalance}`} icon="wallet" />
        </View>

        <View style={styles.statsContainer}>
          <StatsCard title="Today's Earnings" value={`₹${todayEarnings}`} icon="trending-up" />
          <StatsCard title="Completed" value={todayCompletedOrders.toString()} icon="checkmark-circle" />
        </View>

        {/* Pending Orders Section */}
        {/* {dutyStatus && pendingOrders && pendingOrders.length > 0 && (
          <View style={{ padding: 20 }}>
            <Text style={styles.sectionTitle}>Pending Orders</Text>
            {pendingOrders.map((order: any) => (
              <View key={order._id} style={{ backgroundColor: '#1c1c1e', padding: 16, borderRadius: 10, marginBottom: 12 }}>
                <Text style={{ color: '#FFD700', fontWeight: 'bold' }}>Order ID: {order._id}</Text>
                <Text style={{ color: '#fff' }}>User: {order.userEmail}</Text>
                <Text style={{ color: '#fff' }}>Address: {order.address?.street}, {order.address?.area}</Text>
                <Text style={{ color: '#FF9800' }}>Status: {order.status}</Text>
              </View>
            ))}
          </View>
        )} */}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("OrderHistory")}>
            <Icon name="time" size={24} color="#FFD700" />
            <Text style={styles.actionText}>Order History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("Earnings")}>
            <Icon name="wallet" size={24} color="#FFD700" />
            <Text style={styles.actionText}>Earnings Report</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("Withdrawal")}>
            <Icon name="card" size={24} color="#FFD700" />
            <Text style={styles.actionText}>Withdraw Money</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="headset" size={24} color="#FFD700" />
            <Text style={styles.actionText}>Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <OrderModal
        visible={showOrderModal}
        order={incomingOrder}
        onAccept={handleAcceptOrder}
        onReject={handleRejectOrder}
        userEmail={userDetails?.email}
      />
    </SafeAreaView>
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
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    gap: 8,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 10,
  },
  greeting: {
    color: "#888",
    fontSize: 14,
  },
  name: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 0,
  },
  dutyContainer: {
    alignItems: "flex-end",
  },
  dutyLabel: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  noOrderCard: {
    backgroundColor: "#111",
    margin: 20,
    padding: 40,
    borderRadius: 16,
    alignItems: "center",
    borderColor: "#333",
    borderWidth: 1,
  },
  noOrderTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    textAlign: "center",
  },
  noOrderSubtitle: {
    color: "#888",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 12,
  },
  quickActions: {
    padding: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderColor: "#333",
    borderWidth: 1,
  },
  actionText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 16,
    fontWeight: "500",
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 0,
    borderColor: "#FFD700",
    borderWidth: 2,
  },
})

export default Home
