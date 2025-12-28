'use client';

import { FormEvent, useState } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Eye, EyeOff, Database, Brain, Camera } from 'lucide-react';

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
            Baserow
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="baserowHost"
              className="text-xs uppercase tracking-wider text-muted-foreground"
            >
              Host URL
            </Label>
            <Input
              id="baserowHost"
              type="text"
              value={settings.baserowHost}
              onChange={(e) => handleInputChange('baserowHost', e.target.value)}
              placeholder="https://baserow.example.com"
            />
            <p className="text-xs text-muted-foreground">
              Your self-hosted Baserow instance URL
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="baserowUsername"
                className="text-xs uppercase tracking-wider text-muted-foreground"
              >
                Username / Email
              </Label>
              <Input
                id="baserowUsername"
                type="text"
                value={settings.baserowUsername}
                onChange={(e) => handleInputChange('baserowUsername', e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="baserowPassword"
                className="text-xs uppercase tracking-wider text-muted-foreground"
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="baserowPassword"
                  type={showKeys.baserowPassword ? 'text' : 'password'}
                  value={settings.baserowPassword}
                  onChange={(e) => handleInputChange('baserowPassword', e.target.value)}
                  placeholder="••••••••"
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey('baserowPassword')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {showKeys.baserowPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">API Token (optional, for Fetcher)</p>
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
            <Input
              id="baserowTokenDescription"
              type="text"
              value={settings.baserowTokenDescription}
              onChange={(e) => handleInputChange('baserowTokenDescription', e.target.value)}
              placeholder="Add a note..."
              className="text-sm mt-2"
            />
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
            <Input
              id="openaiKeyDescription"
              type="text"
              value={settings.openaiKeyDescription}
              onChange={(e) => handleInputChange('openaiKeyDescription', e.target.value)}
              placeholder="Add a note..."
              className="text-sm"
            />
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
            <Input
              id="anthropicKeyDescription"
              type="text"
              value={settings.anthropicKeyDescription}
              onChange={(e) => handleInputChange('anthropicKeyDescription', e.target.value)}
              placeholder="Add a note..."
              className="text-sm"
            />
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
            <Input
              id="glmKeyDescription"
              type="text"
              value={settings.glmKeyDescription}
              onChange={(e) => handleInputChange('glmKeyDescription', e.target.value)}
              placeholder="Add a note..."
              className="text-sm"
            />
          </div>

          {/* DeepSeek */}
          <div className="space-y-2">
            <Label
              htmlFor="deepseekKey"
              className="text-xs uppercase tracking-wider text-muted-foreground"
            >
              DeepSeek API Key
            </Label>
            <div className="relative">
              <Input
                id="deepseekKey"
                type={showKeys.deepseekKey ? 'text' : 'password'}
                value={settings.deepseekKey}
                onChange={(e) => handleInputChange('deepseekKey', e.target.value)}
                placeholder="sk-..."
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => toggleShowKey('deepseekKey')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {showKeys.deepseekKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Input
              id="deepseekKeyDescription"
              type="text"
              value={settings.deepseekKeyDescription}
              onChange={(e) => handleInputChange('deepseekKeyDescription', e.target.value)}
              placeholder="Add a note..."
              className="text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Screenshot API Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Screenshot API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="holyshotToken"
              className="text-xs uppercase tracking-wider text-muted-foreground"
            >
              Holyshot API Token (Optional)
            </Label>
            <div className="relative">
              <Input
                id="holyshotToken"
                type={showKeys.holyshotToken ? 'text' : 'password'}
                value={settings.holyshotToken}
                onChange={(e) => handleInputChange('holyshotToken', e.target.value)}
                placeholder="Enter Holyshot API token (optional)"
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => toggleShowKey('holyshotToken')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {showKeys.holyshotToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Input
              id="holyshotTokenDescription"
              type="text"
              value={settings.holyshotTokenDescription}
              onChange={(e) => handleInputChange('holyshotTokenDescription', e.target.value)}
              placeholder="Add a note..."
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Used for automated screenshot capture in automations. Leave empty if your Holyshot instance doesn&apos;t require auth.
            </p>
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
