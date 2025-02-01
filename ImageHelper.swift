import Photos
import UniformTypeIdentifiers

class ImageHelper {

    static func getSubtype(for asset: PHAsset) -> String? {
        if asset.mediaSubtypes.contains(.photoLive) {
            return "motion_photo" // 🔥 Consistent for Android & iOS
        } else if asset.mediaSubtypes.contains(.photoPanorama) {
            return "panorama"
        } else if asset.mediaSubtypes.contains(.photoHDR) {
            return "hdr"
        } else if asset.mediaSubtypes.contains(.photoScreenshot) {
            return "screenshot"
        } else if asset.mediaSubtypes.contains(.photoDepthEffect) {
            return "portrait"
        }
        
        return nil
    }
    
    static func getFileSize(for asset: PHAsset) -> Int? {
        guard let resource = PHAssetResource.assetResources(for: asset).first else {
            return nil
        }
        
        return resource.value(forKey: "fileSize") as? Int
    }
    
    static func getImageSize(for asset: PHAsset, imageManager: PHImageManager, completion: @escaping (_ width: Int?, _ height: Int?) -> Void) {
        let options = PHImageRequestOptions()
        options.isSynchronous = true

        imageManager.requestImageDataAndOrientation(for: asset, options: options) { data, _, _, _ in
            if let data = data as CFData?,
               let imageSource = CGImageSourceCreateWithData(data, nil),
               let properties = CGImageSourceCopyPropertiesAtIndex(imageSource, 0, nil) as? [CFString: Any],
               let width = properties[kCGImagePropertyPixelWidth] as? Int,
               let height = properties[kCGImagePropertyPixelHeight] as? Int {
                completion(width, height)
                return
            }
            completion(nil, nil) // Falls keine Größe gefunden wurde
        }
    }
    
    static func getMimeType(for asset: PHAsset) -> String {
        guard let resource = PHAssetResource.assetResources(for: asset).first else {
            return "application/octet-stream"
        }

        let uti = resource.uniformTypeIdentifier
        var mimeType: String?

        if #available(iOS 14.0, *) {
            mimeType = UTType(uti)?.preferredMIMEType
        }

        if mimeType == nil {
            let fileExtension = (resource.originalFilename as NSString).pathExtension.lowercased()
            let mimeTypes: [String: String] = [
                "jpg": "image/jpeg",
                "jpeg": "image/jpeg",
                "png": "image/png",
                "gif": "image/gif",
                "heic": "image/heic",
                "heif": "image/heif",
                "mp4": "video/mp4",
                "mov": "video/quicktime",
                "avi": "video/x-msvideo",
                "mkv": "video/x-matroska"
            ]
            mimeType = mimeTypes[fileExtension] ?? "application/octet-stream" // Fallback
        }

        return mimeType ?? "application/octet-stream"
    }

    /// Extracts the dominant color from an image
    static func getDominantColor(image: UIImage) -> String {
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

    static func getImageMetadata(for asset: PHAsset, imageManager: PHImageManager, completion: @escaping (_ width: Int?, _ height: Int?, _ orientation: Int?, _ colorModel: String?) -> Void) {
        let options = PHImageRequestOptions()
        options.isSynchronous = true

        imageManager.requestImageDataAndOrientation(for: asset, options: options) { data, _, _, _ in
            if let data = data as CFData?,
               let imageSource = CGImageSourceCreateWithData(data, nil),
               let properties = CGImageSourceCopyPropertiesAtIndex(imageSource, 0, nil) as? [CFString: Any] {

                let width = properties[kCGImagePropertyPixelWidth] as? Int
                let height = properties[kCGImagePropertyPixelHeight] as? Int
                let orientation = properties[kCGImagePropertyOrientation] as? Int
                let colorModel = properties[kCGImagePropertyColorModel] as? String

                completion(width, height, orientation, colorModel)
                return
            }
            completion(nil, nil, nil, nil) // Falls keine Daten verfügbar sind
        }
    }
}
