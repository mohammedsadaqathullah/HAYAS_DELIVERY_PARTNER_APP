import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import baseurl from '../baseurl';

interface RegisterPayload {
    name: string;
    parentName: string;
    email: string;
    phone: string;
    address: string;
    pincode: string;
    profileImage: string;
    dlFront: string;
    dlBack: string;
    aadhaarFront: string;
    aadhaarBack: string;
}

interface OTPVerifyPayload {
    email: string;
    otp: string;
}

interface DeliveryPartner {
    _id: string;
    name: string;
    parentName: string;
    email: string;
    phone: string;
    address: string;
    pincode: string;
    profileImage: string;
    dlFront: string;
    dlBack: string;
    aadhaarFront: string;
    aadhaarBack: string;
    status?: 'Pending' | 'Approved' | 'Rejected';
    createdAt: string;
    updatedAt: string;
}

export const deliveryPartnerRegisterApi = createApi({
    reducerPath: 'deliveryPartnerRegisterApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${baseurl}/delivery-partner`,
    }),
    tagTypes: ['DeliveryPartner'],
    endpoints: (builder) => ({
        registerDeliveryPartner: builder.mutation<{ message: string; user: DeliveryPartner }, RegisterPayload>({
            query: (body) => ({
                url: '/',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['DeliveryPartner'],
        }),

        sendOtp: builder.mutation<{ message: string }, string>({
            query: (email) => ({
                url: '/send-otp',
                method: 'POST',
                body: { email },
            }),
        }),

        verifyOtp: builder.mutation<{ message: string }, OTPVerifyPayload>({
            query: ({ email, otp }) => ({
                url: '/verify-otp',
                method: 'POST',
                body: { email, otp },
            }),
        }),

        getDeliveryPartners: builder.query<DeliveryPartner[], void>({
            query: () => '/',
            providesTags: ['DeliveryPartner'],
        }),

        getDeliveryPartnerByEmail: builder.mutation<DeliveryPartner, string>({
            query: (email) => ({
                url: '/by-email',
                method: 'POST',
                body: { email },
            }),
        }),

        updateDeliveryPartnerStatus: builder.mutation<
            { message: string; user: DeliveryPartner },
            { email: string; status: 'Approved' | 'Rejected' }
        >({
            query: ({ email, status }) => ({
                url: '/status',
                method: 'PATCH',
                body: { email, status },
            }),
            invalidatesTags: ['DeliveryPartner'],
        }),
    }),
});

export const {
    useRegisterDeliveryPartnerMutation,
    useSendOtpMutation,
    useVerifyOtpMutation,
    useGetDeliveryPartnersQuery,
    useGetDeliveryPartnerByEmailMutation,
    useUpdateDeliveryPartnerStatusMutation,
} = deliveryPartnerRegisterApi;
