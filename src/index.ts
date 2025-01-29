import { registerPlugin } from '@capacitor/core';

import type { GalleryPlusPlugin } from './definitions';
import { GalleryPlusWeb } from './web';

const GalleryPlus = registerPlugin<GalleryPlusPlugin>('GalleryPlus', {
  web: () => new GalleryPlusWeb(),
});

export * from './definitions';
export { GalleryPlus };
