import { WebPlugin } from '@capacitor/core';
import type { FullMediaItem, GalleryPlusPlugin, GetMediaListOptions, GetMediaOptions, MediaItem } from './definitions';
export declare class GalleryPlusWeb extends WebPlugin implements GalleryPlusPlugin {
    checkPermissions(): Promise<{
        status: string;
    }>;
    requestPermissions(): Promise<{
        status: string;
    }>;
    private _mediaList;
    getMediaList(options?: GetMediaListOptions): Promise<{
        media: MediaItem[];
    }>;
    getMedia(options: GetMediaOptions): Promise<FullMediaItem>;
    private generateImageThumbnailFast;
    private getImageDimensions;
    private getVideoDimensions;
    private getDominantColor;
}
