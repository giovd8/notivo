import { TestBed } from '@angular/core/testing';
import { ModalConfig } from '../shared/models/utils';
import { ModalService } from './modal.service';

describe('ModalService', () => {
  let service: ModalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ModalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with modal closed', () => {
    expect(service.isOpen()).toBeFalse();
    expect(service.config()).toBeNull();
  });

  it('should open modal with config', () => {
    const config: ModalConfig = {
      title: 'Test Title',
      body: 'Test Body',
    };

    service.open(config);

    expect(service.isOpen()).toBeTrue();
    expect(service.config()).toEqual(config);
  });

  it('should close modal', () => {
    const config: ModalConfig = {
      title: 'Test Title',
      body: 'Test Body',
    };

    service.open(config);
    expect(service.isOpen()).toBeTrue();

    service.close();
    expect(service.isOpen()).toBeFalse();
    expect(service.config()).toBeNull();
  });

  it('should call onConfirm callback and close modal', () => {
    const onConfirmSpy = jasmine.createSpy('onConfirm');
    const config: ModalConfig = {
      title: 'Test Title',
      body: 'Test Body',
      onConfirm: onConfirmSpy,
    };

    service.open(config);
    service.confirm();

    expect(onConfirmSpy).toHaveBeenCalled();
    expect(service.isOpen()).toBeFalse();
  });

  it('should call onCancel callback and close modal', () => {
    const onCancelSpy = jasmine.createSpy('onCancel');
    const config: ModalConfig = {
      title: 'Test Title',
      body: 'Test Body',
      onCancel: onCancelSpy,
    };

    service.open(config);
    service.cancel();

    expect(onCancelSpy).toHaveBeenCalled();
    expect(service.isOpen()).toBeFalse();
  });

  it('should handle confirm without callback', () => {
    const config: ModalConfig = {
      title: 'Test Title',
      body: 'Test Body',
    };

    service.open(config);
    expect(() => service.confirm()).not.toThrow();
    expect(service.isOpen()).toBeFalse();
  });

  it('should handle cancel without callback', () => {
    const config: ModalConfig = {
      title: 'Test Title',
      body: 'Test Body',
    };

    service.open(config);
    expect(() => service.cancel()).not.toThrow();
    expect(service.isOpen()).toBeFalse();
  });
});
