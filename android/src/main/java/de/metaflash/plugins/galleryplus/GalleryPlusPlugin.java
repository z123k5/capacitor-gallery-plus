package de.metaflash.plugins.galleryplus;

import android.content.pm.PackageManager;
import android.content.ContentUris;
import android.content.ContentResolver;
import android.content.Context;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.Manifest;
import android.media.ThumbnailUtils;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;
import android.util.Size;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.exifinterface.media.ExifInterface;
import androidx.palette.graphics.Palette;

import com.getcapacitor.*;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.IOException;
import java.io.InputStream;
import java.util.*;


@CapacitorPlugin(name = "GalleryPlus")
public class GalleryPlusPlugin extends Plugin {
    private static final int REQUEST_PERMISSION = 1001;
    private GalleryPlus gallery;

    private Context context;

    @Override
    public void load() {
        gallery = new GalleryPlus(getContext());
        context = getContext();
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
                            try {
                                thumbnail = MediaStore.Images.Thumbnails.getThumbnail(
                                        context.getContentResolver(),
                                        id,
                                        MediaStore.Images.Thumbnails.FULL_SCREEN_KIND,
                                        null
                                );
                            } catch (Exception e) {
                                e.printStackTrace();
                            }
                        } else {
                            try {
                                Uri videoUri = ContentUris.withAppendedId(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, id);
                                thumbnail = ThumbnailUtils.createVideoThumbnail(gallery.getRealPathFromURI(context, videoUri), MediaStore.Video.Thumbnails.FULL_SCREEN_KIND);
                            } catch (Exception e) {
                                e.printStackTrace();
                            }
                        }


                        if (thumbnail != null) {
//                            ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
//                            thumbnail.compress(Bitmap.CompressFormat.JPEG, 80, byteArrayOutputStream);
//                            byte[] byteArray = byteArrayOutputStream.toByteArray();
                            mediaItem.put("thumbnailV1", gallery.getThumbnailUriFromBitmap(context, thumbnail, id + "_50", 50));
                            mediaItem.put("thumbnailV2", gallery.getThumbnailUriFromBitmap(context, thumbnail, id + "_100", 100));
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

        JSObject result = new JSObject();
        result.put("media", mediaArray);
        result.put("totalCount", totalCount);
        call.resolve(result);
    }

