import { Directive, ElementRef, HostListener, inject, output, Renderer2 } from '@angular/core';

@Directive({
  selector: '[notivoFocusHandler]',
})
export class FocusHandler {
  // services
  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);

  // output
  optionSelected = output<number>();

  // internals
  private currentIndex: number = 0;

  ngAfterViewInit() {
    const items = this.getFocusableItems();
    if (items.length > 0) {
      this.setFocus(items[this.currentIndex]);
    }
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    const items = this.getFocusableItems();
    if (items.length === 0) return;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.moveFocus(items, 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.moveFocus(items, -1);
        break;
      case 'Tab':
        this.handleTabNavigation(items, event);
        break;
      case 'Enter':
        event.preventDefault();
        this.optionSelected.emit(this.currentIndex);
        break;
      default:
        break;
    }
  }

  private getFocusableItems(): HTMLElement[] {
    return Array.from(this.el.nativeElement.querySelectorAll('[data-focusable]'));
  }

  private setFocus(element: HTMLElement) {
    this.clearFocus();
    this.renderer.addClass(element, 'bg-dark/5');
    this.renderer.addClass(element, 'dark:bg-light/5');
    element.focus();
  }

  private clearFocus() {
    const items = this.getFocusableItems();
    items.forEach((item) => {
      this.renderer.removeClass(item, 'bg-dark/5');
      this.renderer.removeClass(item, 'dark:bg-light/5');
    });
  }

  private moveFocus(items: HTMLElement[], step: number) {
    this.currentIndex = (this.currentIndex + step + items.length) % items.length;
    this.setFocus(items[this.currentIndex]);
  }

  private handleTabNavigation(items: HTMLElement[], event: KeyboardEvent) {
    if (event.shiftKey) {
      this.moveFocus(items, -1);
    } else {
      this.moveFocus(items, 1);
    }
    event.preventDefault();
  }
}
