import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js to always download models
env.allowLocalModels = false;
env.useBrowserCache = false;

const MAX_IMAGE_DIMENSION = 1024;

function resizeImageIfNeeded(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, image: HTMLImageElement) {
  let width = image.naturalWidth;
  let height = image.naturalHeight;

  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    if (width > height) {
      height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
      width = MAX_IMAGE_DIMENSION;
    } else {
      width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
      height = MAX_IMAGE_DIMENSION;
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);
    return true;
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0);
  return false;
}

export const removeBackground = async (imageElement: HTMLImageElement): Promise<Blob> => {
  try {
    console.log('Starting advanced background removal process...');
    
    // Create canvas for processing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Could not get canvas context');
    
    // Set canvas size to image dimensions
    canvas.width = imageElement.naturalWidth;
    canvas.height = imageElement.naturalHeight;
    ctx.drawImage(imageElement, 0, 0);
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Advanced background removal algorithm
    // Remove white/light backgrounds and preserve colorful brain elements
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Calculate luminance and color intensity
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
      const colorIntensity = Math.max(Math.abs(r - g), Math.abs(r - b), Math.abs(g - b));
      
      // More aggressive background removal
      // Remove pixels that are:
      // 1. Very bright (white/light backgrounds)
      // 2. Have low color variation (gray/white areas)
      // 3. Near the edges (likely background)
      const pixelIndex = i / 4;
      const x = pixelIndex % canvas.width;
      const y = Math.floor(pixelIndex / canvas.width);
      const isNearEdge = x < 10 || x > canvas.width - 10 || y < 10 || y > canvas.height - 10;
      
      if (
        luminance > 200 || // Very bright pixels
        (luminance > 150 && colorIntensity < 30) || // Light gray areas
        (luminance > 180 && isNearEdge) || // Light pixels near edges
        (r > 240 && g > 240 && b > 240) // Almost white pixels
      ) {
        data[i + 3] = 0; // Make transparent
      } else if (luminance > 120 && colorIntensity < 20) {
        // Semi-transparent for borderline cases
        data[i + 3] = Math.max(0, data[i + 3] - 150);
      }
    }
    
    // Apply the processed image data
    ctx.putImageData(imageData, 0, 0);
    
    console.log('Advanced background removal completed');
    
    // Convert canvas to blob
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            console.log('Successfully created transparent PNG');
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/png',
        1.0
      );
    });
  } catch (error) {
    console.error('Error in advanced background removal:', error);
    throw error;
  }
};

export const loadImage = (file: Blob): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

export const processLogoBackground = async (imageSrc: string): Promise<string> => {
  try {
    // Load the image
    const response = await fetch(imageSrc);
    const blob = await response.blob();
    const imageElement = await loadImage(blob);
    
    // Remove background
    const processedBlob = await removeBackground(imageElement);
    
    // Convert to data URL
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(processedBlob);
    });
  } catch (error) {
    console.error('Error processing logo background:', error);
    return imageSrc; // Return original if processing fails
  }
};
