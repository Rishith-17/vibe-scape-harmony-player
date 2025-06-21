import React, { forwardRef } from 'react';

interface Props {
  onImageSelect: (image: string) => void;
  selectedImage: string | null;
}

const ImageUploader = forwardRef<HTMLInputElement, Props>(({ onImageSelect, selectedImage }, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        onImageSelect(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <input
        type="file"
        accept="image/*"
        onChange={handleChange}
        ref={ref}
        className="hidden"
        id="image-upload"
      />
      <label htmlFor="image-upload">
        <div className="w-full h-48 border-dashed border-2 border-gray-300 rounded flex items-center justify-center cursor-pointer">
          {selectedImage ? (
            <img src={selectedImage} alt="Preview" className="max-h-48" />
          ) : (
            <span>Click to Upload Image</span>
          )}
        </div>
      </label>
    </div>
  );
});

export default ImageUploader;
