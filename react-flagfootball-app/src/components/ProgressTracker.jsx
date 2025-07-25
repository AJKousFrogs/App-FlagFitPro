import React, { useState, useRef, useEffect } from 'react';
// Removed direct import - will use dynamic import when needed
import { useNeonDatabase } from '../contexts/NeonDatabaseContext';
import FileUploadZone from './FileUploadZone';

const ProgressTracker = ({ onBack }) => {
  const { user } = useNeonDatabase();
  const [photos, setPhotos] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('form');
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [comparison, setComparison] = useState({ before: null, after: null });
  const [showComparison, setShowComparison] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const photoCategories = [
    { id: 'form', name: 'Form Check', icon: '🏃', description: 'Running and movement form' },
    { id: 'physique', name: 'Physique', icon: '💪', description: 'Body composition progress' },
    { id: 'flexibility', name: 'Flexibility', icon: '🧘', description: 'Range of motion and mobility' },
    { id: 'achievements', name: 'Achievements', icon: '🏆', description: 'Celebration and milestone photos' }
  ];

  // Sample progress data
  const samplePhotos = [
    {
      id: 1,
      category: 'form',
      date: new Date('2024-06-01'),
      title: 'Sprint Form - Week 1',
      notes: 'Initial form check - notice knee drive needs improvement',
      url: '/images/progress/form-week1.jpg'
    },
    {
      id: 2,
      category: 'form',
      date: new Date('2024-07-01'),
      title: 'Sprint Form - Week 5',
      notes: 'Much better knee drive and arm positioning!',
      url: '/images/progress/form-week5.jpg'
    },
    {
      id: 3,
      category: 'physique',
      date: new Date('2024-06-01'),
      title: 'Starting Point',
      notes: 'Beginning of training program',
      url: '/images/progress/physique-start.jpg'
    },
    {
      id: 4,
      category: 'achievements',
      date: new Date('2024-07-15'),
      title: 'First 40-yard dash under 5 seconds!',
      notes: 'Finally broke the 5-second barrier - 4.97s!',
      url: '/images/progress/achievement-40yard.jpg'
    }
  ];

  useEffect(() => {
    loadUserPhotos();
  }, [user, selectedCategory]);

  const loadUserPhotos = async () => {
    if (!user?.id) return;
    
    try {
      const userPhotos = await fileUploadService.getUserProgressPhotos(user.id, selectedCategory);
      setPhotos(userPhotos);
    } catch (error) {
      console.error('Failed to load photos:', error);
      // Fallback to sample photos for demo
      setPhotos(samplePhotos.filter(photo => photo.category === selectedCategory));
    }
  };

  // Camera functionality
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setShowCamera(true);
    } catch (error) {
      console.error('Camera access denied:', error);
      // Fallback to file input
      fileInputRef.current?.click();
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const photoData = canvas.toDataURL('image/jpeg');
    setCapturedPhoto(photoData);
    stopCamera();
  };

  const stopCamera = () => {
    const video = videoRef.current;
    if (video && video.srcObject) {
      const stream = video.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      video.srcObject = null;
    }
    setShowCamera(false);
  };

  const savePhoto = async (photoData, title, notes) => {
    if (!user?.id) {
      console.error('User not authenticated');
      return;
    }

    setIsUploading(true);
    
    try {
      // Convert data URL to File
      const response = await fetch(photoData);
      const blob = await response.blob();
      const file = new File([blob], `progress-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });

      const metadata = {
        userId: user.id,
        title: title || `${photoCategories.find(c => c.id === selectedCategory)?.name} - ${new Date().toLocaleDateString()}`,
        category: selectedCategory,
        notes: notes || '',
        tags: []
      };

      const result = await fileUploadService.uploadProgressPhoto(file, metadata);
      
      if (result.success) {
        // Add to local state
        const newPhoto = {
          ...result.record,
          photoUrl: result.fileUrl
        };
        setPhotos(prev => [newPhoto, ...prev]);
        setCapturedPhoto(null);
      } else {
        console.error('Upload failed:', result.error);
      }
    } catch (error) {
      console.error('Failed to save photo:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedPhoto(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredPhotos = photos.filter(photo => photo.category === selectedCategory);

  const getPhotosByDate = () => {
    return filteredPhotos.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const setUpComparison = (photo) => {
    if (!comparison.before) {
      setComparison({ before: photo, after: null });
    } else if (!comparison.after && photo.id !== comparison.before.id) {
      setComparison(prev => ({ ...prev, after: photo }));
      setShowComparison(true);
    } else {
      setComparison({ before: photo, after: null });
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-blue-200 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Training</span>
          </button>
          <div className="flex space-x-3">
            <button
              onClick={startCamera}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Take Photo</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>Upload</span>
            </button>
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-2">Progress Tracker</h1>
        <p className="text-blue-200 mb-6">Document your training journey with photos and track your improvements</p>

        {/* Category Tabs */}
        <div className="flex space-x-2 mb-6 bg-white/10 rounded-lg p-1">
          {photoCategories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="text-lg">{category.icon}</span>
              <span className="font-semibold">{category.name}</span>
            </button>
          ))}
        </div>

        {/* Camera Modal */}
        {showCamera && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-2xl p-6 max-w-lg w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Take Progress Photo</h3>
                <button
                  onClick={stopCamera}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <video
                ref={videoRef}
                className="w-full rounded-lg mb-4"
                autoPlay
                playsInline
              />
              <button
                onClick={capturePhoto}
                className="w-full bg-green-600 hover:bg-green-700 py-3 rounded-lg font-semibold transition-colors"
              >
                Capture Photo
              </button>
            </div>
          </div>
        )}

        {/* Photo Capture Modal */}
        {capturedPhoto && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-2xl p-6 max-w-lg w-full">
              <h3 className="text-xl font-bold mb-4">Save Progress Photo</h3>
              <img
                src={capturedPhoto}
                alt="Captured"
                className="w-full rounded-lg mb-4"
              />
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Photo title..."
                  className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-gray-300 border border-white/30"
                  id="photoTitle"
                />
                <textarea
                  placeholder="Notes (optional)..."
                  className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-gray-300 border border-white/30 resize-none"
                  rows="3"
                  id="photoNotes"
                />
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      const title = document.getElementById('photoTitle').value;
                      const notes = document.getElementById('photoNotes').value;
                      savePhoto(capturedPhoto, title, notes);
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Save Photo
                  </button>
                  <button
                    onClick={() => setCapturedPhoto(null)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Retake
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comparison Modal */}
        {showComparison && comparison.before && comparison.after && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-2xl p-6 max-w-4xl w-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">Progress Comparison</h3>
                <button
                  onClick={() => setShowComparison(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold mb-2 text-blue-300">Before</h4>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="w-full h-64 bg-gray-700 rounded-lg mb-3 flex items-center justify-center">
                      <span className="text-gray-400">Photo: {comparison.before.title}</span>
                    </div>
                    <p className="text-sm text-gray-300">{formatDate(comparison.before.date)}</p>
                    <p className="text-sm text-gray-400 mt-1">{comparison.before.notes}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold mb-2 text-green-300">After</h4>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="w-full h-64 bg-gray-700 rounded-lg mb-3 flex items-center justify-center">
                      <span className="text-gray-400">Photo: {comparison.after.title}</span>
                    </div>
                    <p className="text-sm text-gray-300">{formatDate(comparison.after.date)}</p>
                    <p className="text-sm text-gray-400 mt-1">{comparison.after.notes}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <div className="bg-green-600/20 border border-green-400 rounded-lg p-4">
                  <p className="text-green-300 font-semibold">
                    Progress Duration: {Math.round((new Date(comparison.after.date) - new Date(comparison.before.date)) / (1000 * 60 * 60 * 24))} days
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Photo Grid */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">
              {photoCategories.find(c => c.id === selectedCategory)?.name} Progress
            </h2>
            {comparison.before && !comparison.after && (
              <div className="bg-blue-600/20 border border-blue-400 rounded-lg px-4 py-2">
                <span className="text-blue-300 text-sm">Select a second photo to compare</span>
              </div>
            )}
          </div>

          {filteredPhotos.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📸</div>
              <h3 className="text-xl font-bold mb-2">No photos yet</h3>
              <p className="text-blue-200 mb-4">Start documenting your progress by taking your first photo!</p>
              <button
                onClick={startCamera}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Take First Photo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getPhotosByDate().map(photo => (
                <div
                  key={photo.id}
                  onClick={() => setUpComparison(photo)}
                  className={`bg-white/10 rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-105 ${
                    comparison.before?.id === photo.id ? 'ring-2 ring-blue-400' : ''
                  } ${
                    comparison.after?.id === photo.id ? 'ring-2 ring-green-400' : ''
                  }`}
                >
                  <div className="w-full h-48 bg-gray-700 flex items-center justify-center overflow-hidden rounded-t-lg">
                    {photo.photoUrl || photo.url ? (
                      <img
                        src={photo.photoUrl || photo.url}
                        alt={photo.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-gray-400">📷 {photo.title}</span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-1">{photo.title}</h3>
                    <p className="text-sm text-blue-200 mb-2">{formatDate(photo.date)}</p>
                    {photo.notes && (
                      <p className="text-sm text-gray-300">{photo.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* File Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">Upload Progress Photos</h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-3 rounded-lg bg-white/20 text-white border border-white/30 focus:ring-2 focus:ring-blue-500"
                >
                  {photoCategories.map(category => (
                    <option key={category.id} value={category.id} className="bg-gray-800">
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <FileUploadZone
                accept="image/*"
                multiple={false}
                maxSize={5 * 1024 * 1024} // 5MB
                onUploadStart={(files) => {
                  setIsUploading(true);
                  setUploadProgress(0);
                }}
                onUploadProgress={(progress) => {
                  setUploadProgress(progress);
                }}
                onUploadComplete={async (results) => {
                  if (results.length > 0 && results[0].success) {
                    const fileData = results[0].data;
                    
                    // Show title/notes input modal
                    const title = prompt('Photo title (optional):') || '';
                    const notes = prompt('Notes (optional):') || '';

                    if (!user?.id) {
                      console.error('User not authenticated');
                      setIsUploading(false);
                      return;
                    }

                    try {
                      const metadata = {
                        userId: user.id,
                        title: title || `${photoCategories.find(c => c.id === selectedCategory)?.name} - ${new Date().toLocaleDateString()}`,
                        category: selectedCategory,
                        notes: notes,
                        tags: []
                      };

                      const result = await fileUploadService.uploadProgressPhoto(fileData.file, metadata);
                      
                      if (result.success) {
                        const newPhoto = {
                          ...result.record,
                          photoUrl: result.fileUrl
                        };
                        setPhotos(prev => [newPhoto, ...prev]);
                        setShowUploadModal(false);
                      } else {
                        console.error('Upload failed:', result.error);
                        alert('Upload failed: ' + result.error);
                      }
                    } catch (error) {
                      console.error('Upload error:', error);
                      alert('Upload failed. Please try again.');
                    }
                  }
                  setIsUploading(false);
                }}
                onUploadError={(errors) => {
                  console.error('Upload errors:', errors);
                  alert('Upload failed: ' + errors.join(', '));
                  setIsUploading(false);
                }}
                disabled={isUploading}
                className="mb-6"
              >
                <div className="text-center p-8">
                  <div className="text-4xl mb-4">📸</div>
                  <div className="text-lg font-medium mb-2">
                    Drop your progress photo here
                  </div>
                  <div className="text-sm text-gray-300 mb-4">
                    or click to select from your device
                  </div>
                  <div className="text-xs text-gray-400">
                    Supports JPEG, PNG, WebP • Max 5MB
                  </div>
                </div>
              </FileUploadZone>

              {isUploading && (
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Uploading...</span>
                    <span className="text-sm">{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default ProgressTracker;