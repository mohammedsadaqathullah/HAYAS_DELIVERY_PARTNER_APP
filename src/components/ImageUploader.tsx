// ImageUploader.tsx

"use client"

import type React from "react"
import { useState } from "react"
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native"
import Icon from "react-native-vector-icons/MaterialIcons"
import ImageCropPicker from "react-native-image-crop-picker"

interface ImageUploaderProps {
  type: string
  label: string
  onImageSelected: (type: string, imagePath: string) => void
  isProfileImage?: boolean
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  type,
  label,
  onImageSelected,
  isProfileImage = false,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const selectAndCropImage = async () => {
    try {
      const image = await ImageCropPicker.openPicker({
        cropping: true,
        cropperCircleOverlay: isProfileImage,
        width: isProfileImage ? 300 : undefined,
        height: isProfileImage ? 300 : undefined,
        freeStyleCropEnabled: !isProfileImage,
        compressImageQuality: 0.9,
        mediaType: "photo",
      })

      setSelectedImage(image.path)
      onImageSelected(type, image.path)
    } catch (error) {
      console.log("Image selection cancelled:", error)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity
        style={[styles.imagePicker, selectedImage && styles.imagePickerSelected]}
        onPress={selectAndCropImage}
      >
        {selectedImage ? (
          <Image
            source={{ uri: selectedImage }}
            style={[styles.selectedImage, isProfileImage && styles.profileImage]}
          />
        ) : (
          <View style={styles.imagePickerContent}>
            <Icon name="add-a-photo" size={30} color="#666" />
            <Text style={styles.imagePickerText}>Tap to select</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  imagePicker: {
    height: 120,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#333",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  imagePickerSelected: {
    borderColor: "#4CAF50",
    borderStyle: "solid",
  },
  imagePickerContent: {
    alignItems: "center",
  },
  imagePickerText: {
    color: "#666",
    fontSize: 12,
    marginTop: 5,
  },
  selectedImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
    resizeMode: "cover",
  },
  profileImage: {
    borderRadius: 60,
  },
})

export default ImageUploader
