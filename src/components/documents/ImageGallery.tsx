import { useState } from 'react';
import { ZoomIn, ImageIcon } from 'lucide-react';

interface ImageGalleryProps {
  images: Array<{ url: string; name: string }>;
  onImageClick: (index: number) => void;
}

export function ImageGallery({ images, onImageClick }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const hasMultipleImages = images.length > 1;

  const handleThumbnailClick = (index: number) => {
    setSelectedIndex(index);
  };

  const handleMainImageClick = () => {
    onImageClick(selectedIndex);
  };

  if (images.length === 0) {
    return (
      <div className="w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <ImageIcon className="w-12 h-12 text-gray-400" />
      </div>
    );
  }

  const mainImage = images[selectedIndex];

  return (
    <div className="space-y-3">
      <div className="relative group">
        <div
          onClick={handleMainImageClick}
          className="relative w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden cursor-pointer"
        >
          <img
            src={mainImage.url}
            alt={mainImage.name}
            className="w-full h-full object-contain"
          />

          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 p-3 rounded-full">
              <ZoomIn className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {hasMultipleImages && (
          <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md">
            {selectedIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {hasMultipleImages && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => handleThumbnailClick(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                index === selectedIndex
                  ? 'border-blue-500 ring-2 ring-blue-500/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            >
              <img
                src={image.url}
                alt={`${image.name} - thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
