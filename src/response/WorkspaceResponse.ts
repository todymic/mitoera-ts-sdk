export interface WorkspaceResponse {
  id: string;
  name: string;
  slug: string;
  current: boolean;
  createdAt: Date | null;
}

export function parseWorkspaceResponse(data: Record<string, unknown>): WorkspaceResponse {
  return {
    id:        String(data['id']),
    name:      String(data['name']),
    slug:      String(data['slug']),
    current:   Boolean(data['current']),
    createdAt: data['createdAt'] != null ? new Date(String(data['createdAt'])) : null,
  };
}
