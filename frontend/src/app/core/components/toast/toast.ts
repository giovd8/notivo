import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastType } from '../../models';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'notivo-toast',
  imports: [],
  templateUrl: './toast.html',
  styles: `
  :host {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 50;
    pointer-events: none;
  }

  .toast {
    pointer-events: auto;
  }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Toast {
  private readonly toast = inject(ToastService);
  protected readonly ToastType = ToastType;

  isVisible = this.toast.isVisible;
  message = this.toast.message;
  type = this.toast.type;

  ariaRole = this.toast.ariaRole;
  ariaLive = this.toast.ariaLive;

  close(): void {
    this.toast.close();
  }
}
