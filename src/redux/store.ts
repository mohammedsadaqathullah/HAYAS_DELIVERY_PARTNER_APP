// src/app/store.js
import { configureStore } from "@reduxjs/toolkit"

import { authApi } from "./Api/authApi"
import { DeliveryPartnersImagesApi } from "./Api/DeliveryPartnersImageApi"
import { deliveryPartnerRegisterApi } from "./Api/DeliveryPartnerRegisterApi"
import { deliveryPartnerDutyStatuApi } from "./Api/DeliveryPartnerDutyStatusApi"
import { ordersApi } from "./Api/ordersApi"
import { deliveryPartnerStatsApi } from "./Api/deliveryPartnerStatsApi"
import userReducer from "./slice/userSlice"
import { withdrawalApi } from "./Api/withdrawalApi"

export const store = configureStore({
  reducer: {
    // API reducers - these need the reducerPath as the key
    [authApi.reducerPath]: authApi.reducer,
    [DeliveryPartnersImagesApi.reducerPath]: DeliveryPartnersImagesApi.reducer,
    [deliveryPartnerRegisterApi.reducerPath]: deliveryPartnerRegisterApi.reducer,
    [deliveryPartnerDutyStatuApi.reducerPath]: deliveryPartnerDutyStatuApi.reducer,
    [ordersApi.reducerPath]: ordersApi.reducer,
    [withdrawalApi.reducerPath]: withdrawalApi.reducer,
    [deliveryPartnerStatsApi.reducerPath]: deliveryPartnerStatsApi.reducer, // Fixed this line

    // Regular reducers
    user: userReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      DeliveryPartnersImagesApi.middleware,
      deliveryPartnerRegisterApi.middleware,
      deliveryPartnerDutyStatuApi.middleware,
      ordersApi.middleware,
      withdrawalApi.middleware,
      deliveryPartnerStatsApi.middleware, // Added this middleware
    ),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
