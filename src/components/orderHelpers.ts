// Create a separate utility file for shared functions
export const getCurrentOrderStatus = (order: any) => {
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
  
  export const getStatusColor = (status: string) => {
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
  
  export const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }
  