"use client"

import { useState, useCallback, useMemo } from "react"
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from "react-native"
import { useGetAllOrdersQuery } from "../redux/Api/ordersApi"
import Icon from "react-native-vector-icons/Ionicons"
import type { RootState } from "../redux/store"
import { useSelector } from "react-redux"

type PeriodType = "today" | "week" | "month"
type StatusType = "all" | "DELIVERED" | "CANCELLED"

// Move the helper function outside the component to avoid dependency issues
const getCurrentOrderStatus = (order: any) => {
  if (!order.statusHistory || order.statusHistory.length === 0) {
    return order.status
  }

  // Create a copy of the array before sorting to avoid mutating read-only state
  const statusHistoryCopy = [...order.statusHistory]

  // Check for DELIVERED status first
  const deliveredEntry = statusHistoryCopy
    .filter((entry: any) => entry.status === "DELIVERED")
    .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]

  if (deliveredEntry) return "DELIVERED"

  // Check for CANCELLED status
  const cancelledEntry = statusHistoryCopy
    .filter((entry: any) => entry.status === "CANCELLED")
    .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]

  if (cancelledEntry) return "CANCELLED"

  // Check for CONFIRMED status
  const confirmedEntry = statusHistoryCopy
    .filter((entry: any) => entry.status === "CONFIRMED")
    .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]

  if (confirmedEntry) return "CONFIRMED"

  return order.status
}

