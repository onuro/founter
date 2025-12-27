'use client';

import { useState, useCallback, useEffect } from 'react';
import { SettingsFormData } from '@/types/settings';

export function useSettings() {
  const [settings, setSettings] = useState<SettingsFormData>({
    baserowToken: '',
    baserowTokenDescription: '',
    baserowHost: '',
    baserowUsername: '',
    baserowPassword: '',
    openaiKey: '',
    openaiKeyDescription: '',
    anthropicKey: '',
    anthropicKeyDescription: '',
    glmKey: '',
    glmKeyDescription: '',
    deepseekKey: '',
    deepseekKeyDescription: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      if (data.success) {
        setSettings(data.data);
      } else {
        setError(data.error || 'Failed to load settings');
      }
    } catch {
      setError('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveSettings = useCallback(async (formData: SettingsFormData) => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMessage('Settings saved successfully');
        setSettings(data.data);
      } else {
        setError(data.error || 'Failed to save settings');
      }
    } catch {
      setError('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    setSettings,
    isLoading,
    isSaving,
    error,
    successMessage,
    saveSettings,
    clearMessages: () => {
      setError(null);
      setSuccessMessage(null);
    },
  };
}
