// src/components/ImageUploader.tsx

import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';

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
        <motion.div 
          className="relative w-full h-64 rounded-2xl cursor-pointer overflow-hidden group"
          style={{
            background: 'linear-gradient(145deg, rgba(0, 20, 40, 0.6), rgba(0, 40, 60, 0.8))',
            border: '2px dashed rgba(0, 255, 170, 0.4)',
          }}
          whileHover={{ scale: 1.02 }}
          animate={{
            borderColor: selectedImage 
              ? ['rgba(0, 255, 170, 0.6)', 'rgba(0, 212, 255, 0.6)', 'rgba(0, 255, 170, 0.6)']
              : ['rgba(0, 255, 170, 0.3)', 'rgba(0, 255, 170, 0.6)', 'rgba(0, 255, 170, 0.3)'],
          }}
          transition={{
            borderColor: {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
        >
          {/* Pulsing glow effect */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle at center, rgba(0, 255, 170, 0.1), transparent 70%)',
            }}
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          <div className="relative z-10 flex items-center justify-center h-full">
            {selectedImage ? (
              <motion.img 
                src={selectedImage} 
                alt="Preview" 
                className="max-h-full max-w-full object-contain rounded-xl"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              />
            ) : (
              <motion.div 
                className="text-center"
                animate={{
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <motion.div
                  className="text-6xl mb-3"
                  animate={{
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  📸
                </motion.div>
                <p className="text-cyan-300 text-lg font-medium">Click to upload image</p>
                <p className="text-cyan-500/60 text-sm mt-2">or drag and drop</p>
              </motion.div>
            )}
          </div>

          {/* Corner accents */}
          {[
            { top: '10px', left: '10px' },
            { top: '10px', right: '10px' },
            { bottom: '10px', left: '10px' },
            { bottom: '10px', right: '10px' },
          ].map((pos, i) => (
            <motion.div
              key={i}
              className="absolute w-4 h-4"
              style={{
                ...pos,
                borderTop: i < 2 ? '2px solid #00ffaa' : 'none',
                borderBottom: i >= 2 ? '2px solid #00ffaa' : 'none',
                borderLeft: i % 2 === 0 ? '2px solid #00ffaa' : 'none',
                borderRight: i % 2 === 1 ? '2px solid #00ffaa' : 'none',
              }}
              animate={{
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      </label>
    </div>
  );
});

ImageUploader.displayName = 'ImageUploader';
export default ImageUploader;
