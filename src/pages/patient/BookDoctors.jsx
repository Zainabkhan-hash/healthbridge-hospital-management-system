// pages/patient/BookDoctors.jsx
import React, { useState, useEffect } from 'react';
import { Search, Filter, Stethoscope, MapPin, Star, Calendar, Clock, User, Loader2 } from 'lucide-react';
import { doctorsAPI, appointmentsAPI } from '../../services/api';
import { useSelector } from 'react-redux';

const BookDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('all');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [doctors, searchTerm, selectedSpecialization]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await doctorsAPI.getDoctors({ status: 'Available' });
      
      if (response.success) {
        const doctorsData = response.data || response;
        setDoctors(Array.isArray(doctorsData) ? doctorsData : [doctorsData]);
      } else {
        setError(response.message || 'Failed to fetch doctors');
        setDoctors(getFallbackDoctors());
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setError('Failed to load doctors. Please try again.');
      setDoctors(getFallbackDoctors());
    } finally {
      setLoading(false);
    }
  };

  const getFallbackDoctors = () => [
    {
      _id: '1',
      name: 'Dr. Ahmed Khan',
      specialization: 'Cardiologist',
      qualification: 'MBBS, FCPS',
      email: 'ahmed.khan@hospital.com',
      phone: '+92 300 1234567',
      experience: 15,
      location: 'Medical Center, Karachi',
      rating: 4.8,
      consultationFee: 1500,
      status: 'Available'
    },
    {
      _id: '2',
      name: 'Dr. Sara Ahmed',
      specialization: 'Pediatrician',
      qualification: 'MBBS, DCH',
      email: 'sara.ahmed@hospital.com',
      phone: '+92 301 2345678',
      experience: 12,
      location: 'Children Hospital, Lahore',
      rating: 4.7,
      consultationFee: 1200,
      status: 'Available'
    },
  ];

  const filterDoctors = () => {
    let filtered = doctors;

    if (searchTerm) {
      filtered = filtered.filter(doctor =>
        doctor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.qualification?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedSpecialization !== 'all') {
      filtered = filtered.filter(doctor => doctor.specialization === selectedSpecialization);
    }

    setFilteredDoctors(filtered);
  };

  const handleBookAppointment = async (doctor) => {
    if (!userInfo) {
      setError('Please login to book an appointment');
      return;
    }
    
    setSelectedDoctor(doctor);
    setShowBookingModal(true);
  };

  const confirmBooking = async () => {
    if (!bookingDate || !bookingTime) {
      setError('Please select date and time');
      return;
    }

    try {
      setBookingLoading(true);
      setError('');
      setSuccessMessage('');

      const appointmentData = {
        doctorId: selectedDoctor._id,
        doctorName: selectedDoctor.name,
        date: bookingDate,
        time: bookingTime,
        notes: bookingNotes,
        status: 'scheduled',
        patientId: userInfo.id,
        patientName: userInfo.name,
        consultationFee: selectedDoctor.consultationFee || 1500
      };

      const response = await appointmentsAPI.createAppointment(appointmentData);
      
      if (response.success) {
        setSuccessMessage('Appointment booked successfully!');
        setTimeout(() => {
          setShowBookingModal(false);
          resetBookingForm();
          fetchDoctors(); // Refresh doctors list
        }, 2000);
      } else {
        setError(response.message || 'Failed to book appointment');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      setError(error.message || 'Failed to book appointment. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const resetBookingForm = () => {
    setSelectedDoctor(null);
    setBookingDate('');
    setBookingTime('');
    setBookingNotes('');
    setError('');
    setSuccessMessage('');
  };

  const specializations = [...new Set(doctors.map(doc => doc.specialization).filter(Boolean))];
  const timeSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];

  // Get tomorrow's date for min booking date
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate());
    return tomorrow.toISOString().split('T')[0];
  };

  const handleRefresh = () => {
    fetchDoctors();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <div className="text-lg text-gray-600 dark:text-gray-400">Loading doctors...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Book Appointment</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Find and book appointments with our specialist doctors
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:text-zinc-50 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 flex items-center gap-2"
        >
          <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="text-sm font-medium">Refresh</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-green-700 dark:text-green-400">{successMessage}</p>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search doctors by name, specialization, or qualification..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={selectedSpecialization}
              onChange={(e) => setSelectedSpecialization(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Specializations</option>
              {specializations.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.map((doctor) => (
          <div
            key={doctor._id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-200"
          >
            {/* Doctor Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {doctor.name?.charAt(0) || 'D'}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {doctor.name || 'Unknown Doctor'}
                  </h3>
                  <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <Stethoscope className="w-3 h-3" />
                    {doctor.specialization || 'General Practitioner'}
                  </p>
                </div>
              </div>
            </div>

            {/* Doctor Details */}
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <User className="w-4 h-4" />
                <span>{doctor.qualification || 'Medical Doctor'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>{doctor.experience || '0'} years experience</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <MapPin className="w-4 h-4" />
                <span className="truncate">{doctor.location || 'Medical Center'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  Rating: {doctor.rating || '4.5'}/5
                </span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                  PKR {doctor.consultationFee || '1500'}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  doctor.status === 'Available' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                }`}>
                  {doctor.status || 'Available'}
                </span>
              </div>
            </div>

            {/* Book Button */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => handleBookAppointment(doctor)}
                disabled={doctor.status !== 'Available' || !userInfo}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors duration-200 font-medium"
              >
                {!userInfo ? 'Login to Book' : doctor.status === 'Available' ? 'Book Appointment' : 'Not Available'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredDoctors.length === 0 && !loading && (
        <div className="text-center py-12">
          <Stethoscope className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No doctors found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm || selectedSpecialization !== 'all'
              ? 'Try adjusting your search filters' 
              : 'No doctors are currently available'
            }
          </p>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Book Appointment
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                with Dr. {selectedDoctor.name}
              </p>
            </div>

            {/* Booking Form */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Appointment Date
                </label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  min={getTomorrowDate()}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Time Slot
                </label>
                <select
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a time slot</option>
                  {timeSlots.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  rows="3"
                  placeholder="Any specific concerns or notes for the doctor..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Consultation Fee:</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    PKR {selectedDoctor.consultationFee || '1500'}
                  </span>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <p className="text-green-700 dark:text-green-400 text-sm">{successMessage}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowBookingModal(false);
                  resetBookingForm();
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmBooking}
                disabled={!bookingDate || !bookingTime || bookingLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                {bookingLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Booking...
                  </>
                ) : (
                  'Confirm Booking'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      
    </div>
  );
};

export default BookDoctors;