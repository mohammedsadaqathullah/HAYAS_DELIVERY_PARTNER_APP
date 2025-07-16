"use client"

import { useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native"
import Icon from "react-native-vector-icons/Ionicons"
import { useSelector } from "react-redux"
import type { RootState } from "../redux/store"
import {
  useGetDeliveryPartnerSummaryQuery,
  useGetDeliveryPartnerStatsQuery,
} from "../redux/Api/deliveryPartnerStatsApi"

const EarningsReportScreen = ({ navigation }: any) => {
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month">("week")
  const userDetails = useSelector((state: RootState) => state.user.userDetails)

  const { data: summaryData, isLoading: summaryLoading } = useGetDeliveryPartnerSummaryQuery(
    { email: userDetails?.email, period: selectedPeriod },
    { skip: !userDetails?.email },
  )

  const { data: allStats, isLoading: statsLoading } = useGetDeliveryPartnerStatsQuery(userDetails?.email, {
    skip: !userDetails?.email,
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const PeriodButton = ({ period, label }: { period: "week" | "month"; label: string }) => (
    <TouchableOpacity
      style={[styles.periodButton, selectedPeriod === period && styles.activePeriodButton]}
      onPress={() => setSelectedPeriod(period)}
    >
      <Text style={[styles.periodButtonText, selectedPeriod === period && styles.activePeriodButtonText]}>{label}</Text>
    </TouchableOpacity>
  )

  const DailyStatsCard = ({ stat }: { stat: any }) => (
    <View style={styles.dailyCard}>
      <View style={styles.dailyHeader}>
        <Text style={styles.dailyDate}>{formatDate(stat.date)}</Text>
        <Text style={styles.dailyEarnings}>₹{stat.earnings}</Text>
      </View>
      <View style={styles.dailyStats}>
        <View style={styles.dailyStat}>
          <Icon name="checkmark-circle" size={16} color="#4CAF50" />
          <Text style={styles.dailyStatText}>{stat.completedOrders} completed</Text>
        </View>
        <View style={styles.dailyStat}>
          <Icon name="close-circle" size={16} color="#F44336" />
          <Text style={styles.dailyStatText}>{stat.rejectedOrders} rejected</Text>
        </View>
        {stat.workingHours && (
          <View style={styles.dailyStat}>
            <Icon name="time" size={16} color="#FFD700" />
            <Text style={styles.dailyStatText}>{stat.workingHours.toFixed(1)}h worked</Text>
          </View>
        )}
      </View>
    </View>
  )

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Earnings Report</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Period Selection */}
      <View style={styles.periodSelector}>
        <PeriodButton period="week" label="Past 7 Days" />
        <PeriodButton period="month" label="Past 30 Days" />
      </View>

      {/* Summary Card */}
      {summaryLoading ? (
        <ActivityIndicator size="large" color="#FFD700" style={styles.loader} />
      ) : summaryData ? (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{selectedPeriod === "week" ? "Weekly" : "Monthly"} Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Icon name="wallet" size={24} color="#4CAF50" />
              <Text style={styles.summaryValue}>₹{summaryData.summary.totalEarnings}</Text>
              <Text style={styles.summaryLabel}>Total Earnings</Text>
            </View>
            <View style={styles.summaryItem}>
              <Icon name="list" size={24} color="#2196F3" />
              <Text style={styles.summaryValue}>{summaryData.summary.totalCompletedOrders}</Text>
              <Text style={styles.summaryLabel}>Orders Completed</Text>
            </View>
            <View style={styles.summaryItem}>
              <Icon name="close-circle" size={24} color="#F44336" />
              <Text style={styles.summaryValue}>{summaryData.summary.totalRejectedOrders}</Text>
              <Text style={styles.summaryLabel}>Orders Rejected</Text>
            </View>
            <View style={styles.summaryItem}>
              <Icon name="time" size={24} color="#FFD700" />
              <Text style={styles.summaryValue}>{summaryData.summary.totalWorkingHours.toFixed(1)}h</Text>
              <Text style={styles.summaryLabel}>Working Hours</Text>
            </View>
          </View>
        </View>
      ) : null}

      {/* Daily Breakdown */}
      <View style={styles.dailySection}>
        <Text style={styles.sectionTitle}>Daily Breakdown</Text>
        {statsLoading ? (
          <ActivityIndicator size="large" color="#FFD700" style={styles.loader} />
        ) : summaryData?.dailyStats && summaryData.dailyStats.length > 0 ? (
          summaryData.dailyStats.map((stat: any, index: number) => <DailyStatsCard key={index} stat={stat} />)
        ) : (
          <View style={styles.noDataCard}>
            <Icon name="document-text" size={48} color="#666" />
            <Text style={styles.noDataText}>No earnings data found for this period</Text>
          </View>
        )}
      </View>

      {/* Earnings Calculation Info */}
      <View style={styles.infoCard}>
        <Icon name="information-circle" size={24} color="#FFD700" />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>How Earnings are Calculated</Text>
          <Text style={styles.infoText}>• You earn ₹30 for each completed order</Text>
          <Text style={styles.infoText}>• Earnings are credited when order is marked as delivered</Text>
          <Text style={styles.infoText}>• Rejected orders don't affect your earnings</Text>
        </View>
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
  periodSelector: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  periodButton: {
    flex: 1,
    backgroundColor: "#111",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
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
    fontSize: 14,
    fontWeight: "500",
  },
  activePeriodButtonText: {
    color: "#000",
    fontWeight: "bold",
  },
  summaryCard: {
    backgroundColor: "#111",
    margin: 20,
    padding: 20,
    borderRadius: 16,
    borderColor: "#333",
    borderWidth: 1,
  },
  summaryTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#1a1a1a",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
  },
  summaryValue: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  summaryLabel: {
    color: "#888",
    fontSize: 12,
    textAlign: "center",
  },
  dailySection: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  dailyCard: {
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderColor: "#333",
    borderWidth: 1,
  },
  dailyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dailyDate: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  dailyEarnings: {
    color: "#4CAF50",
    fontSize: 18,
    fontWeight: "bold",
  },
  dailyStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  dailyStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dailyStatText: {
    color: "#888",
    fontSize: 12,
  },
  noDataCard: {
    backgroundColor: "#111",
    padding: 40,
    borderRadius: 16,
    alignItems: "center",
    borderColor: "#333",
    borderWidth: 1,
  },
  noDataText: {
    color: "#888",
    fontSize: 16,
    marginTop: 16,
    textAlign: "center",
  },
  infoCard: {
    backgroundColor: "#111",
    margin: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    gap: 12,
    borderColor: "#333",
    borderWidth: 1,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
  },
  infoText: {
    color: "#888",
    fontSize: 12,
    marginBottom: 4,
  },
  loader: {
    marginVertical: 20,
  },
})

export default EarningsReportScreen
