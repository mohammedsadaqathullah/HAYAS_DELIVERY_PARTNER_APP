import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import baseurl from '../baseurl';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseurl}/delivery-partner/auth`,
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  endpoints: (builder) => ({
    sendOtp: builder.mutation({
      query: (email) => ({
        url: '/send-otp',
        method: 'POST',
        body: { email },
      }),
    }),
    verifyOtp: builder.mutation({
      query: ({ email, otp }) => ({
        url: '/verify-otp',
        method: 'POST',
        body: { email, otp },
      }),
    }),
  }),
});

export const { useSendOtpMutation, useVerifyOtpMutation } = authApi;
