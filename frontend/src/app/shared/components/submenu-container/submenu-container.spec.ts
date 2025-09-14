import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubmenuContainer } from './submenu-container';

describe('SubmenuContainer', () => {
  let component: SubmenuContainer;
  let fixture: ComponentFixture<SubmenuContainer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubmenuContainer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubmenuContainer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
