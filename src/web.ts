import { WebPlugin } from '@capacitor/core';

import type { FullMediaItem, GalleryPlusPlugin, GetMediaListOptions, GetMediaOptions, MediaItem } from './definitions';



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
        options: GetMediaListOptions = {}
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
    
                            this._mediaList.set(file.name, {...mediaItem, path, file});
    
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
        options: GetMediaOptions
    ): Promise<FullMediaItem> {
        try {
            const mediaItem = this._mediaList.get(options.id) as FullMediaItem & {file?: File};

            if (mediaItem.type === 'image') {
                if (options.includeDetails && mediaItem.path) {
                    await this.getImageDimensions(mediaItem.path).then(
                        (dimensions) => {
                            mediaItem.width = dimensions.width;
                            mediaItem.height = dimensions.height;
                        }
                    );
                }

                if (options.includeBaseColor && mediaItem.path) {
                    await this.getDominantColor(mediaItem.path).then(
                        (baseColor) => {
                            mediaItem.baseColor = baseColor;
                        }
                    );
                }

            } else if (mediaItem.type === 'video') {

                if (options.includeDetails && mediaItem.path) {
                    await this.getVideoDimensions(mediaItem.path).then(
                        (dimensions) => {
                            mediaItem.width = dimensions.width;
                            mediaItem.height = dimensions.height;
                        }
                    );
                }
            }

            return mediaItem
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
            const ctx = canvas.getContext("2d", { alpha: true });

            if (ctx) {
                ctx.clearRect(0, 0, width, height); 
                ctx.drawImage(imgBitmap, 0, 0, width, height);
        
                const blob = await canvas.convertToBlob({ type: "image/webp", quality });
                return URL.createObjectURL(blob);
            }

            return "";
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
            img.crossOrigin = "anonymous"; 
    
            img.onload = () => {
                let canvas: OffscreenCanvas | HTMLCanvasElement;
                let ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null;
    
                if ("OffscreenCanvas" in window) {
                    canvas = new OffscreenCanvas(10, 10);
                    ctx = canvas.getContext("2d");
                } else {
                    canvas = document.createElement("canvas");
                    ctx = canvas.getContext("2d");
                }
    
                if (ctx) {
                    canvas.width = 10;
                    canvas.height = 10;
                    
                    ctx.drawImage(img, 0, 0, 10, 10);
                    const pixelData = ctx.getImageData(0, 0, 10, 10).data;
    
                    let r = 0, g = 0, b = 0, count = 0;
                    for (let i = 0; i < pixelData.length; i += 4) {
                        r += pixelData[i];
                        g += pixelData[i + 1];
                        b += pixelData[i + 2];
                        count++;
                    }

                    r = Math.round(r / count);
                    g = Math.round(g / count);
                    b = Math.round(b / count);
    
                    const hex = `#${r.toString(16).padStart(2, "0")}${g
                        .toString(16)
                        .padStart(2, "0")}${b
                        .toString(16)
                        .padStart(2, "0")}`;
    
                    resolve(hex);

                } else {
                    resolve("#000000"); // fallback-color
                }
            };
    
            img.onerror = () => resolve("#000000"); // catch error
            img.src = path;
        });
    }   
}
