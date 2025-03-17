package de.metaflash.plugins.galleryplus;

import android.content.Context;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.media.ThumbnailUtils;
import android.net.Uri;
import android.provider.MediaStore;
import android.util.Base64;
import android.content.ContentUris;
import androidx.core.content.FileProvider;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

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
        }

        // Query options
        List<String> projectionList = new ArrayList<>(Arrays.asList(
            MediaStore.Files.FileColumns._ID,
            MediaStore.Files.FileColumns.MEDIA_TYPE,
            MediaStore.Images.Media.DATE_ADDED,
            MediaStore.Images.Media.MIME_TYPE,
            MediaStore.Images.Media.SIZE,
            MediaStore.Video.Media.SIZE
        ));

        // Additional query options, both image / videos
        if (includeDetails) {
            projectionList.add(MediaStore.Images.Media.WIDTH);
            projectionList.add(MediaStore.Images.Media.HEIGHT);
            projectionList.add(MediaStore.Video.Media.WIDTH);
            projectionList.add(MediaStore.Video.Media.HEIGHT);
        }

        String[] projection = projectionList.toArray(new String[0]);

        Cursor cursor = context.getContentResolver().query(
            MediaStore.Files.getContentUri("external"),
            projection,
            selection,
            selectionArgs,
            sortOrder
        );

        if (cursor != null) {
            int count = 0;
            while (cursor.moveToNext()) {
                if (count >= startAt && count < startAt + limit) {
                    try {
                        JSONObject mediaItem = new JSONObject();
                        String id = cursor.getString(0);
                        int type = cursor.getInt(1);
                        long createdAt = cursor.getLong(2) * 1000;

                        mediaItem.put("id", id);
                        mediaItem.put("type", type == MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE ? "image" : "video");
                        mediaItem.put("createdAt", createdAt);
                        mediaItem.put("mimeType", cursor.getString(3));


                        // Get Thumbnails
                        Bitmap thumbnail = null;
                        if (type == MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE) {
                            mediaItem.put("fileSize", cursor.getLong(4));
                            if (includeDetails) {
                                mediaItem.put("width", cursor.getInt(6));
                                mediaItem.put("height", cursor.getInt(7));
                            }
                            thumbnail = MediaStore.Images.Thumbnails.getThumbnail(
                                context.getContentResolver(),
                                Long.parseLong(id),
                                MediaStore.Images.Thumbnails.MINI_KIND,
                                null
                            );
                        } else if (type == MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO) {
                            mediaItem.put("fileSize", cursor.getLong(5));
                            if (includeDetails) {
                                mediaItem.put("width", cursor.getInt(8));
                                mediaItem.put("height", cursor.getInt(9));
                            }
                            Uri videoUri = ContentUris.withAppendedId(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, Long.parseLong(id));
                            thumbnail = ThumbnailUtils.createVideoThumbnail(getRealPathFromURI(context, videoUri), MediaStore.Video.Thumbnails.MINI_KIND);
                        }

                        if (thumbnail != null) {
                            ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
                            thumbnail.compress(Bitmap.CompressFormat.JPEG, 80, byteArrayOutputStream);
                            byte[] byteArray = byteArrayOutputStream.toByteArray();
                            mediaItem.put("thumbnail", getThumbnailUriFromBitmap(context, thumbnail));
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

        return mediaArray;
    }

    /**
     * Convert a bitmap to a base64 string, via a temporary file
     */
    private String getThumbnailUriFromBitmap(Context context, Bitmap thumbnail) {
        if (thumbnail == null) {
            return null;
        }

        // Create a temporary file
        File cachePath = new File(context.getCacheDir(), "thumbnails");
        if (!cachePath.exists()) {
            cachePath.mkdirs();
        }

        File thumbnailFile = new File(cachePath, "thumb_" + System.currentTimeMillis() + ".jpg");
        try (FileOutputStream out = new FileOutputStream(thumbnailFile)) {
            thumbnail.compress(Bitmap.CompressFormat.JPEG, 90, out);
            out.flush();
        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }

        // convert file to `content://` URI
        return FileProvider.getUriForFile(context, context.getPackageName() + ".fileprovider", thumbnailFile).toString();
    }

    /**
     * Get the real path from the URI
     */
    private String getRealPathFromURI(Context context, Uri uri) {
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
