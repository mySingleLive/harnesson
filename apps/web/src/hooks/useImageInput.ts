import { useState, useCallback } from 'react';
import type { ImageAttachment } from '@harnesson/shared';

export interface PendingImage {
  id: string;
  previewUrl: string;     // Full data URL for <img> preview
  base64: string;         // Pure base64 data (no prefix)
  mediaType: string;      // MIME type
  name?: string;          // Original filename
}

export interface UseImageInputReturn {
  images: PendingImage[];
  addImages: (files: File[]) => void;
  handlePaste: (e: ClipboardEvent) => void;
  removeImage: (id: string) => void;
  clearImages: () => void;
  imageCount: number;
  toImageAttachments: () => ImageAttachment[];
}

function fileToPendingImage(file: File): Promise<PendingImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const match = dataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
      if (!match) {
        reject(new Error('Failed to parse image data URL'));
        return;
      }
      resolve({
        id: crypto.randomUUID(),
        previewUrl: dataUrl,
        base64: match[2],
        mediaType: match[1],
        name: file.name,
      });
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

export function useImageInput(): UseImageInputReturn {
  const [images, setImages] = useState<PendingImage[]>([]);

  const addImages = useCallback((files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    Promise.all(imageFiles.map(fileToPendingImage))
      .then((newImages) => {
        setImages((prev) => [...prev, ...newImages]);
      })
      .catch((err) => {
        console.error('Failed to process images:', err);
      });
  }, []);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length > 0) {
      addImages(files);
    }
  }, [addImages]);

  const removeImage = useCallback((id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }, []);

  const clearImages = useCallback(() => {
    setImages([]);
  }, []);

  const toImageAttachments = useCallback((): ImageAttachment[] => {
    return images.map((img) => ({
      id: img.id,
      base64: img.base64,
      mediaType: img.mediaType,
      name: img.name,
    }));
  }, [images]);

  return {
    images,
    addImages,
    handlePaste,
    removeImage,
    clearImages,
    imageCount: images.length,
    toImageAttachments,
  };
}
