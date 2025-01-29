export interface GalleryPlusPlugin {
    checkPermissions(): Promise<{ status: string }>;
    requestPermissions(): Promise<{ status: string }>;
  
  getMedias(options: {
    type?: "image" | "video" | "all";
    limit?: number;
    startAt?: number;
    thumbnailSize?: number;
    sort?: "oldest" | "newest";
    includeDetails?: boolean;
    includeBaseColor?: boolean;
    generatePath?: boolean;
    filter?: "all" | "panorama" | "hdr" | "screenshot";
  }): Promise<{ media: MediaItem[] }>;
    getMedia(options: { id: string; includeBaseColor?: boolean }): Promise<MediaItem>;
  }
  
  export interface MediaItem {
    id: string;
    type: "image" | "video";
    createdAt: string;
    thumbnail?: string;
    baseColor?: string;
    name?: string; // web only
    width?: number;
    height?: number;
    fileSize?: number;
    path?: string;
  }
  