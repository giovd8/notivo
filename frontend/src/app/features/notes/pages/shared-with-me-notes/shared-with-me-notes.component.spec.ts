import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedWithMeNotesComponent } from './shared-with-me-notes.component';

describe('SharedWithMeNotesComponent', () => {
  let component: SharedWithMeNotesComponent;
  let fixture: ComponentFixture<SharedWithMeNotesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedWithMeNotesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SharedWithMeNotesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
