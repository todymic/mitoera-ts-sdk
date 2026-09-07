export interface ApiKeyResponse {
  id: string;
  name: string;
  keyId: string;
  scope: string;
  active: boolean;
  createdAt: Date | null;
  lastUsedAt: Date | null;
}

export interface ApiKeyCreatedResponse extends ApiKeyResponse {
  secret: string;
}

export function parseApiKeyResponse(data: Record<string, unknown>): ApiKeyResponse {
  return {
    id:         String(data['id']),
    name:       String(data['name']),
    keyId:      String(data['keyId']),
    scope:      String(data['scope']),
    active:     Boolean(data['active'] ?? true),
    createdAt:  data['createdAt'] != null ? new Date(String(data['createdAt'])) : null,
    lastUsedAt: data['lastUsedAt'] != null ? new Date(String(data['lastUsedAt'])) : null,
  };
}

export function parseApiKeyCreatedResponse(data: Record<string, unknown>): ApiKeyCreatedResponse {
  return { ...parseApiKeyResponse(data), secret: String(data['secret']) };
}
