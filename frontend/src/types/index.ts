export type CycleEntry = {
  entryId: number;
  userId?: number;
  date: string;
  isPeriod: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Prediction = {
  date: string; // 'YYYY-MM-DD'
  confidence: 'high' | 'medium' | 'low';
};

export type PredictResponse = {
  predictions: Prediction[];
  averageCycleLength: number | null;
};

export type AuthUser = {
  userId: number;
  username: string;
};

export type AuthResponse = {
  user: AuthUser;
  token: string;
};
