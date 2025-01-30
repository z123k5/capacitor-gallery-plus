import { Component } from '@angular/core';

import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { GalleryPlus } from 'capacitor-gallery-plus';


export interface IMediaResult {
  fileData?: SafeUrl;
  id: string;
  type: "image" | "video";
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
  styleUrls: ['./home.page.scss'],
})
export class HomePage {
  mediaList: IMediaResult[] = [];

  constructor(private sanitizer: DomSanitizer) {}

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
        limit: 20,
        sort: 'newest',
        includeDetails: true,
        includeBaseColor: false,
        thumbnailSize: 200,
      });

      this.mediaList = mediaResult.media.map(media => {
        if (media.thumbnail) {
          // iOS: Direkt die Thumbnail-Daten verwenden
          return {
            ...media,
            fileData: `data:image/jpeg;base64,${media.thumbnail}`,
          };
        } else if (media.path) {
          // Web: Blob-URL aus dem Pfad erstellen
          return {
            ...media,
            fileData: this.sanitizer.bypassSecurityTrustUrl(media.path),
          };
        }

        return media;
      });

      console.log("MEDIA LIST", this.mediaList);

    } catch (error) {
      console.error('Error on getMedias:', error);
    }
  }
}
