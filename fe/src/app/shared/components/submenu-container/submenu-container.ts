import { CdkConnectedOverlay, ConnectedPosition, Overlay } from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FocusHandler } from '../../directives/focus-handler';
import { LabelValue, LabelValueCheck } from '../../models/utils';
import { SearchBar } from '../search-bar/search-bar';

@Component({
  selector: 'notivo-submenu-container',
  imports: [CdkConnectedOverlay, SearchBar, FocusHandler],
  templateUrl: './submenu-container.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubmenuContainer {
  // inputs and outputs
  options = input.required<LabelValue[] | LabelValueCheck[]>();
  origin = input<HTMLElement | ElementRef<HTMLElement> | null>(null);

  isLoading = input<boolean>(false);
  isMultiselect = input<boolean>(false);
  showSearchBar = input<boolean>(false);

  onOptionSelected = output<LabelValue | LabelValueCheck>();
  onClose = output<void>();

  query = signal<string>('');
  optionsFiltered = computed(() => {
    if (!!this.options() && !!this.query()) {
      const query = this.query();
      return this.options().filter((option) =>
        option.label.toLowerCase().includes(query.toLowerCase())
      );
    }
    return this.options();
  });

  // Overlay configuration
  private overlay = inject(Overlay);
  private hostRef = inject<ElementRef<HTMLElement>>(ElementRef as any);

  readonly positions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
  ];

  get overlayOrigin(): ElementRef<HTMLElement> {
    const provided = this.origin();
    if (provided instanceof ElementRef) return provided as ElementRef<HTMLElement>;
    if (provided instanceof HTMLElement) return new ElementRef(provided);
    const host = this.hostRef.nativeElement as HTMLElement;
    const sibling = host.previousElementSibling as HTMLElement | null;
    const anchor = sibling ?? host.parentElement ?? host;
    return new ElementRef(anchor);
  }

  scrollStrategy() {
    return this.overlay.scrollStrategies.reposition();
  }

  hasCheck(data: LabelValue | LabelValueCheck): data is LabelValueCheck {
    return 'isChecked' in data;
  }

  originWidth(): number {
    const el = this.overlayOrigin.nativeElement as HTMLElement;
    const rect = el.getBoundingClientRect();
    return rect.width || el.clientWidth;
  }
}
