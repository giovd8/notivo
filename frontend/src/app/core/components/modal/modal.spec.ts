import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalService } from '../../../services/modal.service';

import { Modal } from './modal';

describe('Modal', () => {
  let component: Modal;
  let fixture: ComponentFixture<Modal>;
  let modalService: ModalService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Modal],
      providers: [ModalService],
    }).compileComponents();

    fixture = TestBed.createComponent(Modal);
    component = fixture.componentInstance;
    modalService = TestBed.inject(ModalService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call modalService.close when onClose is called', () => {
    spyOn(modalService, 'close');
    component.onClose();
    expect(modalService.close).toHaveBeenCalled();
  });

  it('should call modalService.confirm when onConfirm is called', () => {
    spyOn(modalService, 'confirm');
    component.onConfirm();
    expect(modalService.confirm).toHaveBeenCalled();
  });

  it('should call modalService.cancel when onCancel is called', () => {
    spyOn(modalService, 'cancel');
    component.onCancel();
    expect(modalService.cancel).toHaveBeenCalled();
  });

  it('should close modal when clicking on backdrop', () => {
    spyOn(component, 'onClose');
    const event = new Event('click');
    Object.defineProperty(event, 'target', { value: event.currentTarget });

    component.onBackdropClick(event);
    expect(component.onClose).toHaveBeenCalled();
  });

  it('should not close modal when clicking on modal content', () => {
    spyOn(component, 'onClose');
    const event = new Event('click');
    const mockTarget = document.createElement('div');
    Object.defineProperty(event, 'target', { value: mockTarget });
    Object.defineProperty(event, 'currentTarget', { value: document.createElement('div') });

    component.onBackdropClick(event);
    expect(component.onClose).not.toHaveBeenCalled();
  });
});
