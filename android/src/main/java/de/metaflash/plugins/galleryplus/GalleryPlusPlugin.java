package de.metaflash.plugins.galleryplus;

import android.content.pm.PackageManager;
import android.content.ContentUris;
import android.content.ContentResolver;
import android.content.Context;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.Manifest;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;
import android.util.Log;
import android.util.Size;
import androidx.core.app.ActivityCompat;
import androidx.palette.graphics.Palette;

import com.getcapacitor.*;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONArray;

import java.io.IOException;


@CapacitorPlugin(name = "GalleryPlus")
public class GalleryPlusPlugin extends Plugin {
    private static final int REQUEST_PERMISSION = 1001;
    private GalleryPlus gallery;

    @Override
    public void load() {
        gallery = new GalleryPlus(getContext());
    }

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        boolean granted = ActivityCompat.checkSelfPermission(getContext(), Manifest.permission.READ_EXTERNAL_STORAGE)
                == PackageManager.PERMISSION_GRANTED;
        JSObject result = new JSObject();
        result.put("status", granted ? "granted" : "denied");
        call.resolve(result);
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        if (ActivityCompat.shouldShowRequestPermissionRationale(getActivity(), Manifest.permission.READ_EXTERNAL_STORAGE)) {
            call.reject("Permission denied");
            return;
        }

        ActivityCompat.requestPermissions(getActivity(), new String[]{Manifest.permission.READ_EXTERNAL_STORAGE}, REQUEST_PERMISSION);
        call.resolve();
    }

    @PluginMethod
    public void getMediaList(PluginCall call) {
        String mediaType = call.getString("type", "all");
        int limit = call.getInt("limit", 50);
        int startAt = call.getInt("startAt", 0);
        String sort = call.getString("sort", "newest");
        boolean includeDetails = call.getBoolean("includeDetails", false);

        JSONArray mediaArray = gallery.getMediaList(mediaType, limit, startAt, sort, includeDetails);
        JSObject result = new JSObject();
        result.put("media", mediaArray);
        call.resolve(result);
    }

    @PluginMethod
    public void getMedia(PluginCall call) {
        String id = call.getString("id");
        boolean includeDetails = call.getBoolean("includeDetails", false);
        boolean includeBaseColor = call.getBoolean("includeBaseColor", false);
        boolean includePath = call.getBoolean("includePath", false);
        Context context = getContext();
        ContentResolver contentResolver = context.getContentResolver();
        
        Uri contentUri = MediaStore.Files.getContentUri("external");
        String selection = MediaStore.Files.FileColumns._ID + "=?";
        String[] selectionArgs = new String[]{id};

        String[] projection = {
            MediaStore.Files.FileColumns._ID,
            MediaStore.Files.FileColumns.MEDIA_TYPE,
            MediaStore.Files.FileColumns.DATE_ADDED,
            MediaStore.Files.FileColumns.MIME_TYPE,
            MediaStore.Files.FileColumns.SIZE,
            MediaStore.Images.Media.WIDTH,
            MediaStore.Images.Media.HEIGHT,
            MediaStore.Video.Media.DURATION
        };

        try (Cursor cursor = contentResolver.query(contentUri, projection, selection, selectionArgs, null)) {
            if (cursor != null && cursor.moveToFirst()) {
                int mediaType = cursor.getInt(cursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns.MEDIA_TYPE));
                String mimeType = cursor.getString(cursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns.MIME_TYPE));
                long createdAt = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns.DATE_ADDED)) * 1000;
                long fileSize = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns.SIZE));
                int width = 0, height = 0;
                if (includeDetails) {
                    width = cursor.getInt(cursor.getColumnIndexOrThrow(MediaStore.Images.Media.WIDTH));
                    height = cursor.getInt(cursor.getColumnIndexOrThrow(MediaStore.Images.Media.HEIGHT));
                }

                JSObject mediaItem = new JSObject();
                mediaItem.put("id", id);
                mediaItem.put("type", mediaType == MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE ? "image" : "video");
                mediaItem.put("createdAt", createdAt);
                mediaItem.put("mimeType", mimeType);
                mediaItem.put("fileSize", fileSize);
                if (includeDetails) {
                    mediaItem.put("width", width);
                    mediaItem.put("height", height);
                }

                // Process includeBaseColor
                if (includeBaseColor && mediaType == MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE) {
                    Uri imageUri = ContentUris.withAppendedId(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, Long.parseLong(id));
                    Bitmap bitmap = getThumbnailBitmap(contentResolver, imageUri, 10, 10);
                    if (bitmap != null) {
                        mediaItem.put("baseColor", getDominantColor(bitmap));
                    }
                }

                // Process includePath
                if (includePath) {
                    Uri mediaUri;
                    if (mediaType == MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE) {
                        mediaUri = ContentUris.withAppendedId(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, Long.parseLong(id));
                    } else {
                        mediaUri = ContentUris.withAppendedId(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, Long.parseLong(id));
                    }
                    mediaItem.put("path", mediaUri.toString());
                }

                call.resolve(mediaItem);
            } else {
                call.reject("Media not found");
            }
        } catch (Exception e) {
            call.reject("Error retrieving media: " + e.getMessage());
        }
    }

    // Get thumbnail bitmap for an image
    private Bitmap getThumbnailBitmap(ContentResolver contentResolver, Uri uri, int width, int height) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                return contentResolver.loadThumbnail(uri, new Size(width, height), null);
            } else {
                return MediaStore.Images.Thumbnails.getThumbnail(
                    contentResolver,
                    ContentUris.parseId(uri),
                    MediaStore.Images.Thumbnails.MINI_KIND,
                    null
                );
            }
        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }
    }

    // Compute the dominant color of an image
    private String getDominantColor(Bitmap bitmap) {
        if (bitmap == null) return null;
        Palette palette = Palette.from(bitmap).generate();
        int color = palette.getDominantColor(Color.BLACK);
        return String.format("#%06X", (0xFFFFFF & color));
    }
}
