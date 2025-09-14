export interface LabelValue<T = string> {
  label: string;
  value: T;
}

export interface LabelValueCheck<T = string> extends LabelValue<T> {
  isChecked: boolean;
}
