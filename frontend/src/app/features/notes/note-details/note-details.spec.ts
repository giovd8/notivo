import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoteDetails } from './note-details';

describe('NoteDetails', () => {
  let component: NoteDetails;
  let fixture: ComponentFixture<NoteDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoteDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NoteDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
