import { useState, useEffect } from 'react';
import { useSidebar } from './AdminLayout';
import BurgerIcon from '../../component/svg/BurgerIcon';
import { API_URL } from '../../config/api';

interface Feedback {
  feedback_id: number;
  feedback_message: string;
  timestamp: string;
  customer_id: string;
  firstname: string;
  lastname: string;
  email: string;
}

function AdminFeedbacks() {
  const { toggleSidebar } = useSidebar();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof Feedback>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const feedbacksPerPage = 10;
  
  // CSV Import Modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importModalType, setImportModalType] = useState<'error' | 'success' | 'warning'>('error');
  const [importModalTitle, setImportModalTitle] = useState('');
  const [importModalMessage, setImportModalMessage] = useState('');
  const [importDuplicates, setImportDuplicates] = useState<string[]>([]);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const exportToCSV = () => {
    if (filteredFeedbacks.length === 0) {
      alert('No feedbacks to export');
      return;
    }

    // CSV headers
    const headers = ['Feedback ID', 'Name', 'Email', 'Message', 'Timestamp'];
    
    // CSV rows
    const rows = filteredFeedbacks.map(feedback => [
      feedback.feedback_id,
      `${feedback.firstname} ${feedback.lastname}`,
      feedback.email,
      feedback.feedback_message.replace(/"/g, '""'), // Escape quotes
      formatDate(feedback.timestamp)
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `feedbacks_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        
        // Skip header row
        const dataLines = lines.slice(1).filter(line => line.trim());
        
        if (dataLines.length === 0) {
          setImportModalType('error');
          setImportModalTitle('Empty CSV File');
          setImportModalMessage('CSV file is empty or contains only headers.');
          setImportDuplicates([]);
          setShowImportModal(true);
          event.target.value = '';
          return;
        }
        
        // Parse CSV data (based on export format: Feedback ID, Name, Email, Message, Timestamp)
        const importedFeedbacks = dataLines.map(line => {
          // Handle quoted CSV values properly
          const values: string[] = [];
          let current = '';
          let inQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              values.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          values.push(current.trim());
          
          return {
            feedback_id: values[0] || '',
            name: values[1] || '',
            email: values[2] || '',
            feedback_message: values[3]?.replace(/""/g, '"') || '', // Unescape quotes
            timestamp: values[4] || '',
          };
        }).filter(fb => fb.email && fb.feedback_message); // Only include rows with essential data
        
        // Check for duplicates based on email, message content, and general timestamp match
        const duplicates: string[] = [];
        const newFeedbacks = importedFeedbacks.filter(importedFb => {
          const isDuplicate = feedbacks.some(existingFb => 
            existingFb.email.toLowerCase() === importedFb.email.toLowerCase() &&
            existingFb.feedback_message === importedFb.feedback_message
          );
          
          if (isDuplicate) {
            duplicates.push(`${importedFb.email} - "${importedFb.feedback_message.substring(0, 50)}..."`);
            return false;
          }
          return true;
        });
        
        // Build detailed message and show modal
        let message = `Total rows found: ${importedFeedbacks.length}\nNew feedbacks that can be imported: ${newFeedbacks.length}\nDuplicates (already exist): ${duplicates.length}`;
        
        if (duplicates.length > 0) {
          setImportModalType('error');
          setImportModalTitle('Duplicate Feedbacks Found');
          message += '\n\nThe following feedbacks already exist in the system and cannot be imported:';
          setImportModalMessage(message);
          setImportDuplicates(duplicates);
        } else if (newFeedbacks.length === 0) {
          setImportModalType('warning');
          setImportModalTitle('No New Feedbacks');
          setImportModalMessage('No new feedbacks to import. All feedbacks already exist in the system.');
          setImportDuplicates([]);
        } else {
          setImportModalType('success');
          setImportModalTitle('Import Preview');
          message += '\n\nNote: This is a preview. Actual import functionality needs to be implemented.';
          setImportModalMessage(message);
          setImportDuplicates([]);
        }
        
        setShowImportModal(true);
        console.log('Duplicate feedbacks:', duplicates);
        console.log('New feedbacks to import:', newFeedbacks);
        
        // Reset file input
        event.target.value = '';
      } catch (error) {
        console.error('Error parsing CSV:', error);
        setImportModalType('error');
        setImportModalTitle('CSV Parse Error');
        setImportModalMessage('Error parsing CSV file. Please check the format.\n\nExpected format: Feedback ID, Name, Email, Message, Timestamp');
        setImportDuplicates([]);
        setShowImportModal(true);
      }
    };
    reader.readAsText(file);
  };

  const fetchFeedbacks = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/feedback/all`);
      const data = await response.json();

      if (data.success) {
        setFeedbacks(data.feedbacks);
      } else {
        setError(data.message || 'Failed to load feedbacks');
      }
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
      setError('Failed to load feedbacks. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSort = (field: keyof Feedback) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredFeedbacks = feedbacks
    .filter(
      (feedback) =>
        feedback.firstname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feedback.lastname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feedback.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feedback.feedback_message.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

  // Pagination
  const indexOfLastFeedback = currentPage * feedbacksPerPage;
  const indexOfFirstFeedback = indexOfLastFeedback - feedbacksPerPage;
  const currentFeedbacks = filteredFeedbacks.slice(indexOfFirstFeedback, indexOfLastFeedback);
  const totalPages = Math.ceil(filteredFeedbacks.length / feedbacksPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const SortIcon = ({ field }: { field: keyof Feedback }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M5 12a1 1 0 102 0V6.414l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L5 6.414V12zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" />
        </svg>
      );
    }

    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
        <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h7a1 1 0 100-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
        <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h5a1 1 0 000-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM13 16a1 1 0 102 0v-5.586l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 101.414 1.414L13 10.414V16z" />
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Main Content */}
      <div className="p-4 md:p-6">
        {/* Mobile Menu Button */}
        <button
          onClick={toggleSidebar}
          className="md:hidden mb-4 p-2 rounded-lg hover:bg-gray-100 bg-white shadow-sm"
        >
          <BurgerIcon />
        </button>
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Header with buttons */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Feedbacks</h2>
            
            <div className="flex gap-2">
              <button
                onClick={fetchFeedbacks}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>

              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>

              <label className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 cursor-pointer">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Import CSV
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportCSV}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, email, or message..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading feedbacks...</p>
            </div>
          ) : filteredFeedbacks.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p className="mt-4 text-gray-600">
                {searchTerm ? 'No feedbacks match your search' : 'No feedbacks yet'}
              </p>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="mb-4 text-sm text-gray-600">
                Showing {indexOfFirstFeedback + 1}-{Math.min(indexOfLastFeedback, filteredFeedbacks.length)} of {filteredFeedbacks.length} feedbacks
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('feedback_id')}
                      >
                        <div className="flex items-center gap-2">
                          ID
                          <SortIcon field="feedback_id" />
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('firstname')}
                      >
                        <div className="flex items-center gap-2">
                          User
                          <SortIcon field="firstname" />
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('email')}
                      >
                        <div className="flex items-center gap-2">
                          Email
                          <SortIcon field="email" />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Feedback
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('timestamp')}
                      >
                        <div className="flex items-center gap-2">
                          Date
                          <SortIcon field="timestamp" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentFeedbacks.map((feedback) => (
                      <tr key={feedback.feedback_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          #{feedback.feedback_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {feedback.firstname} {feedback.lastname}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {feedback.email}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="max-w-md">
                            <p className="line-clamp-2">{feedback.feedback_message}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(feedback.timestamp)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex justify-center items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    Previous
                  </button>

                  <div className="flex space-x-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          className={`px-4 py-2 rounded-lg ${
                            currentPage === pageNumber
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-lg ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h2 className={`text-xl font-bold mb-4 ${
              importModalType === 'error' ? 'text-red-600' : 
              importModalType === 'warning' ? 'text-yellow-600' : 
              'text-green-600'
            }`}>
              {importModalTitle}
            </h2>
            <div className="text-gray-700 mb-4 whitespace-pre-line">
              {importModalMessage}
            </div>
            
            {importDuplicates.length > 0 && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg max-h-60 overflow-y-auto">
                <h3 className="font-semibold text-red-800 mb-2">Duplicate Feedbacks:</h3>
                <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                  {importDuplicates.slice(0, 20).map((feedback, index) => (
                    <li key={index}>{feedback}</li>
                  ))}
                  {importDuplicates.length > 20 && (
                    <li className="font-semibold">... and {importDuplicates.length - 20} more</li>
                  )}
                </ul>
              </div>
            )}
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowImportModal(false)}
                className={`px-6 py-2 rounded-lg transition-colors cursor-pointer ${
                  importModalType === 'error' ? 'bg-red-500 hover:bg-red-600 text-white' :
                  importModalType === 'warning' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' :
                  'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminFeedbacks;
