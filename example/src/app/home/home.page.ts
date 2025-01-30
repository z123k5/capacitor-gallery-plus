
import { Component } from '@angular/core';
import { GalleryPlus } from 'capacitor-gallery-plus';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage {

  mediaList: any[] = [];

  constructor() {}

  async getMediaFiles() {
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
        startAt: 0,
        limit: 10,
        sort: 'newest',
        includeDetails: true,
        includeBaseColor: true,
        thumbnailSize: 200
      });

      this.mediaList = mediaResult.media;
    } catch (error) {
      console.error('Error on getMedias:', error);
    }
  }
}
