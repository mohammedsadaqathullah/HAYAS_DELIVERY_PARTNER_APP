import type React from "react"
import { View, Text, StyleSheet } from "react-native"
import Icon from "react-native-vector-icons/Ionicons"

interface StatsCardProps {
  title: string
  value: string
  icon: string
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon }) => {
  return (
    <View style={styles.container}>
      <Icon name={icon} size={24} color="#FFD700" />
      <View style={styles.content}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
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
  content: {
    flex: 1,
  },
  value: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  title: {
    color: "#888",
    fontSize: 12,
    marginTop: 2,
  },
})

export default StatsCard
