/**
 * Filters for querying media items from the gallery.
 */
export var MediaFilter;
(function (MediaFilter) {
    /** No filtering, returns all media */
    MediaFilter["All"] = "all";
    /** Only return panoramic images */
    MediaFilter["Panorama"] = "panorama";
    /** Only return HDR images */
    MediaFilter["HDR"] = "hdr";
    /** Only return screenshots */
    MediaFilter["Screenshot"] = "screenshot";
})(MediaFilter || (MediaFilter = {}));
/**
 * Represents special subtypes of media items, such as motion photos,
 * panoramas, HDR images, or slow-motion videos.
 */
export var MediaSubtype;
(function (MediaSubtype) {
    /** A Live Photo (iOS) or Motion Photo (Android) */
    MediaSubtype["MotionPhoto"] = "motion_photo";
    /** A panorama image */
    MediaSubtype["Panorama"] = "panorama";
    /** A high dynamic range (HDR) image */
    MediaSubtype["HDR"] = "hdr";
    /** A screenshot */
    MediaSubtype["Screenshot"] = "screenshot";
    /** A photo with depth effect (bokeh) */
    MediaSubtype["Portrait"] = "portrait";
    /** A high frame rate slow-motion video */
    MediaSubtype["SlowMotion"] = "slow_motion";
    /** A time-lapse video */
    MediaSubtype["Timelapse"] = "timelapse";
})(MediaSubtype || (MediaSubtype = {}));
//# sourceMappingURL=definitions.js.map