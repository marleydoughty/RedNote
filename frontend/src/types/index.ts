export type CycleEntry = {
  entryId: number;
  date: string; // 'YYYY-MM-DD'
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
