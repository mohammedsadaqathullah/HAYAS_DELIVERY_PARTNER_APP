// src/redux/api/apiSlice.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import baseurl from '../baseurl';

export const deliveryPartnerDutyStatuApi = createApi({
  reducerPath: 'deliveryPartnerDutyStatuApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseurl}/delivery-status`, // replace with actual base URL
  }),
  endpoints: (builder) => ({
    updateDutyStatus: builder.mutation({
      query: (body) => ({
        url: '/update',
        method: 'POST',
        body,
      }),
    }),
    getDutyStatusByEmail: builder.query({
      query: (email) => `/${email}`,
    }),
  }),
});

export const {
  useUpdateDutyStatusMutation,
  useGetDutyStatusByEmailQuery,
} = deliveryPartnerDutyStatuApi;
