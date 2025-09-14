import { Injectable, signal } from '@angular/core';
import { ModalConfig } from '../shared/models/utils';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private _isOpen = signal(false);
  private _config = signal<ModalConfig | null>(null);

  // Signals for reactive state
  isOpen = this._isOpen.asReadonly();
  config = this._config.asReadonly();

  open(config: ModalConfig): void {
    this._config.set(config);
    this._isOpen.set(true);
  }

  close(): void {
    this._isOpen.set(false);
    this._config.set(null);
  }

  confirm(): void {
    const config = this._config();
    if (config?.onConfirm) {
      config.onConfirm();
    }
    this.close();
  }

  cancel(): void {
    const config = this._config();
    if (config?.onCancel) {
      config.onCancel();
    }
    this.close();
  }
}
