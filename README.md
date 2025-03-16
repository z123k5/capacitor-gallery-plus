# Capacitor Gallery Plus

A Capacitor plugin for accessing and managing media files (photos & videos) on iOS and Android. This plugin provides an easy way to retrieve media from the device's gallery, including metadata such as filenames, paths, and types.

<p align="center">
  <img src="https://img.shields.io/badge/Capacitor%20Versions-v5,%20v6%20and%20v7-blue?logo=Capacitor&style=flat-square" />
  <br/>
  <img src="https://img.shields.io/badge/Web-Supported-brightgreen?style=flat&logo=internet-explorer&logoColor=white" />
  <img src="https://img.shields.io/badge/iOS-Supported-brightgreen?style=flat&logo=apple&logoColor=white" />
  <img src="https://img.shields.io/badge/Android-Supported-brightgreen?style=flat&logo=android&logoColor=white" />
</p>

## Features
- 📸 Retrieve **photos** & **videos** from the device gallery
- 🏷️ Get metadata like filenames, paths, and MIME types
- 🚀 Works with Capacitor 5, 6, and 7
- 🔧 Simple API for easy integration

## Install

```bash
npm install capacitor-gallery-plus
npx cap sync
```

## iOS Setup

To ensure the plugin works correctly on iOS, you need to add the following permissions to your `Info.plist` file.  

### **Required Permissions**
Open your `ios/App/App/Info.plist` file and add the following keys inside the `<dict>` tag:

```xml
<key>NSPhotoLibraryUsageDescription</key>
<string>This app requires access to your photo library to display media files.</string>
```

This permission is required for accessing media files in the user's gallery.  
If this is missing, the app might crash or fail to fetch media.

### **Requesting Permissions in Code**
If you need to explicitly request permissions, you can call:

```typescript
const permission = await GalleryPlus.checkPermissions();

if (permission.status !== "granted") {
    const request = await GalleryPlus.requestPermissions();

    if (request.status !== "granted") {
        console.error("Permission denied.");
    }
}
```

This ensures the app prompts the user for access when needed.

---

💡 **Tip:** If you experience crashes on iOS, check your Xcode logs to confirm missing permissions.

## Usage

```typescript
import { GalleryPlus } from 'capacitor-gallery-plus';

async function getMedia() {
    try {
        const result = await GalleryPlus.getMediaList({});
        console.log('Media files:', result.media);
    } catch (error) {
        console.error('Error retrieving media:', error);
    }
}
```

## API

<docgen-index>

