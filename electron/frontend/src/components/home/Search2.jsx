import React, { useState } from 'react';
import { Camera, Upload, Search, CheckCircle, Folder, Image, Loader2, User, Type } from 'lucide-react';

export default function GraduationPhotoSystem() {
  const [step, setStep] = useState('search'); // search, processing, results
  const [searchMethod, setSearchMethod] = useState('photo'); // photo or text
  const [capturedImage, setCapturedImage] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');

  const handleImageCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSearch = () => {
    setStep('processing');
    
    // Simulate search processing
    setTimeout(() => {
      // Mock results
      setSearchResults({
        studentName: studentName || 'Juan Dela Cruz',
        studentId: studentId || '2024-12345',
        program: 'BS Computer Science',
        matchCount: 8,
        searchMethod: searchMethod,
        locations: [
          { folder: 'Batch 2024 / Engineering / Computer Science', count: 5 },
          { folder: 'Batch 2024 / Group Photos / CS Department', count: 3 }
        ],
        physicalLocation: 'Box #47 - Row C, Shelf 3'
      });
      setStep('results');
    }, 2500);
  };

  const handleReset = () => {
    setStep('search');
    setCapturedImage(null);
    setSearchResults(null);
    setStudentName('');
    setStudentId('');
  };

  const canSearch = () => {
    if (searchMethod === 'photo') {
      return capturedImage !== null;
    } else {
      return studentName.trim() !== '' || studentId.trim() !== '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gray-800 rounded-lg shadow-2xl p-6 mb-6 border border-gray-700">
          <h1 className="text-3xl font-bold text-white mb-2">Graduation Photo Claiming System</h1>
          <p className="text-gray-400">Quick photo identification and retrieval</p>
        </div>

        {/* Main Content */}
        <div className="bg-gray-800 rounded-lg shadow-2xl p-8 border border-gray-700">
          {step === 'search' && (
            <div>
              {/* Search Method Tabs */}
              <div className="flex gap-4 mb-8 justify-center">
                <button
                  onClick={() => setSearchMethod('photo')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                    searchMethod === 'photo'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <Camera className="w-5 h-5" />
                  Search by Photo
                </button>
                <button
                  onClick={() => setSearchMethod('text')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                    searchMethod === 'text'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <Type className="w-5 h-5" />
                  Search by Name/ID
                </button>
              </div>

              {/* Photo Search */}
              {searchMethod === 'photo' && (
                <div className="text-center">
                  <div className="mb-8">
                    <Camera className="w-16 h-16 mx-auto text-indigo-400 mb-4" />
                    <h2 className="text-2xl font-semibold text-white mb-2">Capture Student Photo</h2>
                    <p className="text-gray-400">Take or upload a clear photo of the student's face</p>
                  </div>

                  {!capturedImage ? (
                    <div className="border-4 border-dashed border-gray-600 rounded-lg p-12 hover:border-indigo-500 transition-colors">
                      <label htmlFor="photo-upload" className="cursor-pointer block">
                        <Upload className="w-12 h-12 mx-auto text-gray-500 mb-3" />
                        <p className="text-gray-300 mb-2">Click to upload or capture photo</p>
                        <p className="text-sm text-gray-500">Supports JPG, PNG files</p>
                        <input
                          id="photo-upload"
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleImageCapture}
                          className="hidden"
                        />
                      </label>
                    </div>
                  ) : (
                    <div>
                      <div className="mb-6">
                        <img
                          src={capturedImage}
                          alt="Captured student"
                          className="max-w-md mx-auto rounded-lg shadow-md border border-gray-600"
                        />
                      </div>
                      <div className="flex gap-4 justify-center">
                        <button
                          onClick={() => setCapturedImage(null)}
                          className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          Retake Photo
                        </button>
                        <button
                          onClick={handleSearch}
                          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors flex items-center gap-2"
                        >
                          <Search className="w-5 h-5" />
                          Search Photos
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Text Search */}
              {searchMethod === 'text' && (
                <div className="max-w-xl mx-auto">
                  <div className="mb-8 text-center">
                    <User className="w-16 h-16 mx-auto text-indigo-400 mb-4" />
                    <h2 className="text-2xl font-semibold text-white mb-2">Search by Name or ID</h2>
                    <p className="text-gray-400">Enter student name or ID to find their photos</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Student Name
                      </label>
                      <input
                        type="text"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder="e.g., Juan Dela Cruz"
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors text-lg"
                      />
                    </div>

                    <div className="text-center text-gray-500 font-medium">OR</div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Student ID
                      </label>
                      <input
                        type="text"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        placeholder="e.g., 2024-12345"
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors text-lg"
                      />
                    </div>

                    <button
                      onClick={handleSearch}
                      disabled={!canSearch()}
                      className={`w-full px-6 py-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                        canSearch()
                          ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                          : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <Search className="w-5 h-5" />
                      Search Photos
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'processing' && (
            <div className="text-center py-12">
              <Loader2 className="w-16 h-16 mx-auto text-indigo-400 mb-4 animate-spin" />
              <h2 className="text-2xl font-semibold text-white mb-2">Processing...</h2>
              <p className="text-gray-400">
                {searchMethod === 'photo' 
                  ? 'Scanning photo database for matches'
                  : 'Searching database for student records'
                }
              </p>
              <div className="mt-6 max-w-md mx-auto">
                <div className="bg-gray-700 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
                </div>
              </div>
            </div>
          )}

          {step === 'results' && searchResults && (
            <div>
              <div className="text-center mb-8">
                <CheckCircle className="w-16 h-16 mx-auto text-green-400 mb-4" />
                <h2 className="text-2xl font-semibold text-white mb-2">Photos Found!</h2>
                <p className="text-gray-400">Located {searchResults.matchCount} matching photos</p>
                <p className="text-sm text-gray-500 mt-1">
                  Search Method: {searchResults.searchMethod === 'photo' ? 'Facial Recognition' : 'Name/ID Search'}
                </p>
              </div>

              {/* Student Info Card */}
              <div className="bg-gray-700 rounded-lg p-6 mb-6 border border-gray-600">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-lg font-semibold text-white">Student Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Name</p>
                    <p className="font-medium text-gray-100">{searchResults.studentName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Student ID</p>
                    <p className="font-medium text-gray-100">{searchResults.studentId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Program</p>
                    <p className="font-medium text-gray-100">{searchResults.program}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Digital Locations */}
                <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
                  <div className="flex items-center gap-2 mb-4">
                    <Folder className="w-6 h-6 text-indigo-400" />
                    <h3 className="text-xl font-semibold text-white">Digital Locations</h3>
                  </div>
                  {searchResults.locations.map((loc, idx) => (
                    <div key={idx} className="bg-gray-800 rounded-lg p-4 mb-3 border border-gray-600">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Image className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-200">{loc.folder}</span>
                        </div>
                        <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                          {loc.count} photos
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Physical Location */}
                <div className="bg-amber-900 bg-opacity-30 rounded-lg p-6 border-2 border-amber-600">
                  <div className="flex items-center gap-2 mb-3">
                    <Folder className="w-6 h-6 text-amber-400" />
                    <h3 className="text-xl font-semibold text-white">Physical Location</h3>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
                    <p className="text-2xl font-bold text-amber-400">{searchResults.physicalLocation}</p>
                  </div>
                </div>

                <button
                  onClick={handleReset}
                  className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
                >
                  Process Next Student
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-gray-400 text-sm">
          <p>System Status: Connected • Database: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}