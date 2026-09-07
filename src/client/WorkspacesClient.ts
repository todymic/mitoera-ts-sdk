import type { MitoeraClient } from '../MitoeraClient.js';
import { type WorkspaceResponse, parseWorkspaceResponse } from '../response/WorkspaceResponse.js';

export interface WorkspaceMember {
  id: string;
  email: string;
  role: string;
}

export class WorkspacesClient {
  constructor(private readonly client: MitoeraClient) {}

  async listAll(): Promise<WorkspaceResponse[]> {
    const data = await this.client.get(`${this.client.apiPrefix}/workspaces`);
    const items = (data as Record<string, unknown>)['items'] ?? data;
    return (items as Record<string, unknown>[]).map(parseWorkspaceResponse);
  }

  async getCurrent(): Promise<WorkspaceResponse> {
    const data = await this.client.get(`${this.client.apiPrefix}/workspaces/current`);
    return parseWorkspaceResponse(data as Record<string, unknown>);
  }

  async create(name: string): Promise<WorkspaceResponse> {
    const data = await this.client.post(`${this.client.apiPrefix}/workspaces`, { name });
    return parseWorkspaceResponse(data as Record<string, unknown>);
  }

  async switchTo(workspaceId: string): Promise<WorkspaceResponse> {
    const data = await this.client.post(
      `${this.client.apiPrefix}/workspaces/${workspaceId}/switch`,
    );
    return parseWorkspaceResponse(data as Record<string, unknown>);
  }

  async invite(email: string, role = 'MEMBER'): Promise<void> {
    await this.client.post(`${this.client.apiPrefix}/workspaces/invite`, { email, role });
  }

  async listMembers(): Promise<WorkspaceMember[]> {
    const data = await this.client.get(`${this.client.apiPrefix}/workspaces/members`);
    const items = (data as Record<string, unknown>)['items'] ?? data;
    return items as WorkspaceMember[];
  }
}
