"use client"

import { useEffect, useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from "react-native"
import Icon from "react-native-vector-icons/Ionicons"
import { useSelector } from "react-redux"
import type { RootState } from "../redux/store"
import {
  useGetAvailableEarningsQuery,
  useGetWithdrawalHistoryQuery,
  useRequestWithdrawalMutation,
} from "../redux/Api/withdrawalApi"

const WithdrawalScreen = ({ navigation }: any) => {
  const [withdrawalAmount, setWithdrawalAmount] = useState("")
  const userDetails = useSelector((state: RootState) => state.user.userDetails)
  const orderHistory = useSelector((state: RootState) => state.user.orderHistory)
  const [orderIds, setOrderIds] = useState<string[]>([])
  const {
    data: earningsData,
    isLoading: earningsLoading,
    refetch: refetchEarnings,
  } = useGetAvailableEarningsQuery(userDetails?.email, { skip: !userDetails?.email })

  const {
    data: withdrawalHistory,
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useGetWithdrawalHistoryQuery(userDetails?.email, { skip: !userDetails?.email })

  const [requestWithdrawal, { isLoading: requestLoading }] = useRequestWithdrawalMutation()

  useEffect(() => {
    if (orderHistory && orderHistory.length > 0) {
      const ids = orderHistory.map((o) => o._id)
      setOrderIds(ids)
    }

  }, [orderHistory])

  const handleWithdrawalRequest = async () => {
    const amount = Number.parseFloat(withdrawalAmount)

    if (!amount || amount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid withdrawal amount.")
      return
    }

    if (amount > (earningsData?.availableEarnings || 0)) {
      Alert.alert("Insufficient Balance", "You don't have enough balance for this withdrawal.")
      return
    }

    if (amount < 100) {
      Alert.alert("Minimum Amount", "Minimum withdrawal amount is ₹100.")
      return
    }

    try {
      await requestWithdrawal({
        email: userDetails?.email,
        amount: amount,
        orderIds: orderIds, // You can add specific order IDs if needed
      }).unwrap()

      Alert.alert("Success", "Withdrawal request submitted successfully!", [
        {
          text: "OK",
          onPress: () => {
            setWithdrawalAmount("")
            refetchEarnings()
            refetchHistory()
          },
        },
      ])
    } catch (error: any) {
      console.error("Withdrawal request failed:", error)
      Alert.alert("Error", error?.data?.error || "Failed to submit withdrawal request")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "#4CAF50"
      case "Rejected":
        return "#F44336"
      case "Pending":
        return "#FF9800"
      default:
        return "#888"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Withdraw Money</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Available Balance Card */}
      <View style={styles.balanceCard}>
        <Icon name="wallet" size={32} color="#4CAF50" />
        <View style={styles.balanceContent}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          {earningsLoading ? (
            <ActivityIndicator size="small" color="#FFD700" />
          ) : (
            <Text style={styles.balanceAmount}>₹{earningsData?.availableEarnings || 0}</Text>
          )}
        </View>
      </View>

      {/* Earnings Summary */}
      {earningsData && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Earnings Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Earnings:</Text>
            <Text style={styles.summaryValue}>₹{earningsData.totalEarnings}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Withdrawn:</Text>
            <Text style={styles.summaryValue}>₹{earningsData.totalWithdrawn}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Pending Amount:</Text>
            <Text style={styles.summaryValue}>₹{earningsData.pendingAmount}</Text>
          </View>
        </View>
      )}

      {/* Withdrawal Form */}
      <View style={styles.withdrawalForm}>
        <Text style={styles.formTitle}>Request Withdrawal</Text>
        <View style={styles.inputContainer}>
          <Icon name="cash" size={20} color="#FFD700" />
          <TextInput
            style={styles.input}
            placeholder="Enter amount (Min ₹100)"
            placeholderTextColor="#888"
            value={withdrawalAmount}
            onChangeText={setWithdrawalAmount}
            keyboardType="numeric"
          />
        </View>
        <TouchableOpacity
          style={[styles.withdrawButton, requestLoading && styles.disabledButton]}
          onPress={handleWithdrawalRequest}
          disabled={requestLoading}
        >
          {requestLoading ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <>
              <Icon name="send" size={20} color="#000" />
              <Text style={styles.withdrawButtonText}>Request Withdrawal</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Withdrawal History */}
      <View style={styles.historySection}>
        <Text style={styles.historyTitle}>Withdrawal History</Text>
        {historyLoading ? (
          <ActivityIndicator size="large" color="#FFD700" style={styles.loader} />
        ) : withdrawalHistory && withdrawalHistory.length > 0 ? (
          withdrawalHistory.map((withdrawal: any, index: number) => (
            <View key={index} style={styles.historyItem}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyAmount}>₹{withdrawal.amount}</Text>
                <Text style={[styles.historyStatus, { color: getStatusColor(withdrawal.status) }]}>
                  {withdrawal.status}
                </Text>
              </View>
              <Text style={styles.historyDate}>Requested: {formatDate(withdrawal.requestedAt)}</Text>
              {withdrawal.processedAt && (
                <Text style={styles.historyDate}>Processed: {formatDate(withdrawal.processedAt)}</Text>
              )}
              {withdrawal.remarks && <Text style={styles.historyRemarks}>Remarks: {withdrawal.remarks}</Text>}
            </View>
          ))
        ) : (
          <View style={styles.noHistoryCard}>
            <Icon name="document-text" size={48} color="#666" />
            <Text style={styles.noHistoryText}>No withdrawal history found</Text>
          </View>
        )}
      </View>
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
  balanceCard: {
    backgroundColor: "#111",
    margin: 20,
    padding: 20,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderColor: "#4CAF50",
    borderWidth: 1,
  },
  balanceContent: {
    flex: 1,
  },
  balanceLabel: {
    color: "#888",
    fontSize: 14,
  },
  balanceAmount: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: "#111",
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderColor: "#333",
    borderWidth: 1,
  },
  summaryTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    color: "#888",
    fontSize: 14,
  },
  summaryValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  withdrawalForm: {
    backgroundColor: "#111",
    margin: 20,
    padding: 20,
    borderRadius: 16,
    borderColor: "#333",
    borderWidth: 1,
  },
  formTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#222",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    paddingVertical: 16,
  },
  withdrawButton: {
    backgroundColor: "#FFD700",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  withdrawButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#666",
    opacity: 0.5,
  },
  historySection: {
    padding: 20,
    paddingTop: 0,
  },
  historyTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  historyItem: {
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderColor: "#333",
    borderWidth: 1,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  historyAmount: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  historyStatus: {
    fontSize: 14,
    fontWeight: "bold",
  },
  historyDate: {
    color: "#888",
    fontSize: 12,
    marginBottom: 4,
  },
  historyRemarks: {
    color: "#888",
    fontSize: 12,
    fontStyle: "italic",
  },
  noHistoryCard: {
    backgroundColor: "#111",
    padding: 40,
    borderRadius: 16,
    alignItems: "center",
    borderColor: "#333",
    borderWidth: 1,
  },
  noHistoryText: {
    color: "#888",
    fontSize: 16,
    marginTop: 16,
    textAlign: "center",
  },
  loader: {
    marginVertical: 20,
  },
})

export default WithdrawalScreen
