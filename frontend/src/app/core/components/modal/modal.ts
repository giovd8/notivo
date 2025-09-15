import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ModalService } from '../../../services/modal.service';

@Component({
  selector: 'notivo-modal',
  imports: [CommonModule, OverlayModule],
  templateUrl: './modal.html',
  styles: `
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Modal {
  private modalService = inject(ModalService);

  // Expose service signals to template
  isOpen = this.modalService.isOpen;
  config = this.modalService.config;

  onClose(): void {
    this.modalService.close();
  }

  onConfirm(): void {
    this.modalService.confirm();
  }

  onCancel(): void {
    this.modalService.cancel();
  }

  onBackdropClick(event: Event): void {
    // Close modal when clicking on backdrop
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }
}
