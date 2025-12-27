'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAutomations } from '@/hooks/useAutomations';
import { useBaserowData } from '@/hooks/useBaserowData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, Sparkles, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { AUTOMATION_TYPES, AI_PROVIDERS } from '@/types/automator';
import type { ResourceEnricherConfig, AIProvider } from '@/types/automator';

export function NewAutomationLayout() {
  const router = useRouter();
  const { createAutomation } = useAutomations({ immediate: false });
  const {
    databases,
    tables,
    fields,
    isLoadingDatabases,
    isLoadingTables,
    isLoadingFields,
    error: baserowError,
    fetchDatabases,
    fetchTables,
    fetchFields,
  } = useBaserowData();

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDatabase, setSelectedDatabase] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [urlField, setUrlField] = useState('');
  const [shortDescField, setShortDescField] = useState('');
  const [longDescField, setLongDescField] = useState('');
  const [aiProvider, setAiProvider] = useState<AIProvider>('openai');
  const [aiModel, setAiModel] = useState('');
  const [shortMaxLength, setShortMaxLength] = useState(150);
  const [longMaxLength, setLongMaxLength] = useState(500);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch databases on mount
  useEffect(() => {
    fetchDatabases();
  }, [fetchDatabases]);

  // Fetch tables when database changes
  useEffect(() => {
    if (selectedDatabase) {
      fetchTables(parseInt(selectedDatabase, 10));
      setSelectedTable('');
      setUrlField('');
      setShortDescField('');
      setLongDescField('');
    }
  }, [selectedDatabase, fetchTables]);

  // Fetch fields when table changes
  useEffect(() => {
    if (selectedTable) {
      fetchFields(parseInt(selectedTable, 10));
      setUrlField('');
      setShortDescField('');
      setLongDescField('');
    }
  }, [selectedTable, fetchFields]);

  // Set default model when provider changes
  useEffect(() => {
    const providerInfo = AI_PROVIDERS[aiProvider];
    if (providerInfo) {
      setAiModel(providerInfo.defaultModel);
    }
  }, [aiProvider]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!selectedTable || !urlField || !shortDescField || !longDescField) {
      toast.error('Please configure all Baserow fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const config: ResourceEnricherConfig = {
        baserow: {
          databaseId: parseInt(selectedDatabase, 10),
          tableId: parseInt(selectedTable, 10),
          urlField,
          shortDescField,
          longDescField,
        },
        ai: {
          provider: aiProvider,
          model: aiModel,
          shortMaxLength,
          longMaxLength,
        },
        crawl: {
          enabled: true,
        },
      };

      const automation = await createAutomation({
        name: name.trim(),
        description: description.trim() || undefined,
        type: 'resource_enricher',
        config,
      });

      toast.success('Automation created');
      setCreatedId(automation.id);
    } catch (error) {
      toast.error('Failed to create automation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const webhookUrl =
    typeof window !== 'undefined' && createdId
      ? `${window.location.origin}/api/webhooks/baserow?automationId=${createdId}`
      : '';

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    toast.success('Webhook URL copied');
    setTimeout(() => setCopied(false), 2000);
  };

  // Show success screen after creation
  if (createdId) {
    return (
      <div className="p-6 pl-4 pr-6 max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-500">
              <Check className="w-5 h-5" />
              Automation Created
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Webhook URL
              </Label>
              <p className="text-sm text-muted-foreground mt-1 mb-2">
                Copy this URL and add it as a webhook in Baserow for the "row.created" event.
              </p>
              <div className="flex items-center gap-2">
                <Input
                  value={webhookUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={copyWebhookUrl}
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button asChild variant="secondary">
                <Link href="/automator">Back to Automations</Link>
              </Button>
              <Button asChild>
                <Link href={`/automator/${createdId}`}>View Automation</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 pl-4 pr-6 max-w-2xl mx-auto space-y-6">
      {/* Back link */}
      <Button variant="ghost" asChild className="gap-2">
        <Link href="/automator">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </Button>

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>New Resources BaseRow Updater</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {AUTOMATION_TYPES.resource_enricher.description}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Resources BaseRow Updater"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enrich resources with AI summaries"
              />
            </div>
          </CardContent>
        </Card>

        {/* Baserow Config */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Baserow Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {baserowError && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{baserowError}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Database</Label>
              <Select
                value={selectedDatabase}
                onValueChange={setSelectedDatabase}
                disabled={isLoadingDatabases}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoadingDatabases ? 'Loading...' : 'Select database'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {databases.map((db) => (
                    <SelectItem key={db.id} value={db.id.toString()}>
                      {db.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Table</Label>
              <Select
                value={selectedTable}
                onValueChange={setSelectedTable}
                disabled={!selectedDatabase || isLoadingTables}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoadingTables ? 'Loading...' : 'Select table'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {tables.map((t) => (
                    <SelectItem key={t.id} value={t.id.toString()}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>URL Field</Label>
                <Select
                  value={urlField}
                  onValueChange={setUrlField}
                  disabled={!selectedTable || isLoadingFields}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={isLoadingFields ? 'Loading...' : 'Select'}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {fields.map((f) => (
                      <SelectItem key={f.id} value={f.name}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Short Desc Field</Label>
                <Select
                  value={shortDescField}
                  onValueChange={setShortDescField}
                  disabled={!selectedTable || isLoadingFields}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {fields.map((f) => (
                      <SelectItem key={f.id} value={f.name}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Long Desc Field</Label>
                <Select
                  value={longDescField}
                  onValueChange={setLongDescField}
                  disabled={!selectedTable || isLoadingFields}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {fields.map((f) => (
                      <SelectItem key={f.id} value={f.name}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Config */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select
                  value={aiProvider}
                  onValueChange={(v) => setAiProvider(v as AIProvider)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(AI_PROVIDERS).map(([key, info]) => (
                      <SelectItem key={key} value={key}>
                        {info.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Model</Label>
                <Select value={aiModel} onValueChange={setAiModel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_PROVIDERS[aiProvider]?.models.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shortMax">Short Description Max Length</Label>
                <Input
                  id="shortMax"
                  type="number"
                  value={shortMaxLength}
                  onChange={(e) => setShortMaxLength(parseInt(e.target.value, 10) || 150)}
                  min={50}
                  max={500}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="longMax">Long Description Max Length</Label>
                <Input
                  id="longMax"
                  type="number"
                  value={longMaxLength}
                  onChange={(e) => setLongMaxLength(parseInt(e.target.value, 10) || 500)}
                  min={100}
                  max={2000}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" asChild>
            <Link href="/automator">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Automation'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
