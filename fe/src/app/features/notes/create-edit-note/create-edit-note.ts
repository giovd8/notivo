import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import Quill from 'quill';
import { ToastType } from '../../../core/models';
import { ToastService } from '../../../core/services/toast';
import { NoteService } from '../../../services/note';
import { Multiselect } from '../../../shared/components/multiselect/multiselect';

@Component({
  selector: 'notivo-create-edit-note',
  imports: [ReactiveFormsModule, Multiselect],
  templateUrl: './create-edit-note.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateEditNote {
  private readonly fb = new FormBuilder();
  private readonly api = inject(NoteService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly submitting = signal(false);

  readonly editorEl = viewChild<ElementRef<HTMLDivElement>>('quillEditor');
  private quill: Quill | null = null;

  // Treat empty rich-text (e.g., <p><br></p>) as empty for validation
  private readonly requiredRichText = (
    control: AbstractControl<string | null>
  ): ValidationErrors | null => {
    const html = control.value ?? '';
    const text = html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim();
    return text.length > 0 ? null : { required: true };
  };

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    body: ['', [this.requiredRichText]],
    sharedWith: this.fb.nonNullable.control<string>(''),
    tags: this.fb.nonNullable.control<string>(''),
  });

  async ngAfterViewInit(): Promise<void> {
    const quillContainer = this.editorEl()?.nativeElement;
    if (!quillContainer) {
      console.error('Quill container not found');
      this.toast.show({
        message: 'Errore nella creazione della nota',
        type: ToastType.Error,
        seconds: 6,
      });
      return;
    }

    this.quill = new Quill(quillContainer, {
      theme: 'snow',
      placeholder: 'Inserisci il contenuto della nota...',
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link'],
        ],
      },
    });

    // Accessibility attributes
    this.quill.root.id = 'body-editor';
    this.quill.root.setAttribute('aria-label', 'Editor contenuto');
    this.quill.root.setAttribute('aria-required', 'true');

    // Initialize content from form control
    const initial = this.form.value.body ?? '';
    if (initial) this.quill.root.innerHTML = initial;

    // Update form control on changes
    this.quill.on('text-change', () => {
      if (!this.quill) return;
      const html = this.quill.root.innerHTML;
      this.form.controls.body.setValue(html);
      this.form.controls.body.updateValueAndValidity({ emitEvent: false });
    });

    // Mark as touched on blur
    this.quill.on('selection-change', (range: any, oldRange: any) => {
      if (range === null && oldRange) {
        this.form.controls.body.markAsTouched();
      }
    });
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) return;
    this.submitting.set(true);

    const sharedWith =
      this.form.value.sharedWith
        ?.split(',')
        .map((s) => s.trim())
        .filter(Boolean) ?? [];
    const tags =
      this.form.value.tags
        ?.split(',')
        .map((s) => s.trim())
        .filter(Boolean) ?? [];

    this.api
      .createOne({
        title: this.form.value.title!,
        body: this.form.value.body!,
        sharedWith,
        tags,
      })
      .subscribe({
        next: () => {
          this.toast.show({
            message: 'Nota creata con successo',
            type: ToastType.Success,
            seconds: 4,
          });
          this.router.navigateByUrl('/');
        },
        error: (err) => {
          console.error(err);
          this.toast.show({
            message: 'Errore nella creazione della nota',
            type: ToastType.Error,
            seconds: 6,
          });
          this.submitting.set(false);
        },
        complete: () => this.submitting.set(false),
      });
  }

  onSharedWithSelectedChange(users: string[]) {
    console.log('onSharedWithSelectedChange', users);
    console.log(users);
  }
}
