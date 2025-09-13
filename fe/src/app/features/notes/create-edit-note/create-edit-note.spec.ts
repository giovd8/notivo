import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateEditNote } from './create-edit-note';

describe('CreateEditNote', () => {
  let component: CreateEditNote;
  let fixture: ComponentFixture<CreateEditNote>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateEditNote]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateEditNote);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
