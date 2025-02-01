export interface GalleryPlusPlugin {
    /**
      * Checks the current permissions for accessing media.
      *
      * @returns {Promise<{ status: string }>}  
      *          A promise resolving to an object containing the permission status.
      */
    checkPermissions(): Promise<{ status: string }>;

    /**
     * Requests the necessary permissions to access media.
     *
     * @returns {Promise<{ status: string }>}  
     *          A promise resolving to an object containing the updated permission status.
     */
    requestPermissions(): Promise<{ status: string }>;
    /**
     * Retrieves media items from the device gallery.
     *
     * @param {GetMediaListOptions} options - The options for retrieving media.
     * @returns {Promise<{ media: MediaItem[] }>}
     *          A promise resolving to an object containing a list of media items.
     */
    getMediaList(options: GetMediaListOptions): Promise<{ media: MediaItem[] }>;

    /**
     * Retrieves details of a specific media item by its ID.
     * @returns {Promise<MediaItem>} A promise resolving to a media item object.
     */
    getMedia(options: GetMediaOptions): Promise<MediaItem>;
}

export interface GetMediaListOptions {
    /**
     * The type of media to retrieve. Default is `"all"`.
     *
     * - `"image"`: Only images
     * - `"video"`: Only videos
     * - `"all"`: Both images and videos
     *
     * @default "all"
     */
    type?: 'image' | 'video' | 'all';

    /**
     * The maximum number of media items to return.
     */
    limit?: number;

    /**
     * The starting index for pagination.
     */
    startAt?: number;

    /**
     * The size of the thumbnail in pixels.
     *
     * Example: `200` for 200x200px.
     */
    thumbnailSize?: number;

    /**
     * Sort order of the media items.
     *
     * - `"oldest"`: Oldest first
     * - `"newest"`: Newest first
     *
     * @default "newest"
     */
    sort?: 'oldest' | 'newest';

    /**
     * Whether to include additional details like width, height, and file size.
     */
    includeDetails?: boolean;

    /**
     * Whether to extract and return the dominant color of the image.
     */
    includeBaseColor?: boolean;

    /**
     * Whether to generate a temporary path to access the media.
     */
    generatePath?: boolean;

    /** Filter applied to the media selection */
    filter?: MediaFilter;
}

/**
 * Filters for querying media items from the gallery.
 */
export enum MediaFilter {
    /** No filtering, returns all media */
    All = "all",

    /** Only return panoramic images */
    Panorama = "panorama",

    /** Only return HDR images */
    HDR = "hdr",

    /** Only return screenshots */
    Screenshot = "screenshot"
}

export interface GetMediaOptions {
    /**
     * The unique identifier of the media item.
     */
    id: string;

    /**
     * Whether to include additional metadata such as width, height, and file size.
     * @default false
     */
    includeDetails?: boolean;

    /**
     * Whether to extract and return the dominant color of the image.
     * @default false
     */
    includeBaseColor?: boolean;

    /**
     * Whether to generate a temporary path to access the media.
     * @default false
     */
    generatePath?: boolean;
}

export interface MediaItem {
    /**
     * Unique identifier of the media item.
     */
    id: string;

    /**
     * The type of media (image or video).
     */
    type: 'image' | 'video';

    /**
     * The Unix timestamp in milliseconds when the media was created.
     */
    createdAt: number;

    /**
     * Base64-encoded thumbnail image (if available).
     */
    thumbnail?: string;

    /**
     * Dominant color of the image (if requested).
     */
    baseColor?: string;

    /**
     * Original file name of the media (only applicable for web platforms).
     */
    name?: string;

    /**
     * Width of the media in pixels.
     */
    width?: number;

    /**
     * Height of the media in pixels.
     */
    height?: number;

    /**
     * Size of the file in bytes.
     */
    fileSize?: number;

    /**
     * File path or accessible URI of the media item.
     */
    path?: string;

    /**
     * The MIME type of the media item (e.g., "image/jpeg", "video/mp4").
     */
    mimeType?: string;


    /**
     * Indicates whether the media item is marked as a favorite.
     * **iOS-only**
     */
    isFavorite?: boolean;

    /**
     * Indicates whether the media item is hidden.
     * **iOS-only** 
     */
    isHidden?: boolean;

    /** The subtype of the media, indicating special properties */
    subtype?: MediaSubtype;

}

/**
 * Represents special subtypes of media items, such as motion photos,
 * panoramas, HDR images, or slow-motion videos.
 */
export enum MediaSubtype {
    /** A Live Photo (iOS) or Motion Photo (Android) */
    MotionPhoto = "motion_photo",

    /** A panorama image */
    Panorama = "panorama",

    /** A high dynamic range (HDR) image */
    HDR = "hdr",

    /** A screenshot */
    Screenshot = "screenshot",

    /** A photo with depth effect (bokeh) */
    Portrait = "portrait",

    /** A high frame rate slow-motion video */
    SlowMotion = "slow_motion",

    /** A time-lapse video */
    Timelapse = "timelapse"
}
