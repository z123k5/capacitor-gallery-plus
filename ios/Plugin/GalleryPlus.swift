import Foundation
import Photos
import Capacitor
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
        PHPhotoLibrary.requestAuthorization { status in
            completion(self.checkPermissions())
        }
    }

    @objc public func getMedias(mediaType: String, limit: Int, startAt: Int, thumbnailSize: Int, sort: String, includeDetails: Bool, includeBaseColor: Bool, generatePath: Bool, filter: String, completion: @escaping ([[String: Any]]) -> Void) {
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
            let requestOptions = PHImageRequestOptions()
            requestOptions.isSynchronous = true
            requestOptions.deliveryMode = .highQualityFormat

            let count = min(assets.count, startAt + limit)
            for index in startAt..<count {
                let asset = assets.object(at: index)
                var mediaItem: [String: Any] = [
                    "id": asset.localIdentifier,
                    "type": asset.mediaType == .image ? "image" : "video",
                    "createdAt": asset.creationDate?.description ?? ""
                ]

                imageManager.requestImage(for: asset, targetSize: targetSize, contentMode: .aspectFit, options: requestOptions) { image, _ in
                    if let image = image, let imageData = image.jpegData(compressionQuality: 0.8) {
                        mediaItem["thumbnail"] = imageData.base64EncodedString()
                    }
                }

                if includeBaseColor {
                    imageManager.requestImage(for: asset, targetSize: targetSize, contentMode: .aspectFit, options: requestOptions) { image, _ in
                        if let image = image {
                            let baseColor = self.getDominantColor(image: image) // Annahme: gibt immer einen String zurück
                            mediaItem["baseColor"] = baseColor
                        }
                    }
                }

                if includeDetails {
                    let resource = PHAssetResource.assetResources(for: asset).first
                    if let fileSize = resource?.value(forKey: "fileSize") as? Int {
                        mediaItem["fileSize"] = fileSize
                    }

                    imageManager.requestImage(for: asset, targetSize: targetSize, contentMode: .aspectFit, options: requestOptions) { image, _ in
                        if let image = image {
                            mediaItem["width"] = Int(image.size.width)
                            mediaItem["height"] = Int(image.size.height)
                        }
                    }
                }

                mediaArray.append(mediaItem)
            }
            completion(mediaArray)
        }
    }
    
    /// Extracts the dominant color from an image
    private func getDominantColor(image: UIImage) -> String {
        guard let cgImage = image.cgImage else { return "#000000" }

        let width = 1
        let height = 1
        let colorSpace = CGColorSpaceCreateDeviceRGB()
        var rawData = [UInt8](repeating: 0, count: 4)
        let bitmapInfo = CGImageAlphaInfo.premultipliedLast.rawValue
        let context = CGContext(data: &rawData,
                                width: width,
                                height: height,
                                bitsPerComponent: 8,
                                bytesPerRow: width * 4,
                                space: colorSpace,
                                bitmapInfo: bitmapInfo)

        context?.draw(cgImage, in: CGRect(x: 0, y: 0, width: width, height: height))

        let red = CGFloat(rawData[0]) / 255.0
        let green = CGFloat(rawData[1]) / 255.0
        let blue = CGFloat(rawData[2]) / 255.0

        return String(format: "#%02X%02X%02X", Int(red * 255), Int(green * 255), Int(blue * 255))
    }
}
