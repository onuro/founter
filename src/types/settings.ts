export interface Settings {
  baserowToken: string | null;
  baserowTokenDescription: string | null;
  baserowHost: string | null;
  baserowUsername: string | null;
  baserowPassword: string | null;
  openaiKey: string | null;
  openaiKeyDescription: string | null;
  anthropicKey: string | null;
  anthropicKeyDescription: string | null;
  glmKey: string | null;
  glmKeyDescription: string | null;
  deepseekKey: string | null;
  deepseekKeyDescription: string | null;
  holyshotToken: string | null;
  holyshotTokenDescription: string | null;
}

export interface SettingsFormData {
  baserowToken: string;
  baserowTokenDescription: string;
  baserowHost: string;
  baserowUsername: string;
  baserowPassword: string;
  openaiKey: string;
  openaiKeyDescription: string;
  anthropicKey: string;
  anthropicKeyDescription: string;
  glmKey: string;
  glmKeyDescription: string;
  deepseekKey: string;
  deepseekKeyDescription: string;
  holyshotToken: string;
  holyshotTokenDescription: string;
}

export interface SettingsResponse {
  success: boolean;
  data?: SettingsFormData;
  error?: string;
}
