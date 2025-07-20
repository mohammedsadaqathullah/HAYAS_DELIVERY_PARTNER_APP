import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"

const ORDERS_API_URL = "https://hayas-backend.onrender.com/orders"

export const ordersApi = createApi({
  reducerPath: "ordersApi",
  baseQuery: fetchBaseQuery({ baseUrl: ORDERS_API_URL }),
  tagTypes: ["Order"],
  endpoints: (builder) => ({
    getAllOrders: builder.query({
      query: (email) => `/${email}`,
      providesTags: ["Order"],
    }),
    getActiveOrders: builder.query({
      query: (email) => `/active/${email}`,
      providesTags: ["Order"],
    }),
    updateOrderStatus: builder.mutation({
      query: ({ id, status, updatedByEmail }) => ({
        url: `/${id}/status`,
        method: "PATCH",
        body: { status, updatedByEmail },
      }),
      invalidatesTags: ["Order"],
    }),
    // New endpoint for paginated orders with filters
    getOrdersWithPagination: builder.query({
      query: ({ email, page = 1, limit = 10, status, period }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        })
        if (status) params.append("status", status)
        if (period) params.append("period", period)

        return `/${email}?${params.toString()}`
      },
      providesTags: ["Order"],
      serializeQueryArgs: ({ queryArgs }) => {
        const { email, status, period } = queryArgs
        return { email, status, period }
      },
      merge: (currentCache, newItems, { arg }) => {
        if (arg.page === 1) {
          return newItems
        }
        return {
          ...newItems,
          data: [...(currentCache.data || []), ...(newItems.data || [])],
        }
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg !== previousArg
      },
    }),
    getPendingLiveOrders: builder.query({
      query: (email) => `/pending/live?email=${encodeURIComponent(email)}`,
      providesTags: ["Order"],
    }),
  }),
})

export const {
  useGetAllOrdersQuery,
  useUpdateOrderStatusMutation,
  useGetActiveOrdersQuery,
  useGetOrdersWithPaginationQuery,
  useGetPendingLiveOrdersQuery,
} = ordersApi
