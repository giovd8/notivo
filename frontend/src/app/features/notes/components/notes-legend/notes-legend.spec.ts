import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotesLegend } from './notes-legend';

describe('NotesLegend', () => {
  let component: NotesLegend;
  let fixture: ComponentFixture<NotesLegend>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotesLegend]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotesLegend);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
