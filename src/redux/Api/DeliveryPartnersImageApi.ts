import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import baseurl from "../baseurl"

export interface ImageFile {
  uri: string
  name: string
  type: string
}

// Update the response interface to include the returned URL
interface ImageUploadResponse {
  message: string
  image: {
    uploadedAt: string
    url : string
  }
  filePath?: string
  updatedTypes?: string
}

export const DeliveryPartnersImagesApi = createApi({
  reducerPath: "DeliveryPartnersImagesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseurl}/delivery-partners-images`,
  }),
  tagTypes: ["DeliveryPartnersImages"],

  endpoints: (builder) => ({
    // 🔄 Upload multiple images
    uploadMultipleImages: builder.mutation<
      { message: string },
      { email: string; images: ImageFile[]; types: string[] }
    >({
      query: ({ email, images, types }) => {
        const formData = new FormData()
        formData.append("email", email)
        formData.append("types", JSON.stringify(types))

        images.forEach((img) => {
          formData.append("images", {
            uri: img.uri,
            name: img.name,
            type: img.type,
          } as any)
        })

        return {
          url: "/upload-multiple",
          method: "POST",
          body: formData,
        }
      },
      invalidatesTags: ["DeliveryPartnersImages"],
    }),

    // 🔍 Get all users' image data
    getAllImages: builder.query<any[], void>({
      query: () => "/",
      providesTags: ["DeliveryPartnersImages"],
    }),

    // 🔍 Get single user's images by email
    getImagesByEmail: builder.query<any, string>({
      query: (email) => `/${email}`,
      providesTags: (result, error, email) => [{ type: "DeliveryPartnersImages", id: email }],
    }),

    // 🔁 Patch/update one image type - Updated to return ImageUploadResponse
    updateImageType: builder.mutation<ImageUploadResponse, { email: string; type: string; image: ImageFile }>({
      query: ({ email, type, image }) => {
        const formData = new FormData()
        formData.append("image", {
          uri: image.uri,
          name: image.name,
          type: image.type,
        } as any)

        return {
          url: `/${email}/${type}`,
          method: "PATCH",
          body: formData,
        }
      },
      invalidatesTags: (result, error, { email }) => [{ type: "DeliveryPartnersImages", id: email }],
    }),
  }),
})

export const {
  useUploadMultipleImagesMutation,
  useGetAllImagesQuery,
  useGetImagesByEmailQuery,
  useUpdateImageTypeMutation,
} = DeliveryPartnersImagesApi
