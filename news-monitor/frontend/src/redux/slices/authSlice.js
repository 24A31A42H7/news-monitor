import { createSlice } from '@reduxjs/toolkit';

// Restore user and token from localStorage
const user = JSON.parse(localStorage.getItem('nm_user') || 'null');
const accessToken = localStorage.getItem('nm_accessToken');

const initialState = {
  user,
  accessToken,
  isAuthenticated: !!accessToken,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action) {
      const { user, accessToken } = action.payload;

      state.user = user;
      state.accessToken = accessToken;
      state.isAuthenticated = true;

      // Save user and token
      localStorage.setItem('nm_user', JSON.stringify(user));
      localStorage.setItem('nm_accessToken', accessToken);
    },

    setAccessToken(state, action) {
      state.accessToken = action.payload;
      state.isAuthenticated = true;

      localStorage.setItem('nm_accessToken', action.payload);
    },

    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;

      localStorage.removeItem('nm_user');
      localStorage.removeItem('nm_accessToken');
    },
  },
});

export const { setCredentials, setAccessToken, logout } = authSlice.actions;
export default authSlice.reducer;