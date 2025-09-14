import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
@Component({
  selector: 'notivo-search-bar',
  imports: [ReactiveFormsModule],
  templateUrl: './search-bar.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchBar {
  readonly searchStringChange = output<string>();
  searchStringValue: string = '';
  searchStringFormControl: FormControl<string | null>;
  private unsubscribeAll$ = new Subject<void>();
  readonly disabled = input<boolean>(false);
  readonly value = input<string>('');
  readonly placeholder = input<string>('Scrivi per cercare');

  constructor() {
    this.searchStringFormControl = new FormControl<string | null>('');
    this.searchStringFormControl.valueChanges
      .pipe(
        takeUntil(this.unsubscribeAll$),
        debounceTime(500)
        // distinctUntilChanged(),
        // startWith(this.searchStringValue)
      )
      .subscribe((value: string | null) => {
        this.searchStringValue = value ? value : '';
        this.searchStringChange.emit(value ? value : '');
      });

    effect(() => {
      const isDisabled = this.disabled();
      isDisabled
        ? this.searchStringFormControl.disable({ emitEvent: false })
        : this.searchStringFormControl.enable({ emitEvent: false });
    });

    effect(() => {
      const v = this.value();
      this.searchStringValue = v;
      this.searchStringFormControl.setValue(v, { emitEvent: false });
    });
  }

  ngOnDestroy(): void {
    this.unsubscribeAll$.next();
    this.unsubscribeAll$.complete();
  }

  clear(event: Event) {
    this.searchStringFormControl.setValue('', { emitEvent: false });
    this.searchStringChange.emit('');
    // necessary for not close multiselect with filter
    event.stopPropagation();
  }
}
