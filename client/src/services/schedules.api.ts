import { api } from "./api";
import type { Schedule, ScheduleInput } from "../types/schedule";

export async function listSchedules(chargerId: string) {
  const res = await api.get(`/chargers/${chargerId}/schedules`);
  return res.data.data.schedules as Schedule[];
}

export async function createSchedule(chargerId: string, input: ScheduleInput) {
  const res = await api.post(`/chargers/${chargerId}/schedules`, input);
  return res.data.data.schedule as Schedule;
}

export async function updateSchedule(id: string, input: Partial<ScheduleInput>) {
  const res = await api.patch(`/schedules/${id}`, input);
  return res.data.data.schedule as Schedule;
}

export async function deleteSchedule(id: string) {
  await api.delete(`/schedules/${id}`);
}