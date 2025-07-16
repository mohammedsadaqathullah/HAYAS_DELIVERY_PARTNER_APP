import AsyncStorage from "@react-native-async-storage/async-storage"
import { useNavigation } from "@react-navigation/native"
import React from "react"
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from "react-native"
import Icon from "react-native-vector-icons/Ionicons"
import { useSelector } from "react-redux"
import { RootState } from "../redux/store"
import { useAuth } from "../navigation/AuthContext"

const ProfileScreen = ({ navigation }: any) => {
  const userDetails = useSelector((state: RootState) => state.user.userDetails);
  const orderHistory = useSelector((state: RootState) => state.user.orderHistory);
  const { logout } = useAuth();

  const profileData = {
    name: userDetails?.name,
    parentName: userDetails?.parentName,
    email: userDetails?.email,
    phone: userDetails?.phone,
    address: userDetails?.address,
    pincode: userDetails?.pincode,
    status: userDetails?.status,
    rating: 4.8,
    totalOrders: orderHistory?.length,
    profileImage: userDetails?.profileImage,
  }

  const handleEditProfile = () => {
    Alert.alert("Edit Profile", "Profile editing feature will be available soon.")
  }

  const handleDocuments = () => {
    Alert.alert("Documents", "Document management feature will be available soon.")
  }

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          // Handle logout logic here
          console.log("Logout")
          AsyncStorage.removeItem('delivery_partner_email')
          AsyncStorage.removeItem('status')
          AsyncStorage.removeItem('dutyStatus')
logout()
        },
      },
    ])
  }

  const ProfileItem = ({ icon, title, value }: any) => (
    <View style={styles.profileItem}>
      <Icon name={icon} size={20} color="#FFD700" />
      <View style={styles.profileItemContent}>
        <Text style={styles.profileItemTitle}>{title}</Text>
        <Text style={styles.profileItemValue}>{value}</Text>
      </View>
    </View>
  )

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.header}>
        <Image source={{ uri: profileData.profileImage }} style={styles.profileImage} />
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{profileData.name}</Text>
          <Text style={styles.parentName}>S/o {profileData.parentName}</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: "#4CAF50" }]}>
              <Text style={styles.statusText}>{profileData.status}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Icon name="create" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{profileData.rating}</Text>
          <Text style={styles.statLabel}>Rating</Text>
          <Icon name="star" size={16} color="#FFD700" />
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{profileData.totalOrders}</Text>
          <Text style={styles.statLabel}>Orders</Text>
          <Icon name="list" size={16} color="#2196F3" />
        </View>
      </View>

      {/* Profile Details */}
      <View style={styles.detailsSection}>
        <Text style={styles.sectionTitle}>Personal Information</Text>

        <ProfileItem icon="mail" title="Email" value={profileData.email} />
        <ProfileItem icon="call" title="Phone" value={profileData.phone} />
        <ProfileItem icon="location" title="Address" value={profileData.address} />
        <ProfileItem icon="pin" title="Pincode" value={profileData.pincode} />
      </View>

      {/* Actions */}
      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.actionButton} onPress={handleDocuments}>
          <Icon name="folder" size={24} color="#FFD700" />
          <Text style={styles.actionText}>View Documents</Text>
          <Icon name="chevron-forward" size={20} color="#888" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Icon name="shield-checkmark" size={24} color="#FFD700" />
          <Text style={styles.actionText}>Privacy & Security</Text>
          <Icon name="chevron-forward" size={20} color="#888" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Icon name="help-circle" size={24} color="#FFD700" />
          <Text style={styles.actionText}>Help & Support</Text>
          <Icon name="chevron-forward" size={20} color="#888" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.logoutButton]} onPress={handleLogout}>
          <Icon name="log-out" size={24} color="#F44336" />
          <Text style={[styles.actionText, { color: "#F44336" }]}>Logout</Text>
        </TouchableOpacity>
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
    alignItems: "center",
    padding: 20,
    backgroundColor: "#111",
    margin: 20,
    borderRadius: 16,
    borderColor: "#333",
    borderWidth: 1,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderColor: "#FFD700",
    borderWidth: 2,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  parentName: {
    color: "#888",
    fontSize: 14,
    marginTop: 4,
  },
  statusContainer: {
    marginTop: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  editButton: {
    backgroundColor: "#FFD700",
    padding: 10,
    borderRadius: 20,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderColor: "#333",
    borderWidth: 1,
  },
  statValue: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  statLabel: {
    color: "#888",
    fontSize: 12,
    marginTop: 4,
    marginBottom: 4,
  },
  detailsSection: {
    padding: 20,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  profileItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderColor: "#333",
    borderWidth: 1,
  },
  profileItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  profileItemTitle: {
    color: "#888",
    fontSize: 12,
    marginBottom: 2,
  },
  profileItemValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
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
    flex: 1,
  },
  logoutButton: {
    marginTop: 20,
    borderColor: "#F44336",
  },
})

export default ProfileScreen
