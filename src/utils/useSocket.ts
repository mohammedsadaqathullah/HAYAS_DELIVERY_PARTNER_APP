"use client"

import { useEffect, useState, useCallback } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import io, { type Socket } from "socket.io-client"
import baseurl from "../redux/baseurl"

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    const initializeSocket = async () => {
      try {
        const email = await AsyncStorage.getItem("delivery_partner_email")
        if (!email) {
          console.log("❌ No delivery_partner_email found in AsyncStorage")
          return
        }

        setUserEmail(email)
        console.log("📧 Using email from AsyncStorage:", email)

        const socketInstance = io(baseurl.replace("/api", ""), {
          transports: ["websocket", "polling"],
          autoConnect: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 1000,
          timeout: 20000,
          forceNew: true,
        })

        socketInstance.on("connect", () => {
          console.log("✅ Socket connected:", socketInstance.id)
          setIsConnected(true)
          // Join room with email
          socketInstance.emit("join", email)
          console.log("📡 Emitted 'join' with:", email)
        })

        socketInstance.on("disconnect", (reason) => {
          console.log("❌ Socket disconnected:", reason)
          setIsConnected(false)
        })

        socketInstance.on("connect_error", (error) => {
          console.error("❌ Socket connection error:", error)
          setIsConnected(false)
        })

        socketInstance.on("reconnect", (attempt) => {
          console.log("🔄 Reconnected after", attempt, "attempt(s)")
          setIsConnected(true)
          // Re-join the email room after reconnect
          if (email) {
            socketInstance.emit("join", email)
            console.log("📡 Re-emitted 'join' with:", email)
          }
        })

        socketInstance.on("reconnect_error", (error) => {
          console.error("❌ Socket reconnection error:", error)
        })

        socketInstance.on("reconnect_failed", () => {
          console.error("❌ Socket reconnection failed")
          setIsConnected(false)
        })

        setSocket(socketInstance)

        // Cleanup when unmounting
        return () => {
          console.log("🧹 Cleaning up socket connection")
          socketInstance.disconnect()
          setSocket(null)
          setIsConnected(false)
        }
      } catch (error) {
        console.error("❌ Socket initialization failed:", error)
      }
    }

    initializeSocket()
  }, [])

  const onEvent = useCallback(
    (event: string, callback: Function) => {
      if (socket) {
        socket.on(event, callback)
      }
    },
    [socket],
  )

  const offEvent = useCallback(
    (event: string, callback: Function) => {
      if (socket) {
        socket.off(event, callback)
      }
    },
    [socket],
  )

  const emitEvent = useCallback(
    (event: string, data: any) => {
      if (socket && isConnected) {
        socket.emit(event, data)
      } else {
        console.log("❌ Cannot emit event (not connected):", event)
      }
    },
    [socket, isConnected],
  )

  return {
    socket,
    isConnected,
    userEmail, // This is the key - make sure userEmail is available
    onEvent,
    offEvent,
    emitEvent,
  }
}
