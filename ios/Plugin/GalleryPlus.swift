import Capacitor
import Foundation
import Photos
import UIKit

@objc(GalleryPlus)
public class GalleryPlus: NSObject {

    @objc public func checkPermissions() -> String {
        let status = PHPhotoLibrary.authorizationStatus()
        switch status {
        case .authorized:
            return "granted"
        case .denied, .restricted:
            return "denied"
        case .limited:
            return "limited"
        case .notDetermined:
            return "notDetermined"
        @unknown default:
            return "unknown"
        }
    }

    @objc public func requestPermissions(completion: @escaping (String) -> Void) {
        PHPhotoLibrary.requestAuthorization { _ in
            completion(self.checkPermissions())
        }
    }

    @objc public func getMediaList(mediaType: String, limit: Int, startAt: Int, thumbnailSize: Int, sort: String, includeDetails: Bool, includeBaseColor: Bool, generatePath: Bool, filter: String, completion: @escaping ([[String: Any]]) -> Void) {
        PHPhotoLibrary.requestAuthorization { status in
            if #available(iOS 14, *) {
                guard status == .authorized || status == .limited else {
                    completion([])
                    return
                }
            } else {
                guard status == .authorized else {
                    completion([])
                    return
                }
            }

            let fetchOptions = PHFetchOptions()
            fetchOptions.sortDescriptors = [NSSortDescriptor(key: "creationDate", ascending: sort == "oldest")]

            var predicateArray: [String] = []
            if mediaType == "image" || mediaType == "all" {
                predicateArray.append("mediaType == \(PHAssetMediaType.image.rawValue)")
            }
            if mediaType == "video" || mediaType == "all" {
                predicateArray.append("mediaType == \(PHAssetMediaType.video.rawValue)")
            }

            if filter == "panorama" {
                predicateArray.append("(mediaSubtypes & \(PHAssetMediaSubtype.photoPanorama.rawValue)) != 0")
            } else if filter == "hdr" {
                predicateArray.append("(mediaSubtypes & \(PHAssetMediaSubtype.photoHDR.rawValue)) != 0")
            } else if filter == "screenshot" {
                predicateArray.append("(mediaSubtypes & \(PHAssetMediaSubtype.photoScreenshot.rawValue)) != 0")
            }

            if !predicateArray.isEmpty {
                fetchOptions.predicate = NSPredicate(format: predicateArray.joined(separator: " OR "))
            }

            let assets = PHAsset.fetchAssets(with: fetchOptions)
            var mediaArray: [[String: Any]] = []
            let imageManager = PHCachingImageManager()
            let targetSize = CGSize(width: thumbnailSize, height: thumbnailSize)
            let dispatchGroup = DispatchGroup()
            let requestOptions = PHImageRequestOptions()
            requestOptions.isSynchronous = true
            requestOptions.deliveryMode = .highQualityFormat

            let count = min(assets.count, startAt + limit)
            for index in startAt..<count {
                let asset = assets.object(at: index)
                var mediaItem: [String: Any] = [
                    "id": asset.localIdentifier,
                    "type": asset.mediaType == .image ? "image" : "video",
                    "createdAt": (asset.creationDate?.timeIntervalSince1970 ?? 0) * 1000,
                    "isFavorite": asset.isFavorite,
                    "isHidden": asset.isHidden,
                    "mimeType": ImageHelper.getMimeType(for: asset),
                    "fileSize": ImageHelper.getFileSize(for: asset) as Any
                ]
                
                if let subtype = ImageHelper.getSubtype(for: asset) {
                    mediaItem["subtype"] = subtype
                }

                dispatchGroup.enter()
                imageManager.requestImage(for: asset, targetSize: targetSize, contentMode: .aspectFit, options: requestOptions) { image, _ in
                    if let image = image, let imageData = image.jpegData(compressionQuality: 0.8) {
                        mediaItem["thumbnail"] = imageData.base64EncodedString()
                    }
                    
                    dispatchGroup.leave()
                }

                if includeBaseColor {
                    dispatchGroup.enter()
                    
                    imageManager.requestImage(for: asset, targetSize: targetSize, contentMode: .aspectFit, options: requestOptions) { image, _ in
                        if let image = image {
                            mediaItem["baseColor"] = ImageHelper.getDominantColor(image: image)
                        }
                        
                        dispatchGroup.leave()
                    }
                }

                if includeDetails {
                    dispatchGroup.enter()
                    ImageHelper.getImageSize(for: asset, imageManager: imageManager) { width, height in
                          if let width = width, let height = height {
                              mediaItem["width"] = width
                              mediaItem["height"] = height
                          }
                          dispatchGroup.leave()
                    }
                }

                mediaArray.append(mediaItem)
            }
            
            dispatchGroup.notify(queue: .main) {
                completion(mediaArray)
            }
        }
    }

    @objc public func getMedia(id: String, includeDetails: Bool, includeBaseColor: Bool, generatePath: Bool, completion: @escaping (NSDictionary?) -> Void) {
        let fetchOptions = PHFetchOptions()
        fetchOptions.predicate = NSPredicate(format: "localIdentifier == %@", id)
        let fetchResult = PHAsset.fetchAssets(with: fetchOptions) // dont move up!


        guard let asset = fetchResult.firstObject else {
            completion(nil)
            return
        }

        var mediaItem: [String: Any] = [
            "id": asset.localIdentifier,
            "type": asset.mediaType == .image ? "image" : "video",
            "createdAt": (asset.creationDate?.timeIntervalSince1970 ?? 0) * 1000,
            "isFavorite": asset.isFavorite,
            "isHidden": asset.isHidden,
            "mimeType":  ImageHelper.getMimeType(for: asset),
            "fileSize": ImageHelper.getFileSize(for: asset) as Any
        ]
        
        if let subtype = ImageHelper.getSubtype(for: asset) {
            mediaItem["subtype"] = subtype
        }

        let dispatchGroup = DispatchGroup()
        let imageManager = PHImageManager.default()

        if generatePath {
            if asset.mediaType == .image {
                dispatchGroup.enter()

                let options = PHImageRequestOptions()
                options.isSynchronous = true
                options.deliveryMode = .highQualityFormat

                imageManager.requestImageDataAndOrientation(for: asset, options: options) { data, _, _, _ in
                    if let data = data {
                        let tempPath = FileManager.default.temporaryDirectory.appendingPathComponent("\(UUID().uuidString).jpg")
                        try? data.write(to: tempPath)
                        mediaItem["path"] = tempPath.absoluteString
                    }
                    dispatchGroup.leave()
                }
                
            } else if asset.mediaType == .video {
                dispatchGroup.enter()

                let options = PHVideoRequestOptions()
                options.isNetworkAccessAllowed = true

                
                imageManager.requestAVAsset(forVideo: asset, options: options) { avAsset, _, _ in
                    if let urlAsset = avAsset as? AVURLAsset {
                        DispatchQueue.main.async {
                            mediaItem["path"] = urlAsset.url.absoluteString
                            dispatchGroup.leave()
                        }
                    } else {
                        dispatchGroup.leave()
                    }
                }
            }
        }

        if includeDetails {
            dispatchGroup.enter()
            
            ImageHelper.getImageSize(for: asset, imageManager: imageManager) { width, height in
                  if let width = width, let height = height {
                      mediaItem["width"] = width
                      mediaItem["height"] = height
                  }
                  dispatchGroup.leave()
            }
        }

        if includeBaseColor {
            dispatchGroup.enter()

            imageManager.requestImage(for: asset, targetSize: CGSize(width: 10, height: 10), contentMode: .aspectFit, options: nil) { image, _ in
                if let image = image {
                    mediaItem["baseColor"] = ImageHelper.getDominantColor(image: image)
                }
                
                dispatchGroup.leave()
            }
        }


        dispatchGroup.notify(queue: .main) {
            completion(mediaItem as NSDictionary)
        }
    }
}
