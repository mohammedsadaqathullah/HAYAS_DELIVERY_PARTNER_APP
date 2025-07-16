"use client"

import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native"
import Icon from "react-native-vector-icons/Ionicons"
import { useSelector } from "react-redux"
import type { RootState } from "../redux/store"
import { formatDate, getCurrentOrderStatus, getStatusColor } from "../components/orderHelpers"

const OrderDetailsScreen = ({ navigation, route }: any) => {
  const { order } = route.params
  const userDetails = useSelector((state: RootState) => state.user.userDetails)

  const currentStatus = getCurrentOrderStatus(order)
  const totalAmount =
    order.products?.reduce((sum: number, product: any) => sum + (product.price || 0) * product.count, 0) || 0

  // Calculate earnings (₹30 for delivered orders, -₹30 for cancelled orders)
  const earnings = currentStatus === "DELIVERED" ? 30 : currentStatus === "CANCELLED" ? -30 : 0

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Order Status Card */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Text style={styles.orderId}>#{order._id.slice(-6)}</Text>
          <Text style={[styles.status, { color: getStatusColor(currentStatus) }]}>{currentStatus}</Text>
        </View>
        <Text style={styles.orderDate}>Placed on {formatDate(order.createdAt)}</Text>
        {earnings !== 0 && (
          <View style={styles.earningsContainer}>
            <Icon name="wallet" size={16} color={earnings > 0 ? "#4CAF50" : "#F44336"} />
            <Text style={[styles.earningsText, { color: earnings > 0 ? "#4CAF50" : "#F44336" }]}>
              {earnings > 0 ? "Earned" : "Lost"}: ₹{Math.abs(earnings)}
            </Text>
          </View>
        )}
      </View>

      {/* Customer Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Information</Text>
        <View style={styles.customerCard}>
          <View style={styles.customerRow}>
            <Icon name="person" size={20} color="#FFD700" />
            <Text style={styles.customerName}>{order.address?.name}</Text>
          </View>
          <View style={styles.customerRow}>
            <Icon name="call" size={20} color="#4CAF50" />
            <Text style={styles.customerPhone}>{order.address?.phone}</Text>
          </View>
        </View>
      </View>

      {/* Delivery Address */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Address</Text>
        <View style={styles.addressCard}>
          <Icon name="location" size={20} color="#F44336" />
          <View style={styles.addressDetails}>
            <Text style={styles.addressText}>
              {order.address?.street}, {order.address?.area}
            </Text>
            <Text style={styles.addressSubtext}>{order.address?.defaultAddress}</Text>
          </View>
        </View>
      </View>

      {/* Order Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Items ({order.products?.length || 0})</Text>
        <View style={styles.itemsCard}>
          {order.products?.map((product: any, index: number) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{product.title}</Text>
                <Text style={styles.itemQuantity}>
                  {product.count} × {product.quantityType}
                </Text>
              </View>
              {product.price && <Text style={styles.itemPrice}>₹{(product.price * product.count).toFixed(2)}</Text>}
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>₹{totalAmount.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Order Timeline */}
      {order.statusHistory && order.statusHistory.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Activity Timeline</Text>
          <View style={styles.timelineCard}>
            {/* Filter statusHistory to only show current user's activities */}
            {[...order.statusHistory]
              .filter((entry: any) => entry.email === userDetails?.email) // Only show current user's activities
              .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              .map((entry: any, index: number) => (
                <View key={index} style={styles.timelineItem}>
                  <View style={[styles.timelineDot, { backgroundColor: getStatusColor(entry.status) }]} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineStatus}>{entry.status}</Text>
                    <Text style={styles.timelineDate}>{formatDate(entry.updatedAt)}</Text>
                    <Text style={styles.timelineEmail}>by you</Text>
                  </View>
                </View>
              ))}
            {/* Show message if no activities found for current user */}
            {[...order.statusHistory].filter((entry: any) => entry.email === userDetails?.email).length === 0 && (
              <View style={styles.noActivityContainer}>
                <Icon name="time" size={32} color="#666" />
                <Text style={styles.noActivityText}>No activities found for your account</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 40,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  statusCard: {
    backgroundColor: "#111",
    margin: 20,
    padding: 20,
    borderRadius: 16,
    borderColor: "#333",
    borderWidth: 1,
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderId: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  status: {
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  orderDate: {
    color: "#888",
    fontSize: 14,
    marginBottom: 8,
  },
  earningsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  earningsText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  customerCard: {
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 12,
    borderColor: "#333",
    borderWidth: 1,
    gap: 12,
  },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  customerName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  customerPhone: {
    color: "#fff",
    fontSize: 16,
  },
  addressCard: {
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 12,
    borderColor: "#333",
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
  },
  addressDetails: {
    flex: 1,
  },
  addressText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  addressSubtext: {
    color: "#888",
    fontSize: 12,
  },
  itemsCard: {
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 12,
    borderColor: "#333",
    borderWidth: 1,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomColor: "#333",
    borderBottomWidth: 1,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  itemQuantity: {
    color: "#888",
    fontSize: 12,
  },
  itemPrice: {
    color: "#4CAF50",
    fontSize: 14,
    fontWeight: "bold",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    marginTop: 8,
    borderTopColor: "#333",
    borderTopWidth: 1,
  },
  totalLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  totalAmount: {
    color: "#4CAF50",
    fontSize: 18,
    fontWeight: "bold",
  },
  timelineCard: {
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 12,
    borderColor: "#333",
    borderWidth: 1,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    gap: 12,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineStatus: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 2,
  },
  timelineDate: {
    color: "#888",
    fontSize: 12,
    marginBottom: 2,
  },
  timelineEmail: {
    color: "#888",
    fontSize: 11,
    fontStyle: "italic",
  },
  noActivityContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  noActivityText: {
    color: "#888",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
})

export default OrderDetailsScreen
