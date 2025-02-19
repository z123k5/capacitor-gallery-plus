import Foundation
import Capacitor
import SDWebImage
import SDWebImageWebPCoder

@objc(GalleryPlusPlugin)
public class GalleryPlusPlugin: CAPPlugin {
    private let gallery = GalleryPlus() // Instanz der Helper-Klasse

    public override func load() {
        super.load()
        SDImageCodersManager.shared.addCoder(SDImageWebPCoder.shared)
    }

    @objc override public func checkPermissions(_ call: CAPPluginCall) {
        let status = gallery.checkPermissions()
        call.resolve(["status": status])
    }

    @objc override public func requestPermissions(_ call: CAPPluginCall) {
        gallery.requestPermissions { status in
            call.resolve(["status": status])
        }
    }

    @objc func getMediaList(_ call: CAPPluginCall) {
        let mediaType = call.getString("type") ?? "all"
        let limit = call.getInt("limit") ?? 50
        let startAt = call.getInt("startAt") ?? 0
        let thumbnailSize = call.getInt("thumbnailSize") ?? 200
        let sort = call.getString("sort") ?? "newest"
        let includeDetails = call.getBool("includeDetails") ?? false
        let includeBaseColor = call.getBool("includeBaseColor") ?? false
        let filter = call.getString("filter") ?? "all"

        gallery.getMediaList(
            mediaType: mediaType,
            limit: limit,
            startAt: startAt,
            thumbnailSize: thumbnailSize,
            sort: sort,
            includeDetails: includeDetails,
            includeBaseColor: includeBaseColor,
            filter: filter
        ) { mediaArray in
            call.resolve(["media": mediaArray])
        }
    }

    @objc func getMedia(_ call: CAPPluginCall) {
        guard let id = call.getString("id") else {
            call.reject("Media ID is required")
            return
        }

        let includeDetails = call.getBool("includeDetails") ?? false
        let includeBaseColor = call.getBool("includeBaseColor") ?? false
        let includePath = call.getBool("includePath") ?? false
 

        gallery.getMedia(id: id, includeDetails: includeDetails, includeBaseColor: includeBaseColor, includePath: includePath) { mediaItem in
            if let mediaItem = mediaItem {
                call.resolve(mediaItem as! [String: Any])
            } else {
                call.reject("Media not found")
            }
        }
    }
}
