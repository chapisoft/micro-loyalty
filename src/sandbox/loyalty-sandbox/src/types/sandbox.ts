export interface SandboxMenu {
  id: number;
  parentId?: number;
  name: string;
  path: string;
  icon?: string;
  menuOrder?: number;
}

export interface SandboxContent {
  id?: number;
  menuId: number;
  title?: string;
  bodyMarkdown?: string;
  codeDemo?: string;
  docFilePath?: string;
  codeFilePath?: string;
  postmanUrl?: string;
  testAccountInfo?: string;
}

export interface SandboxUser {
  token?: string;
  username: string;
  fullName: string;
  email?: string;
  status: string;
}