    @PluginMethod
    public void getMediaListByManyId(PluginCall call) {
        JSArray idArray = call.getArray("ids", new JSArray());
        boolean includeDetails = call.getBoolean("includeDetails", false);
        boolean includePath = call.getBoolean("includePath", false);
        boolean includeBaseColor = call.getBoolean("includeBaseColor", false);

        List<String> idList = new ArrayList<>();
        for (int i = 0; i < idArray.length(); i++) {
            idList.add(idArray.optString(i));
        }

        if (idList.isEmpty()) {
            call.reject("No media IDs provided.");
            return;
        }

        // 构造 selection: _ID IN (?, ?, ?...)
        StringBuilder selectionBuilder = new StringBuilder(MediaStore.Files.FileColumns._ID + " IN (");
        String[] selectionArgs = new String[idList.size()];
        for (int i = 0; i < idList.size(); i++) {
            selectionBuilder.append("?");
            if (i < idList.size() - 1) selectionBuilder.append(",");
            selectionArgs[i] = idList.get(i);
        }
        selectionBuilder.append(")");
        String selection = selectionBuilder.toString();

        List<String> projectionList = new ArrayList<>(Arrays.asList(
                MediaStore.Files.FileColumns._ID,
                MediaStore.Files.FileColumns.MEDIA_TYPE,

                MediaStore.Images.Media.TITLE,
                MediaStore.Images.Media.SIZE,
                MediaStore.Video.Media.DURATION,
                MediaStore.Images.Media.DATE_ADDED,
                MediaStore.Images.Media.IS_FAVORITE,
                MediaStore.Images.Media.MIME_TYPE,
                MediaStore.Images.Media.DATE_MODIFIED
        ));

        if (includeDetails) {
            projectionList.add(MediaStore.Images.Media.WIDTH);
            projectionList.add(MediaStore.Images.Media.HEIGHT);
        }
        if (includePath) {
            projectionList.add(MediaStore.Images.Media.DATA); // 路径字段
        }

        String[] projection = projectionList.toArray(new String[0]);
        Uri collection = MediaStore.Files.getContentUri("external");

        Cursor cursor = context.getContentResolver().query(
                collection,
                projection,
                selection,
                selectionArgs,
                null
        );

        // 用于临时存储媒体项，方便之后根据输入 ID 顺序排序
        Map<String, JSONObject> mediaMap = new HashMap<>();

        if (cursor != null) {
            while (cursor.moveToNext()) {
                try {
                    JSONObject mediaItem = new JSONObject();
                    long id = cursor.getLong(0);
                    int type = cursor.getInt(1);

                    if (type != MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE && type != MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO) {
                        continue;
                    }

                    mediaItem.put("id", String.valueOf(id));
                    mediaItem.put("name", cursor.getString(2));
                    mediaItem.put("createdAt", cursor.getLong(5) * 1000);
                    mediaItem.put("modifiedAt", cursor.getLong(8));
                    mediaItem.put("isFavorite", cursor.getInt(6));
                    mediaItem.put("mimeType", cursor.getString(7));

                    if (type == MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO) {
                        mediaItem.put("type", "video");
                        mediaItem.put("duration", cursor.getLong(4));
                    } else {
                        mediaItem.put("type", "image");
                    }

                    if (includeDetails) {
                        mediaItem.put("fileSize", cursor.getLong(3));
                        mediaItem.put("width", cursor.getInt(9));
                        mediaItem.put("height", cursor.getInt(10));
                    }

                    String realPath = null;
                    if (includePath) {
                        int pathIndex = includeDetails ? 11 : 9;
                        realPath = cursor.getString(pathIndex);
                        mediaItem.put("path", realPath);
                    }

                    Bitmap thumbnail = null;
                    if (type == MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE) {
                        try {
                            thumbnail = MediaStore.Images.Thumbnails.getThumbnail(
                                    context.getContentResolver(),
                                    id,
                                    MediaStore.Images.Thumbnails.FULL_SCREEN_KIND,
                                    null
                            );
                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                    } else {
                        try {
                            Uri videoUri = ContentUris.withAppendedId(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, id);
                            realPath = realPath != null ? realPath : gallery.getRealPathFromURI(context, videoUri);
                            thumbnail = ThumbnailUtils.createVideoThumbnail(
                                    realPath,
                                    MediaStore.Video.Thumbnails.FULL_SCREEN_KIND
                            );
                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                    }

                    if (thumbnail != null) {
                        mediaItem.put("thumbnailV1", gallery.getThumbnailUriFromBitmap(context, thumbnail, id + "_50", 50));
                        mediaItem.put("thumbnailV2", gallery.getThumbnailUriFromBitmap(context, thumbnail, id + "_100", 100));

                        if (includeBaseColor) {
                            String color = getDominantColor(thumbnail);
                            mediaItem.put("baseColor", color);
                        }
                    }

                    // 保存到 Map 以便之后排序
                    mediaMap.put(String.valueOf(id), mediaItem);

                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
            cursor.close();
        }

        // 按输入 idList 顺序构造 JSONArray
        JSONArray mediaArray = new JSONArray();
        for (String id : idList) {
            if (mediaMap.containsKey(id)) {
                mediaArray.put(mediaMap.get(id));
            }
        }

        JSObject result = new JSObject();
        result.put("media", mediaArray);
        result.put("totalCount", mediaArray.length());
        call.resolve(result);
    }




    @PluginMethod
    public void getMediaListShouldBeDelete(PluginCall call) {
        JSArray idArray = call.getArray("ids", new JSArray());
        List<String> inputIds = new ArrayList<>();
        for (int i = 0; i < idArray.length(); i++) {
            inputIds.add(idArray.optString(i));
        }

        List<String> missingIds = gallery.getMissingMediaIds(inputIds);

        JSObject result = new JSObject();
        result.put("shouldDelete", new JSArray(missingIds));
        gallery.cleanOutdatedCache(missingIds);
        call.resolve(result);
    }


    private double score2dimensionality(String string) {
        double dimensionality = 0.0;
        if (null==string){
            return dimensionality;
        }

        //用 ，将数值分成3份
        String[] split = string.split(",");
        for (int i = 0; i < split.length; i++) {

            String[] s = split[i].split("/");
            //用112/1得到度分秒数值
            double v = Double.parseDouble(s[0]) / Double.parseDouble(s[1]);
            //将分秒分别除以60和3600得到度，并将度分秒相加
            dimensionality=dimensionality+v/Math.pow(60,i);
        }
        return dimensionality;
    }

    @PluginMethod
    public void getMedia(PluginCall call) {
        String id = call.getString("id");
        long id_num = Long.parseLong(id);
        boolean includeDetails = call.getBoolean("includeDetails", false);
        boolean includeBaseColor = call.getBoolean("includeBaseColor", false);
        boolean includePath = call.getBoolean("includePath", false);
        Context context = getContext();
        ContentResolver contentResolver = context.getContentResolver();

        // Uniform collection Uri, for sometimes it cannot acquire the MEDIA_TYPE_IMAGE  folder.
        Uri collection = MediaStore.Files.getContentUri("external");

        String selection = MediaStore.Files.FileColumns._ID + "=?";

        String[] selectionArgs = new String[]{id};

        List<String> projectionList = new ArrayList<>(Arrays.asList(
            // Image Projection
            MediaStore.Files.FileColumns._ID,
            MediaStore.Files.FileColumns.MEDIA_TYPE,

            MediaStore.Images.Media.TITLE,
            MediaStore.Images.Media.SIZE,
            MediaStore.Video.Media.DURATION,
            MediaStore.Images.Media.DATE_ADDED,
            MediaStore.Images.Media.IS_FAVORITE,
            MediaStore.Images.Media.MIME_TYPE

//                MediaStore.Images.Media.WIDTH,
//                MediaStore.Images.Media.HEIGHT,
//                MediaStore.Video.Media.WIDTH,
//                MediaStore.Video.Media.HEIGHT,
        ));
        // Additional query options, both image / videos
        if (includeDetails) {
            projectionList.add(MediaStore.Images.Media.WIDTH);
            projectionList.add(MediaStore.Images.Media.HEIGHT);
        }
        String[] projection = projectionList.toArray(new String[0]);

        double lat = 0, lon = 0;
        String dev = "";

        if (includeDetails) {
            Uri imageUri = ContentUris.withAppendedId(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, id_num);
            Uri mediaUri = imageUri;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_MEDIA_LOCATION)
                        != PackageManager.PERMISSION_GRANTED) {
                    System.out.println("Permission granting....");
                    ActivityCompat.requestPermissions(
                            getActivity(),
                            new String[]{Manifest.permission.ACCESS_MEDIA_LOCATION},
                            1001 // 请求码，随便设
                    );
                }
                mediaUri = MediaStore.setRequireOriginal(mediaUri);
            }
            try (InputStream inputStream = contentResolver.openInputStream(mediaUri)) {
                if (inputStream != null) {
                    ExifInterface exifInterface = new ExifInterface(inputStream);
                    // 这里可以从exifInterface读取各种EXIF字段
                    String latitude = exifInterface.getAttribute(ExifInterface.TAG_GPS_LATITUDE);
                    String longitude = exifInterface.getAttribute(ExifInterface.TAG_GPS_LONGITUDE);
                    String latRef = exifInterface.getAttribute(ExifInterface.TAG_GPS_LATITUDE_REF);
                    String lngRef = exifInterface.getAttribute(ExifInterface.TAG_GPS_LONGITUDE_REF);

                    dev = exifInterface.getAttribute(ExifInterface.TAG_MODEL);
                    lat = score2dimensionality(latitude);
                    lon = score2dimensionality(longitude);

                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }

        try (Cursor cursor = contentResolver.query(collection, projection, selection, selectionArgs, null)) {
            if (cursor != null && cursor.moveToFirst()) {
                int mediaType = cursor.getInt(cursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns.MEDIA_TYPE));
                String mimeType = cursor.getString(cursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns.MIME_TYPE));
                long createdAt = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns.DATE_ADDED)) * 1000;
                long fileSize = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.Files.FileColumns.SIZE));

