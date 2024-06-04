import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { environment } from '../../environment/environment';
import { filter, map } from 'rxjs';
import { Job } from 'bullmq';
import { ConvertJob } from 'contracts';

@Injectable({
    providedIn: 'root',
})
export class ConvertService {
    http = inject(HttpClient);

    convert(file: File) {
        const formData: FormData = new FormData();
        formData.append('video', file, file.name);

        return this.http
            .post<Job<ConvertJob>>(environment.apiUrl + '/convert', formData, {
                reportProgress: true,
                observe: 'events',
            })
            .pipe(
                map(this.getEventMessage.bind(this)),
                filter((event) => event !== undefined),
            );
    }

    private getEventMessage(event: HttpEvent<any>): any {
        if (event.type === HttpEventType.UploadProgress) {
            return this.fileUploadProgress(event);
        } else if (event.type === HttpEventType.Response) {
            return event.body;
        }
    }

    private fileUploadProgress(event: any): number {
        return Math.round((100 * event.loaded) / event.total);
    }
}
