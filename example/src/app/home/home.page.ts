import { Component } from '@angular/core';

import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { InfiniteScrollCustomEvent, ModalController, Platform } from '@ionic/angular';
import { GalleryPlus, MediaItem } from 'capacitor-gallery-plus';
import { MEDIA_MODAL_DATA, MediaInfoModalComponent } from '../components/media-info-modal/media-info-modal.component';

export interface IMediaItemWeb extends MediaItem {
    fileData?: string | SafeUrl;
}

@Component({
    selector: 'app-home',
    standalone: false,
    templateUrl: './home.page.html',
    styleUrls: ['./home.page.scss']
})
export class HomePage {
    mediaList:  IMediaItemWeb[]= [];
    start = 0;
    limit = 15;

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

            const mappedResult = mediaResult.media.map((media) => {
                if (media.thumbnail) {
                    return {
                        ...media,
                        fileData: `data:image/jpeg;base64,${media.thumbnail}`
                    };
                } else if (media.path) {
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

    async showInfo(media: MediaItem) {

        const data = await GalleryPlus.getMedia({
            id: media.id,
            includeBaseColor: true,
            includeDetails: true,
            generatePath: true
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
