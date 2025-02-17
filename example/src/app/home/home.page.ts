import { Component } from '@angular/core';

import { DomSanitizer } from '@angular/platform-browser';
import { InfiniteScrollCustomEvent, ModalController, Platform } from '@ionic/angular';
import { GalleryPlus, MediaItem } from 'capacitor-gallery-plus';
import { MediaInfoModalComponent } from '../components/media-info-modal/media-info-modal.component';
import { Capacitor } from '@capacitor/core';


@Component({
    selector: 'app-home',
    standalone: false,
    templateUrl: './home.page.html',
    styleUrls: ['./home.page.scss']
})
export class HomePage {
    mediaList:  MediaItem[]= [];
    start = 0;
    limit = 15;
    readonly isWeb = !this.platform.is('hybrid');

    constructor(
        public platform: Platform,
        private sanitizer: DomSanitizer,
        private modalController: ModalController
    ) {}

    async getMediaFiles(startAt = 0, limit = this.limit) {
        try {

            const permission = await GalleryPlus.checkPermissions();
            if (permission.status !== 'granted') {
                const request = await GalleryPlus.requestPermissions();
                if (request.status !== 'granted') {
                    console.error('No permission granted.');
                    return;
                }
            }

            const mediaResult = await GalleryPlus.getMediaList({
                type: 'all',
                startAt,
                limit,
                sort: 'newest',
                includeDetails: false,
                includeBaseColor: false,
                thumbnailSize: 200
            });

            const mappedMedia = mediaResult.media.map(entry => {

                if (!this.isWeb) {
                    return {
                        ...entry,
                        thumbnail: Capacitor.convertFileSrc(entry.thumbnail as string)
                    }
                }

                return entry;
            })

            if (startAt === 0) {
                this.mediaList = mappedMedia;
            } else {
                this.mediaList = [...this.mediaList, ...mappedMedia];
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

    async showInfo(media: MediaItem) {

        const data = await GalleryPlus.getMedia({
            id: media.id,
            includeBaseColor: true,
            includeDetails: true,
            path: true
        });

        const modal = await this.modalController.create({
            component: MediaInfoModalComponent,
            componentProps: {
                media: data
            },
            presentingElement:  document.querySelector('.ion-page') as any
        });

        await modal.present();
    }
}
