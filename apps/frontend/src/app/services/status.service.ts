import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environment/environment';
import { Job } from 'bullmq';
import { ConvertJob } from 'contracts';

@Injectable({
    providedIn: 'root',
})
export class StatusService {
    http = inject(HttpClient);

    getJobsStatus(jobsId: string[]) {
        return this.http.get<Job<ConvertJob>[]>(environment.apiUrl + `/status?jobId=${jobsId.join(',')}`);
    }
}
