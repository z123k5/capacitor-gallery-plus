import Foundation
import Capacitor

@objc(GalleryPlusPlugin)
public class GalleryPlusPlugin: CAPPlugin {
    private let gallery = GalleryPlus() // Instanz der Helper-Klasse

    @objc public override func checkPermissions(_ call: CAPPluginCall) {
        let status = gallery.checkPermissions()
        call.resolve(["status": status])
    }

    @objc public override func requestPermissions(_ call: CAPPluginCall) {
        gallery.requestPermissions { status in
            call.resolve(["status": status])
        }
    }

    @objc func getMedias(_ call: CAPPluginCall) {
        let mediaType = call.getString("type") ?? "all"
        let limit = call.getInt("limit") ?? 50
        let startAt = call.getInt("startAt") ?? 0
        let thumbnailSize = call.getInt("thumbnailSize") ?? 200
        let sort = call.getString("sort") ?? "newest"
        let includeDetails = call.getBool("includeDetails") ?? false
        let includeBaseColor = call.getBool("includeBaseColor") ?? false
        let generatePath = call.getBool("generatePath") ?? false
        let filter = call.getString("filter") ?? "all"

        gallery.getMedias(
            mediaType: mediaType,
            limit: limit,
            startAt: startAt,
            thumbnailSize: thumbnailSize,
            sort: sort,
            includeDetails: includeDetails,
            includeBaseColor: includeBaseColor,
            generatePath: generatePath,
            filter: filter
        ) { mediaArray in
            call.resolve(["media": mediaArray])
        }
    }
}
