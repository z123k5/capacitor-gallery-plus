import { WebPlugin } from '@capacitor/core';
export class GalleryPlusWeb extends WebPlugin {
    constructor() {
        super(...arguments);
        this._mediaList = new Map();
    }
    async checkPermissions() {
        console.warn('checkPermissions is not required on web.');
        return { status: 'granted' };
    }
    async requestPermissions() {
        console.warn('requestPermissions is not required on web.');
        return { status: 'granted' };
    }
    async getMediaList(options = {}) {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.setAttribute('webkitdirectory', '');
            input.setAttribute('multiple', '');
            input.style.display = 'none';
            input.addEventListener('change', async (event) => {
                const target = event.target;
                if (!target.files) {
                    reject(new Error('No files selected'));
                    return;
                }
                try {
                    this._mediaList = new Map();
                    const mediaArray = [];
                    for (const file of target.files) {
                        if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
                            const path = URL.createObjectURL(file);
                            const mediaItem = {
                                id: file.name,
                                name: file.name,
                                type: file.type.startsWith('image/') ? 'image' : 'video',
                                createdAt: file.lastModified,
                                fileSize: file.size,
                                mimeType: file.type,
                                thumbnail: await this.generateImageThumbnailFast(file, 200, 0.8)
                            };
                            this._mediaList.set(file.name, Object.assign(Object.assign({}, mediaItem), { path, file }));
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
                            }
                            else if (file.type.startsWith('video/')) {
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
                    mediaArray.sort((a, b) => options.sort === 'oldest'
                        ? Number(a.createdAt) - Number(b.createdAt)
                        : Number(b.createdAt) - Number(a.createdAt));
                    console.log('list', this._mediaList);
                    resolve({ media: mediaArray });
                }
                catch (err) {
                    console.error('Error processing files:', err);
                    reject(err);
                }
            });
            document.body.appendChild(input);
            input.click();
            document.body.removeChild(input);
        });
    }
    async getMedia(options) {
        try {
            const mediaItem = this._mediaList.get(options.id);
            if (mediaItem.type === 'image') {
                if (options.includeDetails && mediaItem.path) {
                    await this.getImageDimensions(mediaItem.path).then((dimensions) => {
                        mediaItem.width = dimensions.width;
                        mediaItem.height = dimensions.height;
                    });
                }
                if (options.includeBaseColor && mediaItem.path) {
                    await this.getDominantColor(mediaItem.path).then((baseColor) => {
                        mediaItem.baseColor = baseColor;
                    });
                }
            }
            else if (mediaItem.type === 'video') {
                if (options.includeDetails && mediaItem.path) {
                    await this.getVideoDimensions(mediaItem.path).then((dimensions) => {
                        mediaItem.width = dimensions.width;
                        mediaItem.height = dimensions.height;
                    });
                }
            }
            return mediaItem;
        }
        catch (err) {
            console.error("Error in getMedia:", err);
            throw new Error("Failed to retrieve media.");
        }
    }
    async generateImageThumbnailFast(file, maxSize = 200, quality = 0.8) {
        const imgBitmap = await createImageBitmap(file);
        let width = imgBitmap.width;
        let height = imgBitmap.height;
        if (width > height) {
            height = Math.round((height / width) * maxSize);
            width = maxSize;
        }
        else {
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
        }
        else {
            return "";
        }
    }
    async getImageDimensions(path) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ width: img.width, height: img.height });
            img.src = path;
        });
    }
    async getVideoDimensions(path) {
        return new Promise((resolve, reject) => {
            const video = document.createElement("video");
            video.src = path;
            video.onloadedmetadata = () => resolve({ width: video.videoWidth, height: video.videoHeight });
            video.onerror = () => reject("Failed to load video");
        });
    }
    async getDominantColor(path) {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                let canvas;
                let ctx;
                if ("OffscreenCanvas" in window) {
                    canvas = new OffscreenCanvas(10, 10);
                    ctx = canvas.getContext("2d");
                }
                else {
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
                }
                else {
                    resolve("#000000"); // fallback-color
                }
            };
            img.onerror = () => resolve("#000000"); // catch error
            img.src = path;
        });
    }
}
//# sourceMappingURL=web.js.map