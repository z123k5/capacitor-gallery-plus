import { registerPlugin } from '@capacitor/core';
import { GalleryPlusWeb } from './web';
const GalleryPlus = registerPlugin('GalleryPlus', {
    web: () => new GalleryPlusWeb()
});
export * from './definitions';
export { GalleryPlus };
//# sourceMappingURL=index.js.map