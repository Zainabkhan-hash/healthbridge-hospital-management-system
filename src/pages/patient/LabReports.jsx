// pages/patient/LabReports.jsx
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Activity, Download, Calendar, User, Search, Loader2, FileText } from "lucide-react";
import { labReportsAPI } from "../../services/api";

const LabReports = () => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchLabReports();
  }, []);

  const fetchLabReports = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await labReportsAPI.getMyLabReports();
      
      if (response.success) {
        const reportsData = response.data || response;
        setReports(Array.isArray(reportsData) ? reportsData : [reportsData]);
        setFilteredReports(Array.isArray(reportsData) ? reportsData : [reportsData]);
      } else {
        setError(response.message || "Failed to fetch lab reports");
        // Fallback data
        const fallbackReports = getFallbackReports();
        setReports(fallbackReports);
        setFilteredReports(fallbackReports);
      }
    } catch (error) {
      console.error("Error fetching lab reports:", error);
      setError("Failed to load lab reports. Please try again.");
      const fallbackReports = getFallbackReports();
      setReports(fallbackReports);
      setFilteredReports(fallbackReports);
    } finally {
      setLoading(false);
    }
  };

  const getFallbackReports = () => [
    {
      _id: "1",
      testName: "Complete Blood Count (CBC)",
      labName: "Central Diagnostic Lab",
      testDate: new Date(Date.now() - 7 * 86400000).toISOString(),
      reportDate: new Date(Date.now() - 5 * 86400000).toISOString(),
      referredBy: "Dr. Ahmed Khan",
      status: "completed",
      notes: "All values within normal range",
      fileUrl: "#"
    },
    {
      _id: "2",
      testName: "Blood Glucose Test",
      labName: "Diabetes Care Center",
      testDate: new Date(Date.now() - 14 * 86400000).toISOString(),
      reportDate: new Date(Date.now() - 12 * 86400000).toISOString(),
      referredBy: "Dr. Sara Ahmed",
      status: "completed",
      notes: "Fasting blood sugar: 95 mg/dL",
      fileUrl: "#"
    },
    {
      _id: "3",
      testName: "Lipid Profile",
      labName: "Heart Health Lab",
      testDate: new Date(Date.now() - 3 * 86400000).toISOString(),
      reportDate: new Date().toISOString(),
      referredBy: "Dr. Usman Ali",
      status: "pending",
      notes: "Results expected in 24 hours",
      fileUrl: "#"
    }
  ];

  // Filter reports
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredReports(reports);
    } else {
      const filtered = reports.filter(report =>
        report.testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.labName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.status.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredReports(filtered);
    }
  }, [searchQuery, reports]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDownload = async (report) => {
    try {
      setDownloading(true);
      console.log("Download report:", report);
      
      // In a real app, this would download the actual file
      // For now, we'll simulate download
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert(`Downloading ${report.testName} report`);
    } catch (error) {
      console.error("Error downloading report:", error);
      alert("Failed to download report");
    } finally {
      setDownloading(false);
    }
  };

  const handleRefresh = () => {
    fetchLabReports();
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Lab Reports</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Your laboratory test results and reports</p>
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

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 lg:p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search lab reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
          />
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-gray-600 dark:text-gray-400">Loading lab reports...</span>
          </div>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400">
            <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No lab reports found</p>
            <p className="text-sm mt-1">
              {searchQuery 
                ? "Try adjusting your search criteria" 
                : "Your lab reports will appear here after laboratory tests"}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <div key={report._id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="p-4 lg:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{report.testName}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{report.labName}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    report.status === 'completed' 
                      ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                      : report.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {report.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>Test Date: {formatDate(report.testDate)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>Report Date: {formatDate(report.reportDate)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <User className="w-4 h-4" />
                    <span>Referred by: {report.referredBy}</span>
                  </div>
                </div>

                {report.notes && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>Notes:</strong> {report.notes}
                    </p>
                  </div>
                )}

                {report.results && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-4">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <strong>Results:</strong> {report.results}
                    </p>
                  </div>
                )}

                <button 
                  onClick={() => handleDownload(report)}
                  disabled={downloading || report.status !== 'completed'}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-300"
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

export default LabReports;