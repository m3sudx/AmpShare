import { api } from "./api";
import type { AdminPayoutsOverview, HostEarningsSummary, HostPayout } from "../types/payment";

export async function getMyEarnings(): Promise<HostEarningsSummary> {
  const res = await api.get("/host-payouts/my-earnings");
  return res.data.data as HostEarningsSummary;
}

export async function listAdminPayouts(status?: string): Promise<AdminPayoutsOverview> {
  const res = await api.get("/host-payouts/admin", {
    params: status ? { status } : undefined,
  });
  return res.data.data as AdminPayoutsOverview;
}

export async function recordManualPayout(
  payoutId: string,
  data: { providerReference: string; notes?: string },
): Promise<HostPayout> {
  const res = await api.post(`/host-payouts/admin/${payoutId}/record`, data);
  return res.data.data.payout as HostPayout;
}
