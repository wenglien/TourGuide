// Firebase Storage Service for Photo Uploads
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Upload a photo to Firebase Storage
 */
export async function uploadPhoto(
    file: File,
    userId: string,
    folder: 'checkins' | 'itineraries' = 'checkins',
    onProgress?: (progress: number) => void
): Promise<string> {
    try {
        // Create a unique filename
        const timestamp = Date.now();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `${folder}/${userId}/${timestamp}_${sanitizedName}`;
        const storageRef = ref(storage, filename);

        // Upload file
        if (onProgress) {
            onProgress(50);
        }
        await uploadBytes(storageRef, file);

        if (onProgress) {
            onProgress(90);
        }

        // Get download URL
        const downloadURL = await getDownloadURL(storageRef);
        
        if (onProgress) {
            onProgress(100);
        }
        
        return downloadURL;
    } catch (error) {
        console.error('Error uploading photo:', error);
        if (onProgress) {
            onProgress(0);
        }
        throw error;
    }
}

/**
 * Delete a photo from Firebase Storage
 */
export async function deletePhoto(photoURL: string): Promise<void> {
    try {
        // Extract the path from the URL
        const url = new URL(photoURL);
        const path = decodeURIComponent(url.pathname.split('/o/')[1]?.split('?')[0] || '');
        
        if (path) {
            const storageRef = ref(storage, path);
            await deleteObject(storageRef);
        }
    } catch (error) {
        console.error('Error deleting photo:', error);
        // Don't throw - photo deletion is not critical
    }
}

/**
 * Compress image before upload
 */
export function compressImage(file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Could not get canvas context'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name, {
                                type: file.type,
                                lastModified: Date.now(),
                            });
                            resolve(compressedFile);
                        } else {
                            reject(new Error('Compression failed'));
                        }
                    },
                    file.type,
                    quality
                );
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
}
