export interface SessionDocument {
  _id?: string;
  userId: string;
  token: string;
  refreshToken: string;
  createdAt: Date;
  expiresAt: Date;
  metadata?: {
    ip?: string;
    userAgent?: string;
  };
}


