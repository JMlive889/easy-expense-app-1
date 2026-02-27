import { useState } from 'react';

interface AvatarProps {
  name?: string | null;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

export default function Avatar({ name, avatarUrl, size = 'md' }: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-16 h-16 text-2xl',
  };

  const getInitial = () => {
    if (!name || name.trim() === '') return '?';
    return name.trim().charAt(0).toUpperCase();
  };

  if (avatarUrl && avatarUrl.trim() !== '' && !imageError) {
    return (
      <img
        src={avatarUrl}
        alt={name || 'User avatar'}
        className={`${sizeClasses[size]} rounded-full object-cover`}
        onError={(e) => {
          console.error('Avatar image failed to load:', avatarUrl?.substring(0, 100));
          setImageError(true);
        }}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gray-500 flex items-center justify-center text-white font-semibold`}
    >
      {getInitial()}
    </div>
  );
}
