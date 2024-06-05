import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConvertService } from '../services/convert.service';
import { StatusService } from '../services/status.service';
import { SkeletonLoaderComponent } from '../shared/skeleton-loader/skeleton-loader.component';
import { Job } from 'bullmq';
import { ConvertJob } from 'contracts';
import { ConvertCardComponent } from '../shared/convert-card/convert-card.component';
import { concatMap, filter, interval, map } from 'rxjs';

@Component({
    selector: 'app-index',
    standalone: true,
    imports: [CommonModule, SkeletonLoaderComponent, ConvertCardComponent],
    templateUrl: './index.component.html',
})
export class IndexComponent implements OnInit {
    convertService = inject(ConvertService);
    statusService = inject(StatusService);

    mouseOver = signal(false);
    formatError = signal(false);

    uploadState = signal<number | null>(null);
    uploads = signal<({ finishConverting: boolean; jobId: string } & ConvertJob)[]>([]);

    pendingUploads = computed(() => this.uploads().filter((upload) => !upload.finishConverting));

    ngOnInit() {
        interval(1000)
            .pipe(
                filter(() => this.pendingUploads().length > 0),
                concatMap(() => this.statusService.getJobsStatus(this.pendingUploads().map((i) => i.jobId))),
            )
            .subscribe((jobs) => {
                jobs.forEach((job) => {
                    if (job.data.gifPath && job.finishedOn) {
                        const tempUploads = this.uploads();
                        const index = tempUploads.findIndex((i) => i.jobId === job.id);

                        if (index !== -1) {
                            tempUploads.splice(index, 1, {
                                ...tempUploads[index],
                                finishConverting: true,
                                gifPath: job.data.gifPath,
                            });
                            this.uploads.set(tempUploads);
                        }
                    }
                });
            });
    }

    onDelete(jobId: string) {
        this.uploads.set(this.uploads().filter((i) => i.jobId !== jobId));
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
                if (typeof event === 'number') {
                    this.uploadState.set(event);
                } else {
                    this.uploadState.set(null);

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
