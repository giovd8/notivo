import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { LabelValue, LabelValueCheck } from '../../models/utils';
import { SubmenuContainer } from '../submenu-container/submenu-container';

@Component({
  selector: 'notivo-multiselect',
  imports: [SubmenuContainer],
  templateUrl: './multiselect.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Multiselect {
  // inputs and outputs
  showOptions = signal<boolean>(false);
  placeholder = input<string>('Seleziona una o più opzioni');
  showSearchBar = input<boolean>(true);
  options = model.required<LabelValue[]>();
  selectedOptions = input<LabelValue[]>();
  isLoading = input<boolean>(false);
  onOptionsSelectedChange = output<string[]>();

  // internals
  id: number = Math.floor(Math.random() * 1000);
  optionsRef = signal<LabelValueCheck[]>([]);

  // accessibility ids
  get buttonId(): string {
    return `multiselect-button-${this.id}`;
  }

  get listboxId(): string {
    return `multiselect-listbox-${this.id}`;
  }

  constructor() {
    effect(() => {
      if (!!this.options()) {
        this.optionsRef.set(
          this.options().map((option) => {
            return {
              label: option.label,
              value: option.value,
              isChecked:
                this.selectedOptions()?.some(
                  (selectedOption) => selectedOption.value === option.value
                ) ?? false,
            };
          })
        );
        this.orderDataBySelectedFirst();
        return;
      }
      this.optionsRef.set([]);
    });
  }

  private orderDataBySelectedFirst(): void {
    this.optionsRef.update((options) => {
      options.sort((a, b) => {
        if ((a as LabelValueCheck).isChecked === (b as LabelValueCheck).isChecked) {
          return a.label.localeCompare(b.label);
        }
        return (a as LabelValueCheck).isChecked ? -1 : 1;
      });
      return options;
    });
  }

  getSelectedOptions(): string {
    return this.optionsRef()
      .filter((option) => (option as LabelValueCheck).isChecked)
      .map((option) => option.label)
      .join(', ');
  }

  setOption(data: LabelValue | LabelValueCheck) {
    const index = this.optionsRef().findIndex((o) => o.value === data.value);
    if (index === -1) {
      console.error('index not found');
      return;
    }
    this.optionsRef.update((options) => {
      options[index] = { ...data, isChecked: !(options[index] as LabelValueCheck).isChecked };
      return options;
    });
    this.onOptionsSelectedChange.emit(
      this.optionsRef()
        .filter((option) => (option as LabelValueCheck).isChecked)
        .map((option) => option.value as string)
    );
  }

  open(event?: KeyboardEvent): void {
    if (event) {
      // Prevent default for keys that would scroll or click the page
      if (event.key === ' ' || event.key === 'Spacebar' || event.key === 'ArrowDown') {
        event.preventDefault();
      }
    }
    this.showOptions.set(true);
  }

  openFromKey(event: Event): void {
    this.open(event as KeyboardEvent);
  }
}
