import { useState } from 'react';

const backendUrl =
  import.meta.env.VITE_BACKEND_URL ||
  (import.meta.env.VITE_API_URL || 'http://localhost:5050/api').replace(/\/api\/?$/, '');

const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  return `${backendUrl}${imagePath}`;
};

const getInitials = (name = '') => {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U'
  );
};

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-10 h-10 text-sm',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-28 h-28 text-4xl',
};

const UserAvatar = ({ name, image, size = 'lg', className = '' }) => {
  const [imageFailed, setImageFailed] = useState(false);

  const imageUrl = !imageFailed ? getImageUrl(image) : '';
  const sizeClass = sizeClasses[size] || sizeClasses.lg;

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name || 'User'}
        onError={() => setImageFailed(true)}
        className={`${sizeClass} rounded-full object-cover border border-gray-200 flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold flex-shrink-0 ${className}`}
    >
      {getInitials(name)}
    </div>
  );
};

export default UserAvatar;
