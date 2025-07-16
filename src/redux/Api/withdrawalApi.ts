import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"

const WITHDRAWAL_API_URL = "https://hayas-backend.onrender.com/withdrawal"

export const withdrawalApi = createApi({
  reducerPath: "withdrawalApi", // Make sure this matches what you use in store
  baseQuery: fetchBaseQuery({ baseUrl: WITHDRAWAL_API_URL }),
  tagTypes: ["Withdrawal"],
  endpoints: (builder) => ({
    getWithdrawalHistory: builder.query({
      query: (email) => `/${email}`,
      providesTags: ["Withdrawal"],
    }),
    getAvailableEarnings: builder.query({
      query: (email) => `/${email}/available-earnings`,
      providesTags: ["Withdrawal"],
    }),
    requestWithdrawal: builder.mutation({
      query: ({ email, amount, orderIds }) => ({
        url: "/request",
        method: "POST",
        body: { email, amount, orderIds },
      }),
      invalidatesTags: ["Withdrawal"],
    }),
  }),
})

export const { useGetWithdrawalHistoryQuery, useGetAvailableEarningsQuery, useRequestWithdrawalMutation } =
  withdrawalApi
