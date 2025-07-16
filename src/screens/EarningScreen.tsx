import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView } from "react-native"
import Icon from "react-native-vector-icons/Ionicons"
import { useSelector } from "react-redux"
import type { RootState } from "../redux/store"
import { useGetDeliveryPartnerSummaryQuery } from "../redux/Api/deliveryPartnerStatsApi"
import { useGetAvailableEarningsQuery } from "../redux/Api/withdrawalApi"

const EarningsScreen = ({ navigation }: any) => {
  const userDetails = useSelector((state: RootState) => state.user.userDetails)

  // Get different period summaries
  const { data: weeklyData, isLoading: weeklyLoading } = useGetDeliveryPartnerSummaryQuery(
    { email: userDetails?.email, period: "week" },
    { skip: !userDetails?.email },
  )

  const { data: monthlyData, isLoading: monthlyLoading } = useGetDeliveryPartnerSummaryQuery(
    { email: userDetails?.email, period: "month" },
    { skip: !userDetails?.email },
  )

  // Get available earnings
  const { data: earningsData, isLoading: earningsLoading } = useGetAvailableEarningsQuery(userDetails?.email, {
    skip: !userDetails?.email,
  })

  const EarningsCard = ({ title, amount, icon, color, isLoading }: any) => (
    <View style={styles.earningsCard}>
      <Icon name={icon} size={32} color={color} />
      <View style={styles.earningsContent}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFD700" />
        ) : (
          <>
            <Text style={styles.earningsAmount}>₹{amount || 0}</Text>
            <Text style={styles.earningsTitle}>{title}</Text>
          </>
        )}
      </View>
    </View>
  )

  const StatCard = ({ title, value, icon, isLoading }: any) => (
    <View style={styles.statCard}>
      <Icon name={icon} size={24} color="#FFD700" />
      <View>
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFD700" />
        ) : (
          <>
            <Text style={styles.statValue}>{value || 0}</Text>
            <Text style={styles.statTitle}>{title}</Text>
          </>
        )}
      </View>
    </View>
  )

  // Calculate today's earnings (from weekly data)
  const todayEarnings = weeklyData?.dailyStats?.[0]?.earnings || 0

  return (
    <SafeAreaView style={{flex:1}}>
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Earnings Overview</Text>
        <TouchableOpacity style={styles.withdrawButton} onPress={() => navigation.navigate("Withdrawal")}>
          <Icon name="wallet" size={20} color="#000" />
          <Text style={styles.withdrawText}>Withdraw</Text>
        </TouchableOpacity>
      </View>

      <EarningsCard
        title="Available Balance"
        amount={earningsData?.availableEarnings}
        icon="wallet"
        color="#4CAF50"
        isLoading={earningsLoading}
      />

      {/* <View style={styles.earningsRow}>
        <EarningsCard
          title="This Week"
          amount={weeklyData?.summary?.totalEarnings}
          icon="calendar"
          color="#2196F3"
          isLoading={weeklyLoading}
        />
        <EarningsCard
          title="This Month"
          amount={monthlyData?.summary?.totalEarnings}
          icon="calendar-outline"
          color="#FF9800"
          isLoading={monthlyLoading}
        />
      </View> */}

      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Performance Stats</Text>
        <View style={styles.statsRow}>
          <StatCard
            title="Weekly Orders"
            value={weeklyData?.summary?.totalCompletedOrders}
            icon="list"
            isLoading={weeklyLoading}
          />
          <StatCard
            title="Monthly Orders"
            value={monthlyData?.summary?.totalCompletedOrders}
            icon="checkmark-circle"
            isLoading={monthlyLoading}
          />
        </View>
        <StatCard
          title="Working Hours (Week)"
          value={`${weeklyData?.summary?.totalWorkingHours?.toFixed(1) || 0}h`}
          icon="time"
          isLoading={weeklyLoading}
        />
      </View>

      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("EarningsReport")}>
          <Icon name="document-text" size={24} color="#FFD700" />
          <Text style={styles.actionText}>Detailed Earnings Report</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="help-circle" size={24} color="#FFD700" />
          <Text style={styles.actionText}>Payment Help</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </SafeAreaView>
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
    paddingBottom: 10,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  withdrawButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFD700",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  withdrawText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "bold",
  },
  earningsCard: {
    backgroundColor: "#111",
    margin: 20,
    marginBottom: 10,
    padding: 20,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderColor: "#333",
    borderWidth: 1,
  },
  earningsContent: {
    flex: 1,
  },
  earningsAmount: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },
  earningsTitle: {
    color: "#888",
    fontSize: 14,
    marginTop: 4,
  },
  earningsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
  },
  statsSection: {
    padding: 20,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderColor: "#333",
    borderWidth: 1,
  },
  statValue: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  statTitle: {
    color: "#888",
    fontSize: 12,
    marginTop: 2,
  },
  actionsSection: {
    padding: 20,
    paddingTop: 0,
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
    gap: 16,
  },
  actionText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
})

export default EarningsScreen
