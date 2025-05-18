package de.metaflash.plugins.galleryplus;

import android.content.Context;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.media.ThumbnailUtils;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;
import android.util.Base64;
import android.content.ContentUris;
import androidx.core.content.FileProvider;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.*;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;


public class GalleryPlus {
    private final Context context;

    public GalleryPlus(Context context) {
        this.context = context;
    }

    /**
     * Get a list of media items
     */
    public JSONArray getMediaList(String mediaType, int limit, int startAt, String sort, boolean includeDetails) {
        JSONArray mediaArray = new JSONArray();
        String sortOrder = MediaStore.MediaColumns.DATE_ADDED + (sort.equals("newest") ? " DESC" : " ASC");

        String selection = null;
        String[] selectionArgs = null;

        if ("image".equals(mediaType)) {
            selection = MediaStore.Files.FileColumns.MEDIA_TYPE + "=?";
            selectionArgs = new String[]{String.valueOf(MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE)};
        } else if ("video".equals(mediaType)) {
            selection = MediaStore.Files.FileColumns.MEDIA_TYPE + "=?";
            selectionArgs = new String[]{String.valueOf(MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO)};
        } else if ("all".equals(mediaType)) {
            selection = MediaStore.Files.FileColumns.MEDIA_TYPE + "=? OR " + MediaStore.Files.FileColumns.MEDIA_TYPE + "=?";
            selectionArgs = new String[]{String.valueOf(MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE), String.valueOf(MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO)};
        }

        // Query options
        List<String> projectionList = new ArrayList<>(Arrays.asList(
                // Mixed Projection, Image and Video
                MediaStore.Files.FileColumns._ID,
                MediaStore.Files.FileColumns.MEDIA_TYPE,

                MediaStore.Images.Media.TITLE,
                MediaStore.Images.Media.SIZE,
                MediaStore.Video.Media.DURATION,
                MediaStore.Images.Media.DATE_ADDED,
                MediaStore.Images.Media.IS_FAVORITE,
                MediaStore.Images.Media.MIME_TYPE,
                MediaStore.Images.Media.DATE_MODIFIED

//                MediaStore.Images.Media.WIDTH,
//                MediaStore.Images.Media.HEIGHT,
//                MediaStore.Video.Media.WIDTH,
//                MediaStore.Video.Media.HEIGHT,

        ));

        // Additional query options, both image / videos
        if (includeDetails) {
            // Mixed, Image and Video
            projectionList.add(MediaStore.Images.Media.WIDTH);
            projectionList.add(MediaStore.Images.Media.HEIGHT);
        }

        String[] projection = projectionList.toArray(new String[0]);

        // Uniform collection Uri, for sometimes it cannot acquire the MEDIA_TYPE_IMAGE  folder.
        Uri collection = MediaStore.Files.getContentUri("external");

        Cursor cursor = context.getContentResolver().query(
            collection,
            projection,
            selection,
            selectionArgs,
            sortOrder
        );
        int totalCount = 0;

        if (cursor != null) {
            int count = 0;
            totalCount = cursor.getCount();

            while (cursor.moveToNext()) {
                if (count >= startAt && count < startAt + limit) {
                    try {
                        JSONObject mediaItem = new JSONObject();
                        long id = cursor.getLong(0);
                        int type = cursor.getInt(1);


                        // Get base information
                        if (type == MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE || type == MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO) {
                            mediaItem.put("id", String.valueOf(id));
                            mediaItem.put("name", cursor.getString(2));

                            mediaItem.put("createdAt",  cursor.getLong(5) * 1000);
                            mediaItem.put("modifiedAt", cursor.getLong(8));
                            mediaItem.put("isFavorite", cursor.getInt(6));
                            mediaItem.put("mimeType", cursor.getString(7));
                        } else
                            continue;
                        if (type == MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO) {
                            mediaItem.put("type", "video");
                            mediaItem.put("duration", cursor.getLong(4));
                        } else
                            mediaItem.put("type", "image");

                        if (includeDetails) {
                            mediaItem.put("fileSize", cursor.getLong(3));
                            mediaItem.put("width", cursor.getInt(9));
                            mediaItem.put("height", cursor.getInt(10));
                        }

                        // Get thumbnails
                        Bitmap thumbnail = null;
                        if (type == MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE) {
                            thumbnail = MediaStore.Images.Thumbnails.getThumbnail(
                                context.getContentResolver(),
                                id,
                                MediaStore.Images.Thumbnails.FULL_SCREEN_KIND,
                                null
                            );
                        } else {
                            Uri videoUri = ContentUris.withAppendedId(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, id);
                            thumbnail = ThumbnailUtils.createVideoThumbnail(getRealPathFromURI(context, videoUri), MediaStore.Video.Thumbnails.FULL_SCREEN_KIND);
                        }


                        if (thumbnail != null) {
//                            ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
//                            thumbnail.compress(Bitmap.CompressFormat.JPEG, 80, byteArrayOutputStream);
//                            byte[] byteArray = byteArrayOutputStream.toByteArray();
                            mediaItem.put("thumbnailV1", getThumbnailUriFromBitmap(context, thumbnail, id + "_50", 50));
                            mediaItem.put("thumbnailV2", getThumbnailUriFromBitmap(context, thumbnail, id + "_100", 100));
                        }

                        mediaArray.put(mediaItem);
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
                count++;
                if (count >= startAt + limit) {
                    break; // fetch only the requested amount
                }
            }
            cursor.close();
        }

        // Return pack
        // mediaArray, totalCount


        return mediaArray;
    }

    public List<String> getMissingMediaIds(List<String> inputIds) {
        List<String> missingIds = new ArrayList<>();

        if (inputIds == null || inputIds.isEmpty()) {
            return missingIds;
        }

        // 查询MediaStore中存在的ID
        Set<String> existingIds = new HashSet<>();
        String[] projection = { MediaStore.Files.FileColumns._ID };
        Uri collection = MediaStore.Files.getContentUri("external");

        // 构造 selection
        StringBuilder selectionBuilder = new StringBuilder(MediaStore.Files.FileColumns._ID + " IN (");
        String[] selectionArgs = new String[inputIds.size()];
        for (int i = 0; i < inputIds.size(); i++) {
            selectionBuilder.append("?");
            if (i < inputIds.size() - 1) selectionBuilder.append(", ");
            selectionArgs[i] = inputIds.get(i);
        }
        selectionBuilder.append(")");
        String selection = selectionBuilder.toString();

        Cursor cursor = context.getContentResolver().query(
                collection,
                projection,
                selection,
                selectionArgs,
                null
        );

        if (cursor != null) {
            while (cursor.moveToNext()) {
                String id = String.valueOf(cursor.getLong(0));
                existingIds.add(id);
            }
            cursor.close();
        }

        // 没有出现在MediaStore的即为缺失项
        for (String id : inputIds) {
            if (!existingIds.contains(id)) {
                missingIds.add(id);
            }
        }

        return missingIds;
    }



    /**
     * Convert a bitmap to a base64 string, via a temporary file
     */
    public String getThumbnailUriFromBitmap(Context context, Bitmap thumbnail, String fileName, int quality) {
        if (thumbnail == null) {
            return null;
        }

        // Create a temporary file directory
        File cachePath = new File(context.getCacheDir(), "thumbnails");
        if (!cachePath.exists()) {
            cachePath.mkdirs();
        }

        // File path for the thumbnail
        File thumbnailFile = new File(cachePath, "thumb_" + fileName + ".png"); // 使用PNG避免压缩损失

        // ✅ Check if file exists and is valid
        if (!thumbnailFile.exists() || thumbnailFile.length() == 0) {
            try (FileOutputStream out = new FileOutputStream(thumbnailFile)) {
                // PNG 格式是无损的，quality 参数无效但仍需提供
                thumbnail.compress(Bitmap.CompressFormat.PNG, quality, out);
                out.flush();
            } catch (IOException e) {
                e.printStackTrace();
                return null;
            }
        }

        // Convert file to content URI using FileProvider
        return FileProvider.getUriForFile(context, context.getPackageName() + ".fileprovider", thumbnailFile).toString();
    }

    public void cleanOutdatedCache(List<String> idsTobeRemove) {
        File cacheDir = new File(context.getCacheDir(), "thumbnails");
        if (!cacheDir.exists() || !cacheDir.isDirectory()) {
            return; // 没有缩略图目录，不需要清理
        }
        if(idsTobeRemove.size() == 0) {
            return; // 没有要清除的媒体缩略图
        }

        File[] files = cacheDir.listFiles();
        if (files == null) return;

        for (File file : files) {
            String name = file.getName();
            // 仅处理符合命名规则的文件：thumb_<id>.png
            if (name.startsWith("thumb_") && name.endsWith(".png")) {
                try {
                    // 提取出 <id>
                    String idStr = name.substring(6, name.length() - 4); // 去除 "thumb_" 和 ".png"
                    if (idsTobeRemove.contains(idStr)) {
                        boolean deleted = file.delete();
                        if (deleted) {
                            System.out.println("CacheClean outdated thumbnail: " + name);
                        }
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }
    }



    /**
     * Get the real path from the URI
     */
    public String getRealPathFromURI(Context context, Uri uri) {
        String result = null;
        String[] proj = { MediaStore.Images.Media.DATA };
        Cursor cursor = context.getContentResolver().query(uri, proj, null, null, null);
        if (cursor != null) {
            int column_index = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DATA);
            if (cursor.moveToFirst()) {
                result = cursor.getString(column_index);
            }
            cursor.close();
        }
        return result;
    }
}
