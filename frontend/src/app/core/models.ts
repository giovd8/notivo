export interface SidenavItem {
  title: string;
  icon: string;
  route: string;
  spacing: boolean;
}

export enum ToastType {
  Success = 'success',
  Error = 'error',
}

export interface ToastShowOptions {
  message: string;
  type: ToastType;
  seconds: number;
}

export interface NotivoResponse<T> {
  data: T;
  message: string;
}
