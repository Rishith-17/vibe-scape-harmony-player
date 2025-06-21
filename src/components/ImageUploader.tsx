import React, { forwardRef } from 'react';

interface ImageUploaderProps {
  onImageSelect: (base64: string) => void;
  selectedImage: string | null;
}

const ImageUploader = forwardRef<HTMLInputElement, ImageUploaderProps>(
  ({ onImageSelect, selectedImage }, ref) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          onImageSelect(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    };

    return (
      <div className="space-y-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          ref={ref}
          className="text-white"
        />
        {selectedImage && (
          <img
            src={selectedImage}
            alt="Selected"
            className="rounded-lg shadow-lg max-h-64 object-contain mx-auto"
          />
        )}
      </div>
    );
  }
);

ImageUploader.displayName = 'ImageUploader';
export default ImageUploader;