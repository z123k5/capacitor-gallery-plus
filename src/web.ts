import { WebPlugin } from '@capacitor/core';

import type { GalleryPlusPlugin, MediaItem } from './definitions';

interface FileSystemDirectoryHandleExt {
    values(): AsyncIterable<FileSystemFileHandleExt>;
}

interface FileSystemFileHandleExt {
    kind: string;
    getFile(): Promise<File>;
}

interface Window {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandleExt>;
}

export class GalleryPlusWeb extends WebPlugin implements GalleryPlusPlugin {
    async checkPermissions(): Promise<{ status: string }> {
        console.warn('checkPermissions is not required on web.');
        return { status: 'granted' };
    }

    async requestPermissions(): Promise<{ status: string }> {
        console.warn('requestPermissions is not required on web.');
        return { status: 'granted' };
    }

    async getMediaList(
        options: {
            sort?: 'newest' | 'oldest';
            includeBaseColor?: boolean;
        } = {}
    ): Promise<{ media: MediaItem[] }> {
        const win = window as Window;
        if (!win.showDirectoryPicker) {
            console.warn(
                'File System Access API is not supported in this browser.'
            );
            return { media: [] };
        }

        try {
            const dirHandle = await win.showDirectoryPicker();
            const mediaArray: MediaItem[] = [];

            for await (const entry of dirHandle.values()) {
                if (entry.kind === 'file') {
                    const file = await entry.getFile();
                    if (
                        file.type.startsWith('image/') ||
                        file.type.startsWith('video/')
                    ) {
                        const mediaItem: MediaItem = {
                            id: file.name,
                            name: file.name,
                            type: file.type.startsWith('image/')
                                ? 'image'
                                : 'video',
                            createdAt: file.lastModified,
                            fileSize: file.size,
                            path: URL.createObjectURL(file),
                            mimeType: file.type
                        };

                        if (file.type.startsWith('image/')) {
                            await this.getImageDimensions(file).then(
                                (dimensions) => {
                                    mediaItem.width = dimensions.width;
                                    mediaItem.height = dimensions.height;
                                }
                            );

                            if (options.includeBaseColor) {
                                await this.getDominantColor(file).then(
                                    (baseColor) => {
                                        mediaItem.baseColor = baseColor;
                                    }
                                );
                            }
                        }

                        mediaArray.push(mediaItem);
                    }
                }
            }

            mediaArray.sort((a, b) =>
                options.sort === 'oldest'
                    ? Number(a.createdAt) - Number(b.createdAt)
                    : Number(b.createdAt) - Number(a.createdAt)
            );

            return { media: mediaArray };
        } catch (err) {
            console.error('Error selecting folder:', err);
            return { media: [] };
        }
    }

    async getMedia(): Promise<MediaItem> {
        console.warn('getMedia is not supported on web.');
        throw new Error('getMedia is not supported on web.');
    }

    private async getImageDimensions(
        file: File
    ): Promise<{ width: number; height: number }> {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () =>
                resolve({ width: img.width, height: img.height });
            img.src = URL.createObjectURL(file);
        });
    }

    private async getDominantColor(file: File): Promise<string> {
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
            img.src = URL.createObjectURL(file);
        });
    }
}