* [`checkPermissions()`](#checkpermissions)
* [`requestPermissions()`](#requestpermissions)
* [`getMediaList(...)`](#getmedialist)
* [`getMedia(...)`](#getmedia)
* [Interfaces](#interfaces)
* [Enums](#enums)

</docgen-index>

<docgen-api>
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

### checkPermissions()

```typescript
checkPermissions() => Promise<{ status: string; }>
```

Checks the current permissions for accessing media.

**Returns:** <code>Promise&lt;{ status: string; }&gt;</code>

--------------------


### requestPermissions()

```typescript
requestPermissions() => Promise<{ status: string; }>
```

Requests the necessary permissions to access media.

**Returns:** <code>Promise&lt;{ status: string; }&gt;</code>

--------------------


### getMediaList(...)

```typescript
getMediaList(options: GetMediaListOptions) => Promise<{ media: MediaItem[]; }>
```

Retrieves media items from the device gallery.

| Param         | Type                                                                | Description                         |
| ------------- | ------------------------------------------------------------------- | ----------------------------------- |
| **`options`** | <code><a href="#getmedialistoptions">GetMediaListOptions</a></code> | - The options for retrieving media. |

**Returns:** <code>Promise&lt;{ media: MediaItem[]; }&gt;</code>

--------------------


### getMedia(...)

```typescript
getMedia(options: GetMediaOptions) => Promise<FullMediaItem>
```

Retrieves details of a specific media item by its ID.

| Param         | Type                                                        |
| ------------- | ----------------------------------------------------------- |
| **`options`** | <code><a href="#getmediaoptions">GetMediaOptions</a></code> |

**Returns:** <code>Promise&lt;<a href="#fullmediaitem">FullMediaItem</a>&gt;</code>

--------------------


### Interfaces


#### MediaItem

| Prop             | Type                                                  | Description                                                          |
| ---------------- | ----------------------------------------------------- | -------------------------------------------------------------------- |
| **`id`**         | <code>string</code>                                   | Unique identifier of the media item.                                 |
| **`type`**       | <code>'image' \| 'video'</code>                       | The type of media (image or video).                                  |
| **`createdAt`**  | <code>number</code>                                   | The Unix timestamp in milliseconds when the media was created.       |
| **`thumbnail`**  | <code>string</code>                                   | Base64-encoded thumbnail image (only in `getMediaList`).             |
| **`baseColor`**  | <code>string</code>                                   | Dominant color of the image (requires `includeBaseColor`).           |
| **`name`**       | <code>string</code>                                   | Original file name of the media (only applicable for web platforms). |
| **`width`**      | <code>number</code>                                   | Width of the media in pixels (requires `includeDetails`).            |
| **`height`**     | <code>number</code>                                   | Height of the media in pixels (requires `includeDetails`).           |
| **`fileSize`**   | <code>number</code>                                   | Size of the file in bytes.                                           |
| **`mimeType`**   | <code>string</code>                                   | The MIME type of the media item (e.g., "image/jpeg", "video/mp4").   |
| **`isFavorite`** | <code>boolean</code>                                  | Indicates whether the media item is marked as a favorite. (iOS-only) |
| **`isHidden`**   | <code>boolean</code>                                  | Indicates whether the media item is hidden. (iOS-only)               |
| **`subtype`**    | <code><a href="#mediasubtype">MediaSubtype</a></code> | The subtype of the media, indicating special properties              |


#### GetMediaListOptions

| Prop                   | Type                                                | Description                                                                                                                            | Default               |
| ---------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| **`type`**             | <code>'image' \| 'video' \| 'all'</code>            | The type of media to retrieve. Default is `"all"`. - `"image"`: Only images - `"video"`: Only videos - `"all"`: Both images and videos | <code>"all"</code>    |
| **`limit`**            | <code>number</code>                                 | The maximum number of media items to return.                                                                                           |                       |
| **`startAt`**          | <code>number</code>                                 | The starting index for pagination.                                                                                                     |                       |
| **`thumbnailSize`**    | <code>number</code>                                 | The size of the thumbnail in pixels. Example: `200` for 200x200px.                                                                     |                       |
| **`sort`**             | <code>'oldest' \| 'newest'</code>                   | Sort order of the media items. - `"oldest"`: Oldest first - `"newest"`: Newest first                                                   | <code>"newest"</code> |
| **`includeDetails`**   | <code>boolean</code>                                | Whether to include additional details like width, height.                                                                              |                       |
| **`includeBaseColor`** | <code>boolean</code>                                | Whether to extract and return the dominant color of the image.                                                                         |                       |
| **`filter`**           | <code><a href="#mediafilter">MediaFilter</a></code> | Filter applied to the media selection                                                                                                  |                       |


#### FullMediaItem

An extended version of <a href="#mediaitem">`MediaItem`</a> returned by `getMedia`.

| Prop       | Type                | Description                                    |
| ---------- | ------------------- | ---------------------------------------------- |
| **`path`** | <code>string</code> | File path or accessible URI of the media item. |


#### GetMediaOptions

| Prop                   | Type                 | Description                                                                                                                                                                                                                         | Default                                                     |
| ---------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **`id`**               | <code>string</code>  | The unique identifier of the media item.                                                                                                                                                                                            |                                                             |
| **`includeDetails`**   | <code>boolean</code> | Whether to include additional metadata such as width, height, and file size.                                                                                                                                                        | <code>false</code>                                          |
| **`includeBaseColor`** | <code>boolean</code> | Whether to extract and return the dominant color of the image.                                                                                                                                                                      | <code>false</code>                                          |
| **`includePath`**      | <code>boolean</code> | Whether to generate a temporary path to access the media. Available on iOS, Android, and Web. - On **iOS & Android**, the file path is only available if enabled. - On **Web**, the browser automatically provides a temporary URL. | <code>false (iOS & Android), always available on Web</code> |


### Enums


#### MediaSubtype

| Members           | Value                       | Description                                  |
| ----------------- | --------------------------- | -------------------------------------------- |
| **`MotionPhoto`** | <code>"motion_photo"</code> | A Live Photo (iOS) or Motion Photo (Android) |
| **`Panorama`**    | <code>"panorama"</code>     | A panorama image                             |
| **`HDR`**         | <code>"hdr"</code>          | A high dynamic range (HDR) image             |
| **`Screenshot`**  | <code>"screenshot"</code>   | A screenshot                                 |
| **`Portrait`**    | <code>"portrait"</code>     | A photo with depth effect (bokeh)            |
| **`SlowMotion`**  | <code>"slow_motion"</code>  | A high frame rate slow-motion video          |
| **`Timelapse`**   | <code>"timelapse"</code>    | A time-lapse video                           |


#### MediaFilter

| Members          | Value                     | Description                     |
| ---------------- | ------------------------- | ------------------------------- |
| **`All`**        | <code>"all"</code>        | No filtering, returns all media |
| **`Panorama`**   | <code>"panorama"</code>   | Only return panoramic images    |
| **`HDR`**        | <code>"hdr"</code>        | Only return HDR images          |
| **`Screenshot`** | <code>"screenshot"</code> | Only return screenshots         |

</docgen-api>


## License

This project is **dual-licensed** under:
1. **MIT License (Free & Open-Source)** – For personal, educational, and open-source use.
2. **Commercial License** – Required for closed-source, proprietary, or commercial use.


See the [LICENSE](LICENSE) file for more details.

