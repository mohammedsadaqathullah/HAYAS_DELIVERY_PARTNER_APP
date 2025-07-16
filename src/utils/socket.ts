// Debug utility for Socket.IO connection
export const debugSocket = (socket) => {
    if (!socket) {
      console.log("❌ Socket is null or undefined")
      return
    }
  
    console.log("🔍 Socket Debug Info:")
    console.log("- Socket ID:", socket.id)
    console.log("- Connected:", socket.connected)
    console.log("- Disconnected:", socket.disconnected)
    console.log("- Transport:", socket.io.engine.transport.name)
  
    // Log all registered event listeners
    const events = Object.keys(socket._callbacks || {})
    console.log("- Registered events:", events)
  
    return {
      id: socket.id,
      connected: socket.connected,
      transport: socket.io.engine.transport.name,
      events: events,
    }
  }
  
  // Test socket connection
  export const testSocketConnection = (socket, userEmail) => {
    if (!socket || !socket.connected) {
      console.log("❌ Cannot test - socket not connected")
      return false
    }
  
    console.log("🧪 Testing socket connection...")
  
    // Test emit
    socket.emit("test-connection", {
      message: "Test from React Native",
      userEmail,
      timestamp: new Date().toISOString(),
    })
  
    console.log("✅ Test emit sent")
    return true
  }
  