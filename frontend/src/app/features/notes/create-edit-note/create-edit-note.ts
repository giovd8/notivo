import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
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
import { RouterLink } from '@angular/router';
import Quill from 'quill';
import { ToastType } from '../../../core/models';
import { ToastService } from '../../../core/services/toast';
import { Multiselect } from '../../../shared/components/multiselect/multiselect';
import { Note } from '../../../shared/models/note';
import { LabelValue } from '../../../shared/models/utils';
import { CommonStore } from '../../stores/common';
import { NoteStore } from '../../stores/note';

@Component({
  selector: 'notivo-create-edit-note',
  imports: [ReactiveFormsModule, Multiselect, RouterLink],
  templateUrl: './create-edit-note.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateEditNote {
  private readonly fb = new FormBuilder();
  private readonly store = inject(NoteStore);
  private readonly toast = inject(ToastService);
  private readonly commonStore = inject(CommonStore);
  private readonly noteStore = inject(NoteStore);
  readonly tagOtions = computed(() => this.commonStore.tagOptions());
  readonly userOptions = computed(() => this.commonStore.userOptions());
  readonly isLoadingDataFromStore = computed(() => this.commonStore.loading());

  readonly submitting = signal(false);
  readonly selectedUsersLV = signal<LabelValue[]>([]);
  readonly selectedTagsLV = signal<LabelValue[]>([]);

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
    sharedWith: this.fb.nonNullable.control<string[]>([]),
    tags: this.fb.nonNullable.control<string[]>([]),
  });

  note = input<Note | null>(null);
  showForm = output<boolean>();
  ngOnInit(): void {
    if (!!this.note()) {
      this.patchFormFromNote(this.note()!);
      return;
    }
    this.noteStore.refresh().subscribe({
      next: () => {
        const fresh = this.noteStore.notes().find((n) => n.id === this.note()?.id);
        if (fresh) this.patchFormFromNote(fresh);
      },
      error: () => {},
    });
  }

  private patchFormFromNote(note: {
    title: string;
    body: string;
    sharedWith?: { value: string }[];
    tags?: { value: string }[];
  }): void {
    this.form.patchValue({
      title: note.title ?? '',
      body: note.body ?? '',
      sharedWith: (note.sharedWith ?? []).map((u) => u.value),
      tags: (note.tags ?? []).map((t) => t.value),
    });
    this.selectedUsersLV.set((note.sharedWith ?? []).map((u) => ({ label: '', value: u.value })));
    this.selectedTagsLV.set((note.tags ?? []).map((t) => ({ label: '', value: t.value })));
    if (this.quill) {
      this.quill.root.innerHTML = this.form.value.body ?? '';
    }
  }

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

    const sharedWith = this.form.value.sharedWith ?? [];
    const tags = this.form.value.tags ?? [];

    const payload = {
      title: this.form.value.title!,
      body: this.form.value.body!,
      sharedWith,
      tags,
    };

    const editingId = this.note()?.id;
    if (!!editingId) {
      this.store.update(editingId, payload).subscribe({
        next: () => {
          this.toast.show({
            message: 'Nota aggiornata con successo',
            type: ToastType.Success,
            seconds: 4,
          });
          this.showForm.emit(false);
        },
        error: (err: any) => {
          console.error(err);
          this.toast.show({
            message: "Errore nell'aggiornamento della nota",
            type: ToastType.Error,
            seconds: 6,
          });
          this.submitting.set(false);
        },
        complete: () => this.submitting.set(false),
      });
    } else {
      this.store.create(payload).subscribe({
        next: () => {
          this.toast.show({
            message: 'Nota creata con successo',
            type: ToastType.Success,
            seconds: 4,
          });
          this.showForm.emit(false);
        },
        error: (err: any) => {
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
  }

  onSharedWithSelectedChange(users: string[]) {
    this.form.controls.sharedWith.setValue(users);
    this.selectedUsersLV.set(users.map((v) => ({ label: '', value: v })));
  }

  onTagsSelectedChange(tags: string[]) {
    this.form.controls.tags.setValue(tags);
    this.selectedTagsLV.set(tags.map((v) => ({ label: '', value: v })));
  }
}
