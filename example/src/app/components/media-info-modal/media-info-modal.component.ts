import { Component, Inject, InjectionToken, Input } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { ModalController } from '@ionic/angular';
import { MediaItem } from 'capacitor-gallery-plus';

export const MEDIA_MODAL_DATA = new InjectionToken<MediaItem>('MEDIA_MODAL_DATA');

@Component({
    selector: 'app-media-info-modal',
    standalone: false,
    templateUrl: './media-info-modal.component.html',
    styleUrls: ['./media-info-modal.component.scss']
})
export class MediaInfoModalComponent {
    @Input() media!: MediaItem;

    constructor(
        private modalController: ModalController
    ) {}

    getMediaSrc(): string {
        return this.media.path ? Capacitor.convertFileSrc(this.media.path) : '';
    }

    closeModal() {
        this.modalController.dismiss();
    }
}