const OrderHistoryScreen = ({ navigation }: any) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("today")
  const [selectedStatus, setSelectedStatus] = useState<StatusType>("all")
  const [page, setPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)

  const userDetails = useSelector((state: RootState) => state.user.userDetails)
  const { data: allOrders, isLoading, refetch } = useGetAllOrdersQuery(userDetails?.email)

  // Filter orders based on selected period and status
  const filteredOrders = useMemo(() => {
    if (!allOrders) return []

    let filtered = [...allOrders]

    // Filter by period
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    filtered = filtered.filter((order) => {
      const orderDate = new Date(order.createdAt)
      switch (selectedPeriod) {
        case "today":
          return orderDate >= today
        case "week":
          return orderDate >= weekAgo
        case "month":
          return orderDate >= monthAgo
        default:
          return true
      }
    })

    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter((order) => {
        const currentStatus = getCurrentOrderStatus(order)
        return currentStatus === selectedStatus
      })
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [allOrders, selectedPeriod, selectedStatus])

  // Paginated orders for display
  const paginatedOrders = useMemo(() => {
    const itemsPerPage = 10
    return filteredOrders.slice(0, page * itemsPerPage)
  }, [filteredOrders, page])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "#4CAF50"
      case "CANCELLED":
        return "#F44336"
      case "CONFIRMED":
        return "#2196F3"
      case "PENDING":
        return "#FF9800"
      default:
        return "#888"
    }
  }

  const handleOrderPress = (order: any) => {
    navigation.navigate("OrderDetails", { order })
  }

  const handleLoadMore = useCallback(() => {
    if (loadingMore) return

    const itemsPerPage = 10
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)

    if (page < totalPages) {
      setLoadingMore(true)
      setTimeout(() => {
        setPage((prev) => prev + 1)
        setLoadingMore(false)
      }, 500)
    }
  }, [filteredOrders.length, page, loadingMore])

  const onRefresh = useCallback(() => {
    setPage(1)
    refetch()
  }, [refetch])

  const PeriodButton = ({ period, label }: { period: PeriodType; label: string }) => (
    <TouchableOpacity
      style={[styles.periodButton, selectedPeriod === period && styles.activePeriodButton]}
      onPress={() => {
        setSelectedPeriod(period)
        setPage(1)
      }}
    >
      <Text style={[styles.periodButtonText, selectedPeriod === period && styles.activePeriodButtonText]}>{label}</Text>
    </TouchableOpacity>
  )

  const StatusButton = ({ status, label }: { status: StatusType; label: string }) => (
    <TouchableOpacity
      style={[styles.statusButton, selectedStatus === status && styles.activeStatusButton]}
      onPress={() => {
        setSelectedStatus(status)
        setPage(1)
      }}
    >
      <Text style={[styles.statusButtonText, selectedStatus === status && styles.activeStatusButtonText]}>{label}</Text>
    </TouchableOpacity>
  )

  const renderOrderItem = ({ item }: { item: any }) => {
    const currentStatus = getCurrentOrderStatus(item)
    const totalAmount =
      item.products?.reduce((sum: number, product: any) => sum + (product.price || 0) * product.count, 0) || 0

    // Calculate earnings based on status
    const earnings = currentStatus === "DELIVERED" ? 30 : currentStatus === "CANCELLED" ? -30 : 0

    return (
      <TouchableOpacity style={styles.orderCard} onPress={() => handleOrderPress(item)}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>#{item._id.slice(-6)}</Text>
          <Text style={[styles.status, { color: getStatusColor(currentStatus) }]}>{currentStatus}</Text>
        </View>

        <View style={styles.customerInfo}>
          <Icon name="person" size={16} color="#888" />
          <Text style={styles.customerName}>{item.address?.name}</Text>
        </View>

        <View style={styles.addressInfo}>
          <Icon name="location" size={16} color="#888" />
          <Text style={styles.addressText} numberOfLines={1}>
            {item.address?.street}, {item.address?.area}
          </Text>
        </View>

        <View style={styles.orderDetails}>
          <Text style={styles.itemCount}>{item.products?.length || 0} items</Text>
          <Text style={[styles.orderAmount, { color: getStatusColor(currentStatus) }]}>
            {earnings > 0 ? "+" : ""}₹{earnings}
          </Text>
          <Text style={styles.orderDate}>
            {new Date(item.createdAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
            })}
          </Text>
        </View>

        <View style={styles.orderFooter}>
          <Icon name="chevron-forward" size={16} color="#888" />
        </View>
      </TouchableOpacity>
    )
  }

  const renderFooter = () => {
    if (!loadingMore) return null
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#FFD700" />
        <Text style={styles.footerLoaderText}>Loading more...</Text>
      </View>
    )
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Period Filter */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterTitle}>Period</Text>
        <View style={styles.periodSelector}>
          <PeriodButton period="today" label="Today" />
          <PeriodButton period="week" label="Past 7 Days" />
          <PeriodButton period="month" label="Past Month" />
        </View>
      </View>

      {/* Status Filter */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterTitle}>Status</Text>
        <View style={styles.statusSelector}>
          <StatusButton status="all" label="All" />
          <StatusButton status="DELIVERED" label="Delivered" />
          <StatusButton status="CANCELLED" label="Rejected" />
        </View>
      </View>

      {/* Results Count */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""} found
        </Text>
      </View>

      <FlatList
        data={paginatedOrders}
        keyExtractor={(item) => item._id}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor="#FFD700" />}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="time" size={48} color="#666" />
            <Text style={styles.emptyText}>No orders found</Text>
            <Text style={styles.emptySubtext}>
              {selectedStatus !== "all"
                ? `No ${selectedStatus.toLowerCase()} orders in selected period`
                : "No orders found in selected period"}
            </Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  loadingText: {
    color: "#fff",
    marginTop: 10,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
  },
  periodSelector: {
    flexDirection: "row",
    gap: 8,
  },
  periodButton: {
    flex: 1,
    backgroundColor: "#111",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
    borderColor: "#333",
    borderWidth: 1,
  },
  activePeriodButton: {
    backgroundColor: "#FFD700",
    borderColor: "#FFD700",
  },
  periodButtonText: {
    color: "#888",
    fontSize: 12,
    fontWeight: "500",
  },
  activePeriodButtonText: {
    color: "#000",
    fontWeight: "bold",
  },
  statusSelector: {
    flexDirection: "row",
    gap: 8,
  },
  statusButton: {
    backgroundColor: "#111",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderColor: "#333",
    borderWidth: 1,
  },
  activeStatusButton: {
    backgroundColor: "#FFD700",
    borderColor: "#FFD700",
  },
  statusButtonText: {
    color: "#888",
    fontSize: 11,
    fontWeight: "500",
  },
  activeStatusButtonText: {
    color: "#000",
    fontWeight: "bold",
  },
  resultsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultsText: {
    color: "#888",
    fontSize: 12,
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  orderCard: {
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderColor: "#333",
    borderWidth: 1,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderId: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  status: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  customerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  customerName: {
    color: "#fff",
    fontSize: 14,
  },
  addressInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  addressText: {
    color: "#888",
    fontSize: 12,
    flex: 1,
  },
  orderDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  itemCount: {
    color: "#888",
    fontSize: 12,
  },
  orderAmount: {
    fontSize: 14,
    fontWeight: "bold",
  },
  orderDate: {
    color: "#888",
    fontSize: 12,
  },
  orderFooter: {
    alignItems: "flex-end",
  },
  footerLoader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    gap: 8,
  },
  footerLoaderText: {
    color: "#888",
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: "#666",
    fontSize: 16,
    marginTop: 16,
    fontWeight: "bold",
  },
  emptySubtext: {
    color: "#888",
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },
})

export default OrderHistoryScreen
