import { Component } from '@angular/core';

import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { InfiniteScrollCustomEvent, Platform } from '@ionic/angular';
import { GalleryPlus } from 'capacitor-gallery-plus';

export interface IMediaResult {
    fileData?: SafeUrl;
    id: string;
    type: 'image' | 'video';
    createdAt: string;
    thumbnail?: string;
    baseColor?: string;
    name?: string;
    width?: number;
    height?: number;
    fileSize?: number;
    path?: string;
}

@Component({
    selector: 'app-home',
    standalone: false,
    templateUrl: './home.page.html',
    styleUrls: ['./home.page.scss']
})
export class HomePage {
    mediaList: IMediaResult[] = [];
    start = 0;
    limit = 15;

    constructor(public platform: Platform, private sanitizer: DomSanitizer) {


    }

    async getMediaFiles(startAt = 0, limit = this.limit) {
        try {
            // Berechtigungen anfordern
            const permission = await GalleryPlus.checkPermissions();
            if (permission.status !== 'granted') {
                const request = await GalleryPlus.requestPermissions();
                if (request.status !== 'granted') {
                    console.error('No permission granted.');
                    return;
                }
            }

            const mediaResult = await GalleryPlus.getMedias({
                type: 'all',
                startAt,
                limit,
                sort: 'newest',
                includeDetails: true,
                includeBaseColor: false,
                thumbnailSize: 200
            });

            const mappedResult = mediaResult.media.map((media) => {
                if (media.thumbnail) {
                    // iOS: Direkt die Thumbnail-Daten verwenden
                    return {
                        ...media,
                        fileData: `data:image/jpeg;base64,${media.thumbnail}`
                    };
                } else if (media.path) {
                    // Web: Blob-URL aus dem Pfad erstellen
                    return {
                        ...media,
                        fileData: this.sanitizer.bypassSecurityTrustUrl(
                            media.path
                        )
                    };
                }

                return media;
            });

            if (startAt === 0) {
                this.mediaList = mappedResult;
            } else {
                this.mediaList = [...this.mediaList, ...mappedResult];
            }
            console.log('MEDIA LIST', this.mediaList);
        } catch (error) {
            console.error('Error on getMedias:', error);
        }
    }

    async onIonInfinite(ev: InfiniteScrollCustomEvent) {
        this.start += this.limit;
        await this.getMediaFiles(this.start, this.limit);
        ev.target.complete();
    }
}
