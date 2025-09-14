export interface LabelValue<T = string> {
  label: string;
  value: T;
}

export interface LabelValueCheck<T = string> extends LabelValue<T> {
  isChecked: boolean;
}

export interface ModalConfig {
  title: string;
  body: string;
  elementName?: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}
