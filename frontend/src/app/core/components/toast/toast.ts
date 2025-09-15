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
    top: 1.5rem;
    right: 1.5rem;
    z-index: 50;
    pointer-events: none;
  }

  @media (max-width: 640px) {
    :host {
      top: 1rem;
      right: 1rem;
      left: 1rem;
    }
  }

  .toast-container {
    pointer-events: auto;
    animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .toast-progress {
    animation: progressBar 4s linear forwards;
  }

  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes progressBar {
    from {
      width: 100%;
    }
    to {
      width: 0%;
    }
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
