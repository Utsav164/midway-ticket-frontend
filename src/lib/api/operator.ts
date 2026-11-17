import type { OperatorDashboardData } from "@/types";
import { isMockMode, apiGet } from "./client";
import { MOCK_DASHBOARD_DATA } from "@/lib/mock/data";
import { MOCK_API_DELAY } from "@/config/app.config";
import { sleep } from "@/lib/utils";

export async function getOperatorDashboard(): Promise<OperatorDashboardData> {
  if (isMockMode) { await sleep(MOCK_API_DELAY); return MOCK_DASHBOARD_DATA; }
  return apiGet<OperatorDashboardData>("/analytics/dashboard");
}

export async function getWeeklyData() {
  if (isMockMode) { await sleep(MOCK_API_DELAY); return MOCK_DASHBOARD_DATA.weeklyData; }
  return apiGet("/analytics/weekly");
}
