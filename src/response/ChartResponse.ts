export interface ChartResponse {
  id: string;
  name: string;
  objects: unknown[];
  updatedAt: Date;
  status: 'draft' | 'published';
  pendingChanges: boolean;
  publishedSnapshot: unknown[] | null;
}

export function parseChartResponse(data: Record<string, unknown>): ChartResponse {
  return {
    id:                String(data['id']),
    name:              String(data['name']),
    objects:           (data['objects'] as unknown[]) ?? [],
    updatedAt:         new Date(String(data['updatedAt'])),
    status:            (data['status'] as 'draft' | 'published') ?? 'draft',
    pendingChanges:    Boolean(data['pendingChanges']),
    publishedSnapshot: (data['publishedSnapshot'] as unknown[]) ?? null,
  };
}
