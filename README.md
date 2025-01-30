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
getMedias(options: { type?: "image" | "video" | "all"; limit?: number; startAt?: number; thumbnailSize?: number; sort?: "oldest" | "newest"; includeDetails?: boolean; includeBaseColor?: boolean; generatePath?: boolean; filter?: "all" | "panorama" | "hdr" | "screenshot"; }) => Promise<{ media: MediaItem[]; }>
```

| Param         | Type                                                                                                                                                                                                                                                                             |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`options`** | <code>{ type?: 'image' \| 'video' \| 'all'; limit?: number; startAt?: number; thumbnailSize?: number; sort?: 'oldest' \| 'newest'; includeDetails?: boolean; includeBaseColor?: boolean; generatePath?: boolean; filter?: 'all' \| 'panorama' \| 'hdr' \| 'screenshot'; }</code> |

**Returns:** <code>Promise&lt;{ media: MediaItem[]; }&gt;</code>

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

| Prop            | Type                            |
| --------------- | ------------------------------- |
| **`id`**        | <code>string</code>             |
| **`type`**      | <code>'image' \| 'video'</code> |
| **`createdAt`** | <code>string</code>             |
| **`thumbnail`** | <code>string</code>             |
| **`baseColor`** | <code>string</code>             |
| **`name`**      | <code>string</code>             |
| **`width`**     | <code>number</code>             |
| **`height`**    | <code>number</code>             |
| **`fileSize`**  | <code>number</code>             |
| **`path`**      | <code>string</code>             |

</docgen-api>


## License

This project is **dual-licensed** under:
1. **MIT License (Free & Open-Source)** – For personal, educational, and open-source use.
2. **Commercial License** – Required for closed-source, proprietary, or commercial use.


See the [LICENSE](LICENSE) file for more details.

