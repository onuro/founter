'use client';

import { FormEvent, useState } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Eye, EyeOff, Database, Brain } from 'lucide-react';

export function SettingsForm() {
  const {
    settings,
    setSettings,
    isLoading,
    isSaving,
    error,
    successMessage,
    saveSettings,
  } = useSettings();

  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const toggleShowKey = (key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await saveSettings(settings);
  };

  const handleInputChange = (field: keyof typeof settings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* BaseRow Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            BaseRow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label
              htmlFor="baserowToken"
              className="text-xs uppercase tracking-wider text-muted-foreground"
            >
              API Token
            </Label>
            <div className="relative">
              <Input
                id="baserowToken"
                type={showKeys.baserowToken ? 'text' : 'password'}
                value={settings.baserowToken}
                onChange={(e) => handleInputChange('baserowToken', e.target.value)}
                placeholder="Enter BaseRow API token"
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => toggleShowKey('baserowToken')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {showKeys.baserowToken ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LLM API Keys Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            LLM API Keys
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* OpenAI */}
          <div className="space-y-2">
            <Label
              htmlFor="openaiKey"
              className="text-xs uppercase tracking-wider text-muted-foreground"
            >
              OpenAI API Key
            </Label>
            <div className="relative">
              <Input
                id="openaiKey"
                type={showKeys.openaiKey ? 'text' : 'password'}
                value={settings.openaiKey}
                onChange={(e) => handleInputChange('openaiKey', e.target.value)}
                placeholder="sk-..."
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => toggleShowKey('openaiKey')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {showKeys.openaiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Anthropic */}
          <div className="space-y-2">
            <Label
              htmlFor="anthropicKey"
              className="text-xs uppercase tracking-wider text-muted-foreground"
            >
              Anthropic API Key
            </Label>
            <div className="relative">
              <Input
                id="anthropicKey"
                type={showKeys.anthropicKey ? 'text' : 'password'}
                value={settings.anthropicKey}
                onChange={(e) => handleInputChange('anthropicKey', e.target.value)}
                placeholder="sk-ant-..."
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => toggleShowKey('anthropicKey')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {showKeys.anthropicKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* GLM */}
          <div className="space-y-2">
            <Label
              htmlFor="glmKey"
              className="text-xs uppercase tracking-wider text-muted-foreground"
            >
              GLM API Key
            </Label>
            <div className="relative">
              <Input
                id="glmKey"
                type={showKeys.glmKey ? 'text' : 'password'}
                value={settings.glmKey}
                onChange={(e) => handleInputChange('glmKey', e.target.value)}
                placeholder="Enter GLM API key"
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => toggleShowKey('glmKey')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {showKeys.glmKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      {error && (
        <div className="p-3 rounded-sm bg-destructive/10 border border-destructive/20">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="p-3 rounded-sm bg-green-500/10 border border-green-500/20">
          <p className="text-sm text-green-500">{successMessage}</p>
        </div>
      )}

      {/* Save Button */}
      <Button type="submit" disabled={isSaving} className="w-full cursor-pointer">
        {isSaving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            Save Settings
          </>
        )}
      </Button>
    </form>
  );
}
