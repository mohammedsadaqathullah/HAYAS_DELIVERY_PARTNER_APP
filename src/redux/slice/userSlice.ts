import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Session {
  _id: string;
  dutyTrue: string;
  dutyFalse?: string;
  workingHours?: number;
}

interface StatusLog {
  _id: string;
  date: string;
  sessions: Session[];
}

interface Product {
  _id: string;
  title: string;
  quantityType: string;
  quantityOne: string;
  quantityTwo: string;
  count: number;
}

interface Address {
  _id: string;
  name: string;
  phone: string;
  street: string;
  area: string;
  defaultAddress: string;
}

interface StatusHistoryItem {
  _id?: string;
  email: string;
  status: string;
  updatedAt: string;
}

interface Order {
  _id: string;
  userEmail: string;
  products: Product[];
  address: Address;
  createdAt: string;
  status: string;
  statusHistory: StatusHistoryItem[];
  __v: number;
}

interface UserDetails {
  _id: string;
  name: string;
  parentName: string;
  phone: string;
  email: string;
  address: string;
  pincode: string;
  profileImage: string;
  aadhaarFront: string;
  aadhaarBack: string;
  dlFront: string;
  dlBack: string;
  status: string;
  createdAt: string;
  __v: number;
}

interface DutyStatus {
  _id: string;
  email: string;
  statusLog: StatusLog[];
  __v: number;
}

interface UserState {
  userDetails: UserDetails | null;
  dutyStatus: DutyStatus | null;
  orderHistory: Order[];
}

const initialState: UserState = {
  userDetails: null,
  dutyStatus: null,
  orderHistory: [],
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserDetails(state, action: PayloadAction<UserDetails>) {
      state.userDetails = action.payload;
    },
    setDutyStatus(state, action: PayloadAction<DutyStatus>) {
      state.dutyStatus = action.payload;
    },
    setOrderHistory(state, action: PayloadAction<Order[]>) {
      state.orderHistory = action.payload;
    },
    clearUser(state) {
      state.userDetails = null;
      state.dutyStatus = null;
      state.orderHistory = [];
    }
  },
});

export const { setUserDetails, setDutyStatus, setOrderHistory, clearUser } = userSlice.actions;
export default userSlice.reducer;
