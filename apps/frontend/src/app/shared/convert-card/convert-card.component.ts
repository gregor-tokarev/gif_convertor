import { Component, EventEmitter, Input, Output } from '@angular/core';
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

    @Output() download = new EventEmitter<void>();
    @Output() copy = new EventEmitter<void>();
    @Output() delete = new EventEmitter<void>();
}
