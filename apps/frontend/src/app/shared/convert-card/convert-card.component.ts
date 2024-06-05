import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonLoaderComponent } from '../skeleton-loader/skeleton-loader.component';

@Component({
    selector: 'app-convert-card',
    standalone: true,
    imports: [CommonModule, SkeletonLoaderComponent],
    templateUrl: './convert-card.component.html',
})
export class ConvertCardComponent {
    @Input() loading: boolean = true;
    @Input() url?: string;

    @Output() delete = new EventEmitter<void>();

    coping = signal(false);

    async onCopy() {
        await navigator.clipboard.writeText('http://localhost:9000/uploads/' + this.url);

        this.coping.set(true);

        setTimeout(() => {
            this.coping.set(false);
        }, 1000);
    }
}
