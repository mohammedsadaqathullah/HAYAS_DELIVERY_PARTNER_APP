import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"

const STATS_API_URL = "https://hayas-backend.onrender.com/delivery-partner-stats"

export const deliveryPartnerStatsApi = createApi({
  reducerPath: "deliveryPartnerStatsApi", // Make sure this matches what you use in store
  baseQuery: fetchBaseQuery({ baseUrl: STATS_API_URL }),
  tagTypes: ["Stats"],
  endpoints: (builder) => ({
    getDeliveryPartnerStats: builder.query({
      query: (email) => `/${email}`,
      providesTags: ["Stats"],
    }),
    getDeliveryPartnerSummary: builder.query({
      query: ({ email, period }) => `/${email}/summary?period=${period}`,
      providesTags: ["Stats"],
    }),
    updateOrderStats: builder.mutation({
      query: ({ email, orderId, action, orderDate }) => ({
        url: "/update-order-stats",
        method: "POST",
        body: { email, orderId, action, orderDate },
      }),
      invalidatesTags: ["Stats"],
    }),
    syncWorkingHours: builder.mutation({
      query: ({ email, date }) => ({
        url: "/sync-working-hours",
        method: "POST",
        body: { email, date },
      }),
      invalidatesTags: ["Stats"],
    }),
  }),
})

export const {
  useGetDeliveryPartnerStatsQuery,
  useGetDeliveryPartnerSummaryQuery,
  useUpdateOrderStatsMutation,
  useSyncWorkingHoursMutation,
} = deliveryPartnerStatsApi
