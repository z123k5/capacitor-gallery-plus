# Capacitor Gallery Plus

A Capacitor plugin for accessing and managing media files (photos & videos) on iOS and Android. This plugin provides an easy way to retrieve media from the device's gallery, including metadata such as filenames, paths, and types.

## Features
- 📸 Retrieve photos & videos from the device gallery
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
    const result = await GalleryPlus.getMediaFiles();
    console.log('Media files:', result);
  } catch (error) {
    console.error('Error retrieving media:', error);
  }
}
```

## API

<docgen-index>

* [`checkPermissions()`](#checkpermissions)
* [`requestPermissions()`](#requestpermissions)
* [`getMedias(...)`](#getmedias)
* [`getMedia(...)`](#getmedia)
* [Interfaces](#interfaces)

</docgen-index>

<docgen-api>
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

### checkPermissions()

```typescript
checkPermissions() => Promise<{ status: string; }>
```

**Returns:** <code>Promise&lt;{ status: string; }&gt;</code>

--------------------


### requestPermissions()

```typescript
requestPermissions() => Promise<{ status: string; }>
```

**Returns:** <code>Promise&lt;{ status: string; }&gt;</code>

--------------------


### getMedias(...)

```typescript
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
}) => Promise<{ media: MediaItem[]; }>
```

| Param         | Type                                                                                                                   | Description |
|--------------|------------------------------------------------------------------------------------------------------------------------|-------------|
| **`type`**   | <code>"image" \| "video" \| "all"</code>                                                                                | The type of media to retrieve. Default is `"all"`. |
| **`limit`**  | <code>number</code>                                                                                                    | The maximum number of media items to return. |
| **`startAt`** | <code>number</code>                                                                                                   | The starting index for pagination. |
| **`thumbnailSize`** | <code>number</code>                                                                                             | The size of the thumbnail in pixels (e.g., `200` for 200x200px). |
| **`sort`**   | <code>"oldest" \| "newest"</code>                                                                                      | Sort order of the media items. Default is `"newest"`. |
| **`includeDetails`** | <code>boolean</code>                                                                                           | Whether to include additional details like width, height, and file size. |
| **`includeBaseColor`** | <code>boolean</code>                                                                                        | Whether to extract and return the dominant color of the image. |
| **`generatePath`** | <code>boolean</code>                                                                                            | Whether to generate a temporary path to access the media. |
| **`filter`** | <code>"all" \| "panorama" \| "hdr" \| "screenshot"</code>                                                              | Filters the media based on specific types (e.g., panorama, HDR, or screenshots). Default is `"all"`. |

**Returns:**  
A **Promise** resolving to an object containing a list of media items:
```typescript
Promise<{ media: MediaItem[] }>
```

--------------------


### getMedia(...)

```typescript
getMedia(options: { id: string; includeBaseColor?: boolean; }) => Promise<MediaItem>
```

| Param         | Type                                                     |
| ------------- | -------------------------------------------------------- |
| **`options`** | <code>{ id: string; includeBaseColor?: boolean; }</code> |

**Returns:** <code>Promise&lt;<a href="#mediaitem">MediaItem</a>&gt;</code>

--------------------


### Interfaces

#### MediaItem

| Prop          | Type                            | Description |
|--------------|--------------------------------|-------------|
| **id**        | <code>string</code>             | Unique identifier of the media item. |
| **type**      | <code>'image' \| 'video'</code> | The type of media (image or video). |
| **createdAt** | <code>number</code> | The Unix timestamp in milliseconds when the media was created. |
| **thumbnail** | <code>string</code>             | Base64 thumbnail image (if available). |
| **baseColor** | <code>string</code>             | Dominant color of the image (if requested). |
| **name**      | <code>string</code>             | Original file name of the media. |
| **width**     | <code>number</code>             | Width of the media in pixels. |
| **height**    | <code>number</code>             | Height of the media in pixels. |
| **fileSize**  | <code>number</code>             | Size of the file in bytes. |
| **path**      | <code>string</code>             | File path or accessible URI of the media item. |



</docgen-api>


## License

This project is **dual-licensed** under:
1. **MIT License (Free & Open-Source)** – For personal, educational, and open-source use.
2. **Commercial License** – Required for closed-source, proprietary, or commercial use.


See the [LICENSE](LICENSE) file for more details.

