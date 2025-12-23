export interface Settings {
  baserowToken: string | null;
  openaiKey: string | null;
  anthropicKey: string | null;
  glmKey: string | null;
}

export interface SettingsFormData {
  baserowToken: string;
  openaiKey: string;
  anthropicKey: string;
  glmKey: string;
}

export interface SettingsResponse {
  success: boolean;
  data?: SettingsFormData;
  error?: string;
}
