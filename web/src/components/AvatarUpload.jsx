import { useState, useRef } from 'react';
import { Camera, X, Upload, Loader2 } from 'lucide-react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function AvatarUpload({ currentPhoto, onUpload, employeeId, size = 'lg' }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentPhoto);
  const fileInputRef = useRef(null);
  const storage = getStorage();

  const sizeClasses = {
    sm: 'h-10 w-10',
    md: 'h-16 w-16',
    lg: 'h-32 w-32',
    xl: 'h-40 w-40'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-10 w-10'
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      // Create local preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Upload to Firebase Storage
      const storageRef = ref(storage, `employees/${employeeId || 'temp'}/profile-photo-${Date.now()}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      onUpload(downloadURL);
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Error uploading photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onUpload(null);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar Display */}
      <div className={`relative ${sizeClasses[size]} group`}>
        {preview ? (
          <>
            <img
              src={preview}
              alt="Profile"
              className={`${sizeClasses[size]} rounded-full object-cover border-4 border-white shadow-lg`}
            />
            {/* Hover Overlay */}
            <div className={`absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center ${uploading ? 'opacity-100' : ''}`}>
              {uploading ? (
                <Loader2 className={`${iconSizes[size]} text-white animate-spin`} />
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={triggerFileInput}
                    className="p-2 bg-white/20 hover:bg-white/40 rounded-full transition-colors"
                    title="Change photo"
                  >
                    <Camera className="h-4 w-4 text-white" />
                  </button>
                  <button
                    onClick={handleRemove}
                    className="p-2 bg-white/20 hover:bg-red-500/80 rounded-full transition-colors"
                    title="Remove photo"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <button
            onClick={triggerFileInput}
            disabled={uploading}
            className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 border-4 border-white shadow-lg flex items-center justify-center hover:from-blue-200 hover:to-indigo-200 transition-all disabled:opacity-50`}
          >
            {uploading ? (
              <Loader2 className={`${iconSizes[size]} text-blue-600 animate-spin`} />
            ) : (
              <Upload className={`${iconSizes[size]} text-blue-600`} />
            )}
          </button>
        )}

        {/* Online/Status Indicator (for larger sizes) */}
        {size !== 'sm' && (
          <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
        )}
      </div>

      {/* Upload Text */}
      {!preview && !uploading && (
        <div className="text-center">
          <p className="text-sm text-gray-600 font-medium">Click to upload photo</p>
          <p className="text-xs text-gray-400 mt-1">JPG, PNG up to 5MB</p>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
