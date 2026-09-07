export interface EventResponse {
  id: string;
  title: string;
  identifier: string;
  chartId: string | null;
  chartName: string | null;
  createdAt: Date | null;
}

export function parseEventResponse(data: Record<string, unknown>): EventResponse {
  return {
    id:         String(data['id']),
    title:      String(data['title']),
    identifier: String(data['identifier']),
    chartId:    data['chartId'] != null ? String(data['chartId']) : null,
    chartName:  data['chartName'] != null ? String(data['chartName']) : null,
    createdAt:  data['createdAt'] != null ? new Date(String(data['createdAt'])) : null,
  };
}
