import { WebPlugin } from '@capacitor/core';

import type { FullMediaItem, GalleryPlusPlugin, MediaItem } from './definitions';



export class GalleryPlusWeb extends WebPlugin implements GalleryPlusPlugin {
    async checkPermissions(): Promise<{ status: string }> {
        console.warn('checkPermissions is not required on web.');
        return { status: 'granted' };
    }

    async requestPermissions(): Promise<{ status: string }> {
        console.warn('requestPermissions is not required on web.');
        return { status: 'granted' };
    }

    private _mediaList = new Map();
 
    async getMediaList(
        options: {
            sort?: 'newest' | 'oldest';
            includeDetails?: boolean;
            includeBaseColor?: boolean;
        } = {}
    ): Promise<{ media: MediaItem[] }> {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.setAttribute('webkitdirectory', '');
            input.setAttribute('multiple', '');
            input.style.display = 'none';
    
            input.addEventListener('change', async (event: Event) => {
                const target = event.target as HTMLInputElement;
                if (!target.files) {
                    reject(new Error('No files selected'));
                    return;
                }
    
                try {
                    this._mediaList = new Map();
                    const mediaArray: MediaItem[] = [];
    
                    for (const file of (target as any).files) {
                        if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
                            const path: string = URL.createObjectURL(file);
                            const mediaItem: MediaItem = {
                                id: file.name,
                                name: file.name,
                                type: file.type.startsWith('image/') ? 'image' : 'video',
                                createdAt: file.lastModified,
                                fileSize: file.size,
                                mimeType: file.type,
                                thumbnail: await this.generateImageThumbnailFast(file, 200, 0.8)
                            };
    
                            this._mediaList.set(file.name, mediaItem);
    
                            if (file.type.startsWith('image/')) {
                                if (options.includeDetails) {
                                    await this.getImageDimensions(path).then((dimensions) => {
                                        mediaItem.width = dimensions.width;
                                        mediaItem.height = dimensions.height;
                                    });
                                }
    
                                if (options.includeBaseColor) {
                                    await this.getDominantColor(path).then((baseColor) => {
                                        mediaItem.baseColor = baseColor;
                                    });
                                }
                            } else if (file.type.startsWith('video/')) {
                                if (options.includeDetails) {
                                    await this.getVideoDimensions(path).then((dimensions) => {
                                        mediaItem.width = dimensions.width;
                                        mediaItem.height = dimensions.height;
                                    });
                                }
                            }
    
                            mediaArray.push(mediaItem);
                        }
                    }
    
                    mediaArray.sort((a, b) =>
                        options.sort === 'oldest'
                            ? Number(a.createdAt) - Number(b.createdAt)
                            : Number(b.createdAt) - Number(a.createdAt)
                    );
    
                    console.log('list', this._mediaList);
                    resolve({ media: mediaArray });
                } catch (err) {
                    console.error('Error processing files:', err);
                    reject(err);
                }
            });
    
            document.body.appendChild(input);
            input.click();
            document.body.removeChild(input);
        });
    }
    
    async getMedia(
        options: {
            id: string;
            includeDetails?: boolean;
            includeBaseColor?: boolean;
            generatePath?: boolean;
        }
    ): Promise<FullMediaItem> {
        try {
            const mediaItem = this._mediaList.get(options.id);

            if (mediaItem.type === 'image') {
                if (options.includeDetails) {
                    await this.getImageDimensions(mediaItem.path).then(
                        (dimensions) => {
                            mediaItem.width = dimensions.width;
                            mediaItem.height = dimensions.height;
                        }
                    );
                }

                if (options.includeBaseColor) {
                    await this.getDominantColor(mediaItem.path).then(
                        (baseColor) => {
                            mediaItem.baseColor = baseColor;
                        }
                    );
                }
            } else if (mediaItem.type === 'video') {

                if (options.includeDetails) {
                    await this.getVideoDimensions(mediaItem.path).then(
                        (dimensions) => {
                            mediaItem.width = dimensions.width;
                            mediaItem.height = dimensions.height;
                        }
                    );
                }
            }
        
            return mediaItem;
        } catch (err) {
            console.error("Error in getMedia:", err);
            throw new Error("Failed to retrieve media.");
        }
    }

    private async generateImageThumbnailFast(
        file: File,
        maxSize = 200,
        quality = 0.8
    ): Promise<string> {
        const imgBitmap = await createImageBitmap(file);
    
        let width = imgBitmap.width;
        let height = imgBitmap.height;
    
        if (width > height) {
            height = Math.round((height / width) * maxSize);
            width = maxSize;
        } else {
            width = Math.round((width / height) * maxSize);
            height = maxSize;
        }
    
        if ("OffscreenCanvas" in window) {
            const canvas = new OffscreenCanvas(width, height);
            const ctx = canvas.getContext("2d", { alpha: true })!; // Transparenz aktivieren
            ctx.clearRect(0, 0, width, height); // Hintergrund löschen
            ctx.drawImage(imgBitmap, 0, 0, width, height);
    
            const blob = await canvas.convertToBlob({ type: "image/webp", quality });
            return URL.createObjectURL(blob);
        } else {
            return "";
        }
    }
    
    
    

    private async getImageDimensions(
        path: string
    ): Promise<{ width: number; height: number }> {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () =>
                resolve({ width: img.width, height: img.height });
            img.src = path;
        });
    }

    private async getVideoDimensions(path: string): Promise<{ width: number; height: number }> {
        return new Promise((resolve, reject) => {
            const video = document.createElement("video");
            video.src =  path;
    
            video.onloadedmetadata = () => resolve({ width: video.videoWidth, height: video.videoHeight });
            video.onerror = () => reject("Failed to load video");
        });
    }

    private async getDominantColor(path: string): Promise<string> {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 1;
                canvas.height = 1;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, 1, 1);
                    const pixel = ctx.getImageData(0, 0, 1, 1).data;
                    resolve(
                        `#${pixel[0].toString(16).padStart(2, '0')}${pixel[1]
                            .toString(16)
                            .padStart(2, '0')}${pixel[2]
                            .toString(16)
                            .padStart(2, '0')}`
                    );
                } else {
                    resolve('#000000');
                }
            };
            img.src = path;
        });
    }

   /* private async generateVideoThumbnailURL(file: File): Promise<string> {
        return new Promise((resolve) => {
            const video = document.createElement("video");
            video.src = URL.createObjectURL(file);
            video.muted = true;
            video.crossOrigin = "anonymous";
    
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d")!;
    
            video.requestVideoFrameCallback(() => {
                canvas.width = 200;
                canvas.height = 200;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => {
                    resolve(blob ? URL.createObjectURL(blob) : '');
                }, "image/jpeg", 0.8);
            });
    
            video.play();
        });
    }*/
    
}
