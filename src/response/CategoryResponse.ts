export interface CategoryResponse {
  id: string;
  name: string;
  key: number;
  color: string;
  chartId: string | null;
}

export function parseCategoryResponse(data: Record<string, unknown>): CategoryResponse {
  return {
    id:      String(data['id']),
    name:    String(data['name']),
    key:     Number(data['key']),
    color:   String(data['color'] ?? '#000000'),
    chartId: data['chartId'] != null ? String(data['chartId']) : null,
  };
}
