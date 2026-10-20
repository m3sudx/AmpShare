export interface Schedule {
  id: string;
  chargerId: string;
  dayOfWeek: number; // 0-6
  startTime: string; // "HH:MM:SS"
  endTime: string; // "HH:MM:SS"
  createdAt: string;
}

export interface ScheduleInput {
  dayOfWeek: number;
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM" ("24:00" allowed)
}