                int type = cursor.getInt(1);

                JSObject mediaItem = new JSObject();

                if (type == MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE || type == MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO) {
                    mediaItem.put("id", id);
                    mediaItem.put("name", cursor.getString(2));
                    mediaItem.put("createdAt",  cursor.getLong(5) * 1000);
                    mediaItem.put("isFavorite", cursor.getInt(6));
                    mediaItem.put("mimeType", cursor.getString(7));
                } else throw new IOException("Unsupported Media Type: " + mimeType + " , id = " + id);
                if (type == MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO) {
                    mediaItem.put("duration", cursor.getLong(4));
                    mediaItem.put("type", "video");
                } else
                    mediaItem.put("type", "image");

                if (includeDetails) {
                    mediaItem.put("fileSize", cursor.getLong(3));
                    mediaItem.put("width", cursor.getInt(8));
                    mediaItem.put("height", cursor.getInt(9));
                    mediaItem.put("exif_dev", dev);
                    mediaItem.put("exif_lat", lat);
                    mediaItem.put("exif_lon", lon);
                }

                // Process includeBaseColor
                if (includeBaseColor) {
                    Bitmap thumbnail = null;
                    if (type == MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE) {
                        Uri imageUri = ContentUris.withAppendedId(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, id_num);
                        thumbnail = getThumbnailColorBitmap(contentResolver, imageUri);
                    } else {
                        Uri videoUri = ContentUris.withAppendedId(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, id_num);
                        thumbnail = ThumbnailUtils.createVideoThumbnail(gallery.getRealPathFromURI(context, videoUri), MediaStore.Video.Thumbnails.FULL_SCREEN_KIND);
                    }
                    if (thumbnail != null)
                        mediaItem.put("baseColor", getDominantColor(thumbnail));
                }

                // Process includePath
                if (includePath) {
                    Uri mediaUri;
                    if (mediaType == MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE) {
                        mediaUri = ContentUris.withAppendedId(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, id_num);
                    } else {
                        mediaUri = ContentUris.withAppendedId(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, id_num);
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
    private Bitmap getThumbnailColorBitmap(ContentResolver contentResolver, Uri uri) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                return contentResolver.loadThumbnail(uri, new Size(640, 480), null);
            } else {
                return MediaStore.Images.Thumbnails.getThumbnail(
                    contentResolver,
                    ContentUris.parseId(uri),
                    MediaStore.Images.Thumbnails.FULL_SCREEN_KIND,
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
