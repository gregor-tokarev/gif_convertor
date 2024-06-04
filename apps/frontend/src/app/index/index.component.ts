import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConvertService } from '../services/convert.service';
import { StatusService } from '../services/status.service';
import { SkeletonLoaderComponent } from '../shared/skeleton-loader/skeleton-loader.component';
import { Job } from 'bullmq';
import { ConvertJob } from 'contracts';
import { ConvertCardComponent } from '../shared/convert-card/convert-card.component';

@Component({
    selector: 'app-index',
    standalone: true,
    imports: [CommonModule, SkeletonLoaderComponent, ConvertCardComponent],
    templateUrl: './index.component.html',
})
export class IndexComponent {
    convertService = inject(ConvertService);
    statusService = inject(StatusService);

    mouseOver = signal(false);
    formatError = signal(false);

    uploadState = signal<number | null>(null);
    uploads = signal<({ finishConverting: boolean; jobId: string } & ConvertJob)[]>([]);

    constructor() {
        effect(() => {
            // if (!this.fileUploaded()) return;
            //
            // setInterval(() => {
            //     const job = this.job();
            //     if (!job) return;
            //     this.statusService.getJobStatus(job['id']).subscribe({
            //         next: (event) => {
            //             this.finalGif.set(event.data.gifPath ?? null);
            //         },
            //     });
            // }, 2000);
        });
    }
    onDragOver(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.mouseOver.set(true);
    }

    onDragLeave(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.mouseOver.set(false);
    }

    onDrop(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();

        const file = event.dataTransfer?.files[0];
        if (!file) return;
        this.formatError.set(false);

        if (file.type !== 'video/mp4') {
            this.formatError.set(true);
            return;
        }

        this.uploadState.set(0);
        this.mouseOver.set(false);

        this.convertService.convert(file).subscribe({
            next: (event) => {
                console.log(event);
                if (typeof event === 'number') {
                    this.uploadState.set(event);
                } else {
                    this.uploadState.set(null);

                    console.log(event);
                    this.uploads.set([
                        ...this.uploads(),
                        { finishConverting: false, jobId: event.id, filePath: event.data.filePath },
                    ]);
                }
            },
            complete: () => this.uploadState.set(null),
        });
    }
}
