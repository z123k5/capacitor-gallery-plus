import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HomePage } from './home.page';

import { HomePageRoutingModule } from './home-routing.module';
import { MediaInfoModalComponent } from '../components/media-info-modal/media-info-modal.component';
import { FileSizePipe } from '../pipes/filesize.pipe';

@NgModule({
    imports: [CommonModule, FormsModule, IonicModule, HomePageRoutingModule],
    declarations: [HomePage, MediaInfoModalComponent, FileSizePipe]
})
export class HomePageModule {}
