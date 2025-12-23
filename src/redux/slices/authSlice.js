// redux/slices/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  userInfo: null,
  token: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      console.log("🔄 Setting credentials in Redux - Full payload:", action.payload);
      
      const { userInfo, token } = action.payload;
      
      if (userInfo) {
        state.userInfo = userInfo;
        state.token = token;
      } else {
        // Fallback: if payload is the user object directly
        state.userInfo = action.payload;
        state.token = action.payload.token;
      }
      
      console.log("✅ Redux state after update:", {
        userInfo: state.userInfo,
        token: state.token ? state.token.substring(0, 20) + "..." : null
      });
    },
    logout: (state) => {
      state.userInfo = null;
      state.token = null;
      localStorage.removeItem('userInfo');
      localStorage.removeItem('token');
      console.log("🗑️ User logged out from Redux");
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;