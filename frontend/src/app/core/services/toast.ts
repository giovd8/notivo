import { Injectable, Signal, computed, signal } from '@angular/core';
import { ToastShowOptions, ToastType } from '../models';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly isVisibleSignal = signal(false);
  private readonly messageSignal = signal('');
  private readonly typeSignal = signal<ToastType>(ToastType.Success);

  private autoCloseTimerId: number | null = null;

  readonly isVisible: Signal<boolean> = this.isVisibleSignal.asReadonly();
  readonly message: Signal<string> = this.messageSignal.asReadonly();
  readonly type: Signal<ToastType> = this.typeSignal.asReadonly();

  readonly ariaRole = computed(() => (this.typeSignal() === ToastType.Error ? 'alert' : 'status'));
  readonly ariaLive = computed(() =>
    this.typeSignal() === ToastType.Error ? 'assertive' : 'polite'
  );

  show(options: ToastShowOptions): void {
    const { message, type, seconds = 5 } = options;

    // Clear any previous timer
    this.clearTimer();

    this.messageSignal.set(message);
    this.typeSignal.set(type);
    this.isVisibleSignal.set(true);

    if (seconds && seconds > 0) {
      this.autoCloseTimerId = window.setTimeout(() => {
        this.close();
      }, seconds * 1000);
    }
  }

  close(): void {
    this.clearTimer();
    this.isVisibleSignal.set(false);
  }

  private clearTimer(): void {
    if (this.autoCloseTimerId !== null) {
      window.clearTimeout(this.autoCloseTimerId);
      this.autoCloseTimerId = null;
    }
  }
}
