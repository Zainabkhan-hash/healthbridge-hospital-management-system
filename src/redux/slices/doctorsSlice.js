// redux/slices/doctorsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { doctorsAPI } from '../../services/api';

// Async thunks
export const fetchDoctors = createAsyncThunk(
  'doctors/fetchDoctors',
  async (params, { rejectWithValue }) => {
    try {
      const response = await doctorsAPI.getDoctors(params);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch doctors'
      );
    }
  }
);

export const fetchDoctorById = createAsyncThunk(
  'doctors/fetchDoctorById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await doctorsAPI.getDoctorById(id);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch doctor'
      );
    }
  }
);

export const createDoctor = createAsyncThunk(
  'doctors/createDoctor',
  async (doctorData, { rejectWithValue }) => {
    try {
      const response = await doctorsAPI.createDoctor(doctorData);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create doctor'
      );
    }
  }
);

export const updateDoctor = createAsyncThunk(
  'doctors/updateDoctor',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await doctorsAPI.updateDoctor(id, data);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update doctor'
      );
    }
  }
);

export const deleteDoctor = createAsyncThunk(
  'doctors/deleteDoctor',
  async (id, { rejectWithValue }) => {
    try {
      await doctorsAPI.deleteDoctor(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete doctor'
      );
    }
  }
);

// Initial state
const initialState = {
  doctors: [],
  currentDoctor: null,
  isLoading: false,
  error: null,
  totalCount: 0,
  filters: {
    search: '',
    specialization: 'all',
    status: 'active'
  }
};

// Doctors slice
const doctorsSlice = createSlice({
  name: 'doctors',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentDoctor: (state) => {
      state.currentDoctor = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Doctors
      .addCase(fetchDoctors.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDoctors.fulfilled, (state, action) => {
        state.isLoading = false;
        state.doctors = action.payload.data || action.payload;
        state.totalCount = action.payload.totalCount || action.payload.length;
        state.error = null;
      })
      .addCase(fetchDoctors.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Doctor By ID
      .addCase(fetchDoctorById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDoctorById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentDoctor = action.payload.data || action.payload;
        state.error = null;
      })
      .addCase(fetchDoctorById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create Doctor
      .addCase(createDoctor.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createDoctor.fulfilled, (state, action) => {
        state.isLoading = false;
        state.doctors.push(action.payload.data || action.payload);
        state.error = null;
      })
      .addCase(createDoctor.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update Doctor
      .addCase(updateDoctor.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateDoctor.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedDoctor = action.payload.data || action.payload;
        const index = state.doctors.findIndex(d => d._id === updatedDoctor._id);
        if (index !== -1) {
          state.doctors[index] = updatedDoctor;
        }
        if (state.currentDoctor && state.currentDoctor._id === updatedDoctor._id) {
          state.currentDoctor = updatedDoctor;
        }
        state.error = null;
      })
      .addCase(updateDoctor.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Delete Doctor
      .addCase(deleteDoctor.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteDoctor.fulfilled, (state, action) => {
        state.isLoading = false;
        state.doctors = state.doctors.filter(d => d._id !== action.payload);
        state.error = null;
      })
      .addCase(deleteDoctor.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearCurrentDoctor, setFilters } = doctorsSlice.actions;
export default doctorsSlice.reducer;