// redux/slices/appointmentsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { appointmentsAPI } from '../../services/api';

// Async thunks
export const fetchAppointments = createAsyncThunk(
  'appointments/fetchAppointments',
  async (params, { rejectWithValue }) => {
    try {
      const response = await appointmentsAPI.getAppointments(params);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch appointments'
      );
    }
  }
);

export const fetchMyAppointments = createAsyncThunk(
  'appointments/fetchMyAppointments',
  async (params, { rejectWithValue }) => {
    try {
      const response = await appointmentsAPI.getMyAppointments(params);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch appointments'
      );
    }
  }
);

export const fetchAppointmentById = createAsyncThunk(
  'appointments/fetchAppointmentById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await appointmentsAPI.getAppointmentById(id);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch appointment'
      );
    }
  }
);

export const createAppointment = createAsyncThunk(
  'appointments/createAppointment',
  async (appointmentData, { rejectWithValue }) => {
    try {
      const response = await appointmentsAPI.createAppointment(appointmentData);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create appointment'
      );
    }
  }
);

export const updateAppointment = createAsyncThunk(
  'appointments/updateAppointment',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await appointmentsAPI.updateAppointment(id, data);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update appointment'
      );
    }
  }
);

export const updateAppointmentStatus = createAsyncThunk(
  'appointments/updateAppointmentStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await appointmentsAPI.updateAppointmentStatus(id, status);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update appointment status'
      );
    }
  }
);

export const deleteAppointment = createAsyncThunk(
  'appointments/deleteAppointment',
  async (id, { rejectWithValue }) => {
    try {
      await appointmentsAPI.deleteAppointment(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete appointment'
      );
    }
  }
);

// Initial state
const initialState = {
  appointments: [],
  myAppointments: [],
  currentAppointment: null,
  isLoading: false,
  error: null,
  totalCount: 0,
  filters: {
    search: '',
    status: 'all',
    dateRange: {
      start: null,
      end: null
    },
    doctor: 'all'
  }
};

// Appointments slice
const appointmentsSlice = createSlice({
  name: 'appointments',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentAppointment: (state) => {
      state.currentAppointment = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Appointments
      .addCase(fetchAppointments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAppointments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.appointments = action.payload.data || action.payload;
        state.totalCount = action.payload.totalCount || action.payload.length;
        state.error = null;
      })
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch My Appointments
      .addCase(fetchMyAppointments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyAppointments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myAppointments = action.payload.data || action.payload;
        state.error = null;
      })
      .addCase(fetchMyAppointments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Appointment By ID
      .addCase(fetchAppointmentById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAppointmentById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentAppointment = action.payload.data || action.payload;
        state.error = null;
      })
      .addCase(fetchAppointmentById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create Appointment
      .addCase(createAppointment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createAppointment.fulfilled, (state, action) => {
        state.isLoading = false;
        const newAppointment = action.payload.data || action.payload;
        state.appointments.push(newAppointment);
        state.myAppointments.push(newAppointment);
        state.error = null;
      })
      .addCase(createAppointment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update Appointment
      .addCase(updateAppointment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateAppointment.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedAppointment = action.payload.data || action.payload;
        
        // Update in appointments array
        const appointmentIndex = state.appointments.findIndex(a => a._id === updatedAppointment._id);
        if (appointmentIndex !== -1) {
          state.appointments[appointmentIndex] = updatedAppointment;
        }
        
        // Update in myAppointments array
        const myAppointmentIndex = state.myAppointments.findIndex(a => a._id === updatedAppointment._id);
        if (myAppointmentIndex !== -1) {
          state.myAppointments[myAppointmentIndex] = updatedAppointment;
        }
        
        // Update current appointment if it's the same
        if (state.currentAppointment && state.currentAppointment._id === updatedAppointment._id) {
          state.currentAppointment = updatedAppointment;
        }
        
        state.error = null;
      })
      .addCase(updateAppointment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update Appointment Status
      .addCase(updateAppointmentStatus.fulfilled, (state, action) => {
        const updatedAppointment = action.payload.data || action.payload;
        
        // Update in appointments array
        const appointmentIndex = state.appointments.findIndex(a => a._id === updatedAppointment._id);
        if (appointmentIndex !== -1) {
          state.appointments[appointmentIndex] = updatedAppointment;
        }
        
        // Update in myAppointments array
        const myAppointmentIndex = state.myAppointments.findIndex(a => a._id === updatedAppointment._id);
        if (myAppointmentIndex !== -1) {
          state.myAppointments[myAppointmentIndex] = updatedAppointment;
        }
      })
      // Delete Appointment
      .addCase(deleteAppointment.fulfilled, (state, action) => {
        state.appointments = state.appointments.filter(a => a._id !== action.payload);
        state.myAppointments = state.myAppointments.filter(a => a._id !== action.payload);
      });
  },
});

export const { clearError, clearCurrentAppointment, setFilters, clearFilters } = appointmentsSlice.actions;
export default appointmentsSlice.reducer;