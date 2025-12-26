export interface Settings {
  baserowToken: string | null;
  baserowTokenDescription: string | null;
  openaiKey: string | null;
  openaiKeyDescription: string | null;
  anthropicKey: string | null;
  anthropicKeyDescription: string | null;
  glmKey: string | null;
  glmKeyDescription: string | null;
}

export interface SettingsFormData {
  baserowToken: string;
  baserowTokenDescription: string;
  openaiKey: string;
  openaiKeyDescription: string;
  anthropicKey: string;
  anthropicKeyDescription: string;
  glmKey: string;
  glmKeyDescription: string;
}

export interface SettingsResponse {
  success: boolean;
  data?: SettingsFormData;
  error?: string;
}
