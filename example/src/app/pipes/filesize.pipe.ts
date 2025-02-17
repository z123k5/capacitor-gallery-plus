import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'fileSize',
    standalone: false
})
export class FileSizePipe implements PipeTransform {
    transform(size: number, decimalPlaces: number = 2): string {
        if (!size) return '0 Bytes';

        const units = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(decimalPlaces)} ${units[unitIndex]}`;
    }
}
