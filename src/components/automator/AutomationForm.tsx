'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAutomations } from '@/hooks/useAutomations';
import { useAutomation } from '@/hooks/useAutomation';
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
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Loader2, Sparkles, Copy, Check, Image, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { AUTOMATION_TYPES, AI_PROVIDERS } from '@/types/automator';
import type { ResourceEnricherConfig, AIProvider } from '@/types/automator';

interface AutomationFormProps {
  automationId?: string; // If provided, we're in edit mode
}

export function AutomationForm({ automationId }: AutomationFormProps) {
  const router = useRouter();
  const isEditMode = !!automationId;

  // Hooks
  const { createAutomation } = useAutomations({ immediate: false });
  const {
    automation,
    isLoading: isLoadingAutomation,
    updateAutomation,
  } = useAutomation(automationId || null, { immediate: isEditMode });

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

  // Image fields state
  const [enableImageFields, setEnableImageFields] = useState(false);
  const [pngField, setPngField] = useState('');
  const [webpField, setWebpField] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const isInitializingRef = useRef(false); // Track init status for handlers

  // Initialize form - fetch databases on mount, and chain loading in edit mode
  useEffect(() => {
    // In edit mode, wait for automation to load before initializing
    if (isEditMode && !automation) {
      return;
    }

    const initForm = async () => {
      await fetchDatabases();

      // In edit mode, we need to chain the loading to preserve values
      if (isEditMode && automation) {
        const config = automation.config as ResourceEnricherConfig;

        // Set non-baserow fields immediately
        setName(automation.name);
        setDescription(automation.description || '');
        setAiProvider(config.ai.provider);
        setAiModel(config.ai.model || AI_PROVIDERS[config.ai.provider].defaultModel);
        setShortMaxLength(config.ai.shortMaxLength);
        setLongMaxLength(config.ai.longMaxLength);
        setEnableImageFields(config.baserow.enableImageFields || false);

        // Set database and fetch tables
        setSelectedDatabase(config.baserow.databaseId.toString());
        await fetchTables(config.baserow.databaseId);

        // Set table and fetch fields
        setSelectedTable(config.baserow.tableId.toString());
        await fetchFields(config.baserow.tableId);

        // Now set field values (after fields are loaded)
        setUrlField(config.baserow.urlField);
        setShortDescField(config.baserow.shortDescField);
        setLongDescField(config.baserow.longDescField);
        setPngField(config.baserow.pngField || '');
        setWebpField(config.baserow.webpField || '');
      }

      setIsInitialized(true);
    };

    initForm();
  }, [isEditMode, automation, fetchDatabases, fetchTables, fetchFields]);

  // Fetch tables when database changes (only after initialization, for user changes)
  const handleDatabaseChange = async (value: string) => {
    if (!isInitialized) return; // Ignore during initialization
    setSelectedDatabase(value);
    setSelectedTable('');
    setUrlField('');
    setShortDescField('');
    setLongDescField('');
    setPngField('');
    setWebpField('');
    await fetchTables(parseInt(value, 10));
  };

  // Fetch fields when table changes (only after initialization, for user changes)
  const handleTableChange = async (value: string) => {
    if (!isInitialized) return; // Ignore during initialization
    setSelectedTable(value);
    setUrlField('');
    setShortDescField('');
    setLongDescField('');
    setPngField('');
    setWebpField('');
    await fetchFields(parseInt(value, 10));
  };

  // Filter file fields for image selectors
  const fileFields = fields.filter(
    (f) => f.type === 'file' || f.type === 'single_file'
  );

  // Set default model when provider changes (only if no model is set)
  useEffect(() => {
    const providerInfo = AI_PROVIDERS[aiProvider];
    if (providerInfo && !aiModel) {
      setAiModel(providerInfo.defaultModel);
    }
  }, [aiProvider, aiModel]);

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
          enableImageFields,
          pngField:
            enableImageFields && pngField && pngField !== '__none__'
              ? pngField
              : undefined,
          webpField:
            enableImageFields && webpField && webpField !== '__none__'
              ? webpField
              : undefined,
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

      if (isEditMode) {
        await updateAutomation({
          name: name.trim(),
          description: description.trim() || undefined,
          config,
        });
        toast.success('Automation updated');
        router.push(`/automator/${automationId}`);
      } else {
        const newAutomation = await createAutomation({
          name: name.trim(),
          description: description.trim() || undefined,
          type: 'resource_enricher',
          config,
        });
        toast.success('Automation created');
        setCreatedId(newAutomation.id);
      }
    } catch {
      toast.error(isEditMode ? 'Failed to update automation' : 'Failed to create automation');
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

  // Loading state for edit mode (wait for automation and initialization)
  if (isEditMode && (isLoadingAutomation || !isInitialized)) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show success screen after creation (only for new automations)
  if (createdId) {
    return (
      <div className="p-6 pl-4 pr-6 max-w-4xl mx-auto space-y-6">
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
                Copy this URL and add it as a webhook in Baserow for the
                &quot;row.created&quot; event.
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
    <div className="p-6 pl-4 pr-6 max-w-4xl mx-auto space-y-6">
      {/* Back link */}
      <Button variant="ghost" asChild className="gap-2">
        <Link href={isEditMode ? `/automator/${automationId}` : '/automator'}>
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </Button>

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              {isEditMode ? (
                <Pencil className="w-5 h-5 text-primary" />
              ) : (
                <Sparkles className="w-5 h-5 text-primary" />
              )}
            </div>
            <div>
              <CardTitle>
                {isEditMode ? 'Edit Automation' : 'New Resources BaseRow Updater'}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {isEditMode
                  ? 'Update automation configuration'
                  : AUTOMATION_TYPES.resource_enricher.description}
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
          <CardContent className="space-y-5">
            {baserowError && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{baserowError}</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Database</Label>
                <Select
                  value={selectedDatabase}
                  onValueChange={handleDatabaseChange}
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
                  onValueChange={handleTableChange}
                  disabled={!selectedDatabase || isLoadingTables}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={isLoadingTables ? 'Loading...' : 'Select table'}
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

        {/* Image Fields Config */}
        <Card>
          <CardHeader className="justify-between">
            <div className="flex items-center justify-between">
              <CardTitle className="text-basein-w-68 flex items-center gap-3 mr-4">
                <Image className="w-4 h-4" />
                Screenshot Capture
              </CardTitle>
              <Switch
                checked={enableImageFields}
                onCheckedChange={setEnableImageFields}
              />
            </div>
            <p className="text-sm max-w-68 text-right text-muted-foreground">
              Automatically capture screenshots of URLs and save to file fields
            </p>
          </CardHeader>
          {enableImageFields && (
            <CardContent className="space-y-4">
              {fileFields.length === 0 ? (
                <div className="p-3 rounded-md bg-muted/50 border border-border">
                  <p className="text-sm text-muted-foreground">
                    No file fields found in this table. Add file fields in
                    Baserow to use this feature.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>PNG Field</Label>
                    <Select
                      value={pngField}
                      onValueChange={setPngField}
                      disabled={!selectedTable || isLoadingFields}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {fileFields.map((f) => (
                          <SelectItem key={f.id} value={f.name}>
                            {f.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Full quality PNG screenshot
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>WebP Field</Label>
                    <Select
                      value={webpField}
                      onValueChange={setWebpField}
                      disabled={!selectedTable || isLoadingFields}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {fileFields.map((f) => (
                          <SelectItem key={f.id} value={f.name}>
                            {f.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Optimized WebP for web use
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          )}
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
                  onValueChange={(v) => {
                    setAiProvider(v as AIProvider);
                    setAiModel(AI_PROVIDERS[v as AIProvider].defaultModel);
                  }}
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
                  onChange={(e) =>
                    setShortMaxLength(parseInt(e.target.value, 10) || 150)
                  }
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
                  onChange={(e) =>
                    setLongMaxLength(parseInt(e.target.value, 10) || 500)
                  }
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
            <Link href={isEditMode ? `/automator/${automationId}` : '/automator'}>
              Cancel
            </Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isEditMode ? 'Saving...' : 'Creating...'}
              </>
            ) : isEditMode ? (
              'Save Changes'
            ) : (
              'Create Automation'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
