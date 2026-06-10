import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';

const backendUrl =
  import.meta.env.VITE_BACKEND_URL ||
  (import.meta.env.VITE_API_URL || 'http://localhost:5050/api').replace(/\/api\/?$/, '');

const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  return `${backendUrl}${imagePath}`;
};

const Profile = () => {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');

  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState('');

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const currentImage = useMemo(() => {
    return previewImage || getImageUrl(user?.profileImage);
  }, [previewImage, user?.profileImage]);

  useEffect(() => {
    if (!user) return;

    setName(user.name || '');
    setDepartment(user.department || '');
    setEmail(user.email || '');
    setPhone(user.phone || '');
    setLocation(user.location || '');
  }, [user]);

  useEffect(() => {
    return () => {
      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  const clearMessages = () => {
    setMessage('');
    setError('');
  };

  const handleImageChange = (event) => {
    clearMessages();

    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      setError('Only JPG, PNG, and WEBP images are allowed.');
      event.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Image size must be less than 2MB.');
      event.target.value = '';
      return;
    }

    if (previewImage) {
      URL.revokeObjectURL(previewImage);
    }

    setSelectedImage(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const uploadProfileImage = async () => {
    clearMessages();

    if (!selectedImage) {
      setError('Please select an image first.');
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('profileImage', selectedImage);

      const res = await authService.updateProfilePhoto(formData);
      const updatedUser = res.data?.user;

      if (!updatedUser) {
        throw new Error('Invalid server response.');
      }

      updateUser(updatedUser);

      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }

      setSelectedImage(null);
      setPreviewImage('');
      setMessage('Profile picture updated successfully.');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to upload profile picture.'
      );
    } finally {
      setUploading(false);
    }
  };

  const deleteProfileImage = async () => {
    clearMessages();

    if (!user?.profileImage && !previewImage) {
      setError('No profile picture to delete.');
      return;
    }

    const confirmDelete = window.confirm('Delete your current profile picture?');

    if (!confirmDelete) return;

    try {
      setUploading(true);

      if (user?.profileImage) {
        const res = await authService.deleteProfilePhoto();
        const updatedUser = res.data?.user;

        if (!updatedUser) {
          throw new Error('Invalid server response.');
        }

        updateUser(updatedUser);
      }

      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }

      setSelectedImage(null);
      setPreviewImage('');
      setMessage('Profile picture deleted successfully.');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to delete profile picture.'
      );
    } finally {
      setUploading(false);
    }
  };

  const cancelSelectedImage = () => {
    clearMessages();

    if (previewImage) {
      URL.revokeObjectURL(previewImage);
    }

    setSelectedImage(null);
    setPreviewImage('');
  };

  const saveProfile = async () => {
    clearMessages();

    if (!name.trim()) {
      setError('Full name is required.');
      return;
    }

    if (!email.trim()) {
      setError('Email is required.');
      return;
    }

    try {
      setSaving(true);

      const res = await authService.updateProfile({
        name,
        email,
        department,
        phone,
        location,
      });

      const updatedUser = res.data?.user;

      if (!updatedUser) {
        throw new Error('Invalid server response.');
      }

      updateUser(updatedUser);
      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to update profile.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your personal details and profile picture.
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
          {message}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div>
            {currentImage ? (
              <img
                src={currentImage}
                alt={user?.name || 'Profile'}
                className="w-28 h-28 rounded-full object-cover border-4 border-indigo-100 shadow-sm"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-indigo-600 flex items-center justify-center border-4 border-indigo-100 shadow-sm">
                <span className="text-white font-bold text-4xl">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">
              {user?.name || 'User'}
            </h2>

            <p className="text-sm text-gray-500 capitalize">
              {user?.role || 'User'} · {user?.department || 'Department'}
            </p>

            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <label className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer text-sm font-medium text-gray-700 hover:bg-gray-50">
                Choose Image
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>

              <button
                onClick={uploadProfileImage}
                disabled={!selectedImage || uploading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
              >
                {uploading ? 'Uploading...' : selectedImage ? 'Save Picture' : 'Upload Picture'}
              </button>

              {selectedImage && (
                <button
                  onClick={cancelSelectedImage}
                  disabled={uploading}
                  className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-sm font-medium"
                >
                  Cancel
                </button>
              )}

              <button
                onClick={deleteProfileImage}
                disabled={uploading || (!user?.profileImage && !previewImage)}
                className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed text-sm font-medium"
              >
                Delete Picture
              </button>
            </div>

            <p className="text-xs text-gray-400 mt-2">
              Allowed formats: JPG, PNG, WEBP. Maximum size: 2MB.
            </p>

            {selectedImage && (
              <p className="text-xs text-indigo-600 mt-2">
                New image selected. Click Save Picture to update it.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Profile Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none"
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none"
              placeholder="Enter email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none"
              placeholder="Enter department"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <input
              value={user?.role || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-500 capitalize cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none"
              placeholder="+94 77 123 4567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none"
              placeholder="Colombo, Sri Lanka"
            />
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={saveProfile}
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
