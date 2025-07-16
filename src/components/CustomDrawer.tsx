import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from "react-native"
import { DrawerContentScrollView } from "@react-navigation/drawer"
import Icon from "react-native-vector-icons/MaterialIcons"
import { useAuth } from "../navigation/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

const CustomDrawer = (props: any) => {
    const { logout } = useAuth();
    const userDetails = useSelector((state: RootState) => state.user.userDetails)

  const menuItems = [
    { name: "Home", icon: "dashboard", route: "Home" },
    { name: "Order History", icon: "history", route: "OrderHistory" },
    { name: "Earnings", icon: "account-balance-wallet", route: "Earnings" },
    { name: "Profile", icon: "person", route: "Profile" },
    { name: "Support", icon: "support-agent", route: "Support" },
    { name: "Settings", icon: "settings", route: "Settings" },
  ]

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          // Handle logout logic here
          AsyncStorage.removeItem('delivery_partner_email')
          AsyncStorage.removeItem('status')
          AsyncStorage.removeItem('dutyStatus')
logout()
          console.log("Logout")
        },
      },
    ])
  }

  return (
    <View style={styles.container}>
      <DrawerContentScrollView {...props} contentContainerStyle={styles.scrollView}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <Image
            source={{ uri:userDetails?.profileImage }}
            style={styles.profileImage}
          />
          <Text style={styles.profileName}>{userDetails?.name}</Text>
          <Text style={styles.profileEmail}>{userDetails?.email}</Text>
          <View style={styles.ratingContainer}>
            <Icon name="star" size={16} color="#FFD700" />
            <Text style={styles.rating}>4.8</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => {
                if (item.route === "Support" || item.route === "Settings") {
                  Alert.alert("Coming Soon", `${item.name} feature will be available soon.`)
                } else {
                  props.navigation.navigate(item.route)
                }
              }}
            >
              <Icon name={item.icon} size={24} color="#FFD700" />
              <Text style={styles.menuText}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </DrawerContentScrollView>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="logout" size={24} color="#F44336" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
  },
  scrollView: {
    flexGrow: 1,
  },
  profileSection: {
    alignItems: "center",
    padding: 20,
    borderBottomColor: "#333",
    borderBottomWidth: 1,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    borderColor: "#FFD700",
    borderWidth: 2,
  },
  profileName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  profileEmail: {
    color: "#888",
    fontSize: 14,
    marginTop: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 4,
  },
  rating: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "bold",
  },
  menuSection: {
    flex: 1,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  menuText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopColor: "#333",
    borderTopWidth: 1,
    gap: 16,
  },
  logoutText: {
    color: "#F44336",
    fontSize: 16,
    fontWeight: "500",
  },
})

export default CustomDrawer
