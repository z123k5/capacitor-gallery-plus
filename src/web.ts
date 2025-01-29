import { WebPlugin } from '@capacitor/core';

import type { GalleryPlusPlugin, MediaItem } from './definitions';

export class GalleryPlusWeb extends WebPlugin implements GalleryPlusPlugin {
  
  async checkPermissions(): Promise<{ status: string }> {
    return { status: "unavailable" };
  }

  async requestPermissions(): Promise<{ status: string }> {
    return { status: "unavailable" };
  }

  async getMedias(options: any): Promise<{ media: MediaItem[] }> {
    console.warn("GalleryPlus: getMedias is not implemented on web.", options);
    return { media: [] };
  }

  async getMedia(options: { id: string }): Promise<MediaItem> {
    console.warn("GalleryPlus: getMedia is not implemented on web.", options);
    throw this.unimplemented("getMedia is not implemented on web.");
  }
}
