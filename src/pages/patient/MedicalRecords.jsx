// pages/patient/MedicalRecords.jsx
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { FileText, Download, Calendar, User, Search, Filter, Loader2, Activity } from "lucide-react";
import { medicalRecordsAPI, patientsAPI } from "../../services/api";

const MedicalRecords = () => {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [error, setError] = useState("");
  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchMedicalRecords();
  }, []);

  const fetchMedicalRecords = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Try to fetch medical records from API
      const response = await medicalRecordsAPI.getMyRecords();
      
      if (response.success) {
        const recordsData = response.data || response;
        const mappedRecords = Array.isArray(recordsData) ? recordsData.map(record => ({
          _id: record._id,
          title: record.title || record.name || "Medical Record",
          date: record.date || record.createdAt || new Date().toISOString(),
          type: record.type || "Medical Report",
          doctor: record.doctorID?.name || record.doctorName || "Doctor",
          description: record.description || record.notes || "",
          fileUrl: record.fileUrl || record.attachmentUrl || "#",
          status: record.status || "completed",
          category: record.category || "general"
        })) : [];
        
        setRecords(mappedRecords);
        setFilteredRecords(mappedRecords);
      } else {
        setError(response.message || "Failed to fetch medical records");
        // Fallback data
        const fallbackRecords = await getFallbackRecords();
        setRecords(fallbackRecords);
        setFilteredRecords(fallbackRecords);
      }
    } catch (error) {
      console.error("Error fetching medical records:", error);
      setError("Failed to load medical records. Please try again.");
      const fallbackRecords = await getFallbackRecords();
      setRecords(fallbackRecords);
      setFilteredRecords(fallbackRecords);
    } finally {
      setLoading(false);
    }
  };

  const getFallbackRecords = async () => {
    try {
      // Try to get patient profile for personalized records
      const profileResponse = await patientsAPI.getMyProfile();
      const patientData = profileResponse.data || profileResponse;
      
      return [
        {
          _id: "1",
          title: "Initial Health Assessment",
          date: new Date().toISOString(),
          type: "Medical Report",
          doctor: "Dr. System Administrator",
          description: "Initial patient health assessment and registration",
          fileUrl: "#",
          status: "completed",
          category: "assessment"
        },
        {
          _id: "2",
          title: "Annual Physical Exam",
          date: new Date(Date.now() - 30 * 86400000).toISOString(),
          type: "Examination Report",
          doctor: patientData.doctor || "Dr. Demo",
          description: "Annual comprehensive physical examination",
          fileUrl: "#",
          status: "completed",
          category: "examination"
        },
        {
          _id: "3",
          title: "Vaccination Record",
          date: new Date(Date.now() - 60 * 86400000).toISOString(),
          type: "Immunization Record",
          doctor: "Health Department",
          description: "Complete vaccination history",
          fileUrl: "#",
          status: "completed",
          category: "immunization"
        }
      ];
    } catch (error) {
      console.error("Error fetching patient profile:", error);
      // Default fallback
      return [
        {
          _id: "1",
          title: "Initial Health Assessment",
          date: new Date().toISOString(),
          type: "Medical Report",
          doctor: "Dr. System Administrator",
          description: "Initial patient health assessment and registration",
          fileUrl: "#",
          status: "completed",
          category: "assessment"
        }
      ];
    }
  };

  // Filter records
  useEffect(() => {
    let filtered = records;

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(record => record.type.toLowerCase().includes(typeFilter.toLowerCase()));
    }

    // Search filter
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(record =>
        record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.doctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredRecords(filtered);
  }, [searchQuery, typeFilter, records]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTypeColor = (type) => {
    switch (type.toLowerCase()) {
      case "medical report":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400";
      case "examination report":
        return "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400";
      case "immunization record":
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400";
      case "lab report":
        return "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400";
      default:
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400";
    }
  };

  const handleDownload = async (record) => {
    try {
      setDownloading(true);
      console.log("Download record:", record);
      
      // In a real app, this would download the actual file
      // For now, we'll simulate download
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert(`Downloading ${record.title}`);
    } catch (error) {
      console.error("Error downloading record:", error);
      alert("Failed to download record");
    } finally {
      setDownloading(false);
    }
  };

  const handleRefresh = () => {
    fetchMedicalRecords();
  };

  const recordTypes = [...new Set(records.map(record => record.type).filter(Boolean))];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Medical Records</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Your complete medical history and reports</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="mt-4 lg:mt-0 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:text-zinc-50 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 flex items-center gap-2"
        >
          <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="text-sm font-medium">Refresh</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 lg:p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search medical records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 appearance-none"
            >
              <option value="all">All Types</option>
              {recordTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Records Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-gray-600 dark:text-gray-400">Loading medical records...</span>
          </div>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No medical records found</p>
            <p className="text-sm mt-1">
              {searchQuery || typeFilter !== 'all' 
                ? "Try adjusting your search criteria" 
                : "Your medical records will appear here after your first appointment"}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {filteredRecords.map((record) => (
            <div key={record._id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="p-4 lg:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      {record.type.toLowerCase().includes("lab") ? (
                        <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{record.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{record.type}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(record.type)}`}>
                    {record.type}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(record.date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <User className="w-4 h-4" />
                    <span>By: {record.doctor}</span>
                  </div>
                  {record.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-xs line-clamp-2">
                      {record.description}
                    </p>
                  )}
                </div>

                <button 
                  onClick={() => handleDownload(record)}
                  disabled={downloading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-300"
                >
                  {downloading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download Report
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicalRecords;