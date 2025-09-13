import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddNoteButton } from './add-note-button';

describe('AddNoteButton', () => {
  let component: AddNoteButton;
  let fixture: ComponentFixture<AddNoteButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddNoteButton]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddNoteButton);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
