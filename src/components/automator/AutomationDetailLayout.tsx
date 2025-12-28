'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAutomation } from '@/hooks/useAutomation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import { AUTOMATION_TYPES, AI_PROVIDERS } from '@/types/automator';
import type { ResourceEnricherConfig, AutomationRun } from '@/types/automator';

function RunRow({ run }: { run: AutomationRun }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/50 transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <span
            className={`w-2 h-2 rounded-full ${run.status === 'completed'
              ? 'bg-green-500'
              : run.status === 'failed'
                ? 'bg-red-500'
                : run.status === 'running'
                  ? 'bg-yellow-500 animate-pulse'
                  : 'bg-gray-500'
              }`}
          />
          <span className="text-sm">
            {new Date(run.startedAt).toLocaleString()}
          </span>
          <span className="text-sm text-muted-foreground">
            {run.trigger.type === 'webhook' ? 'Webhook' : 'Manual'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {run.duration && (
            <span className="text-sm text-muted-foreground">
              {(run.duration / 1000).toFixed(1)}s
            </span>
          )}
          <span
            className={`text-sm font-medium ${run.status === 'completed'
              ? 'text-green-500'
              : run.status === 'failed'
                ? 'text-red-500'
                : 'text-muted-foreground'
              }`}
          >
            {run.status}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="px-4 py-3 bg-secondary/30 space-y-3">
          {run.error && (
            <div className="p-2 rounded bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive-fg">{run.error}</p>
            </div>
          )}
          {run.steps.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Steps
              </p>
              {run.steps.map((step, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${step.status === 'success'
                        ? 'bg-green-500'
                        : step.status === 'failed'
                          ? 'bg-red-500'
                          : 'bg-gray-500'
                        }`}
                    />
                    <span>{step.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span>{(step.duration / 1000).toFixed(1)}s</span>
                    {step.error && (
                      <span className="text-destructive-fg text-xs">
                        {step.error}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AutomationDetailLayout({
  automationId,
}: {
  automationId: string;
}) {
  const router = useRouter();
  const {
    automation,
    runs,
    isLoading,
    error,
    updateAutomation,
    clearRuns,
    refetch,
    refetchRuns,
  } = useAutomation(automationId);

  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Auto-poll when a run is in progress
  const hasRunningRun = runs.some(run => run.status === 'running');

  useEffect(() => {
    if (!hasRunningRun) return;

    const interval = setInterval(() => {
      refetchRuns();
    }, 1000); // Poll every 1 second for faster live updates

    return () => clearInterval(interval);
  }, [hasRunningRun, refetchRuns]);

  const config = automation?.config as ResourceEnricherConfig | undefined;
  const typeInfo = automation ? AUTOMATION_TYPES[automation.type] : null;
  const aiProviderInfo = config?.ai?.provider
    ? AI_PROVIDERS[config.ai.provider]
    : null;

  const webhookUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/webhooks/baserow?automationId=${automationId}`
      : '';

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    toast.success('Webhook URL copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggle = async (enabled: boolean) => {
    try {
      await updateAutomation({ enabled });
      toast.success(enabled ? 'Automation enabled' : 'Automation disabled');
    } catch {
      toast.error('Failed to update automation');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this automation?')) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/automations/${automationId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Automation deleted');
        router.push('/automator');
      } else {
        toast.error('Failed to delete automation');
      }
    } catch {
      toast.error('Failed to delete automation');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearRuns = async () => {
    if (!confirm('Clear all run history?')) return;

    setIsClearing(true);
    try {
      const deleted = await clearRuns();
      toast.success(`Cleared ${deleted} runs`);
    } catch {
      toast.error('Failed to clear runs');
    } finally {
      setIsClearing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !automation) {
    return (
      <div className="p-6 pl-4 pr-6 max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-destructive">
              {error || 'Automation not found'}
            </p>
            <Button asChild className="mt-4">
              <Link href="/automator">Back to Automations</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 pl-4 pr-6 pt-0 w-full mx-auto space-y-6">
      {/* Back link */}
      <Button variant="ghost" asChild className="gap-2">
        <Link href="/automator">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </Button>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_0.5fr] gap-6 md:items-stretch">
        {/* Left column - Header, Webhook, Config */}
        <div className="space-y-6">
          {/* Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{automation.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {typeInfo?.label || automation.type}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="enabled" className="text-sm pb-0">
                      {automation.enabled ? 'Enabled' : 'Disabled'}
                    </Label>
                    <Switch
                      id="enabled"
                      checked={automation.enabled}
                      onCheckedChange={handleToggle}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                  >
                    <Link href={`/automator/${automationId}/edit`}>
                      <Pencil className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="text-destructive hover:text-destructive"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Webhook URL */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Webhook URL</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                Add this URL as a webhook in Baserow for "row.created" events.
              </p>
              <div className="flex items-center gap-2">
                <Input
                  value={webhookUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button variant="secondary" size="icon" onClick={copyWebhookUrl}>
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Configuration */}
          {config && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1.5">
                    <p className="text-muted-foreground">Baserow Table ID</p>
                    <p className="font-medium">{config.baserow.tableId}</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-muted-foreground">URL Field</p>
                    <p className="font-medium">{config.baserow.urlField}</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-muted-foreground">Short Description Field</p>
                    <p className="font-medium">{config.baserow.shortDescField}</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-muted-foreground">Long Description Field</p>
                    <p className="font-medium">{config.baserow.longDescField}</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-muted-foreground">AI Provider</p>
                    <p className="font-medium">
                      {aiProviderInfo?.label || config.ai.provider}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-muted-foreground">AI Model</p>
                    <p className="font-medium">{config.ai.model || 'Default'}</p>
                  </div>
                </div>

                {/* Image Fields Config */}
                {config.baserow.enableImageFields && (
                  <div className="pt-4 mt-4 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                      Screenshot Capture
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1.5">
                        <p className="text-muted-foreground">PNG Field</p>
                        <p className="font-medium">
                          {config.baserow.pngField || 'Not configured'}
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-muted-foreground">WebP Field</p>
                        <p className="font-medium">
                          {config.baserow.webpField || 'Not configured'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column - Run History (stretches to match left column height) */}
        <Card className="flex flex-col h-full">
          <CardHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Run History</CardTitle>
              <div className="flex items-center gap-1">
                {runs.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearRuns}
                    disabled={isClearing}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    {isClearing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => refetchRuns()}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
            {runs.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">No runs yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border overflow-y-auto h-full">
                {runs.map((run) => (
                  <RunRow key={run.id} run={run} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
