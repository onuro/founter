'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAutomations } from '@/hooks/useAutomations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Sparkles, MoreVertical, Loader2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { AUTOMATION_TYPES } from '@/types/automator';
import type { AutomationSummary } from '@/types/automator';

function AutomationCard({
  automation,
  onToggle,
  onDelete,
}: {
  automation: AutomationSummary;
  onToggle: (enabled: boolean) => void;
  onDelete: () => void;
}) {
  const typeInfo = AUTOMATION_TYPES[automation.type];

  return (
    <Card className="hover:bg-secondary/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <Link
                href={`/automator/${automation.id}`}
                className="font-medium hover:underline block truncate"
              >
                {automation.name}
              </Link>
              <p className="text-sm text-muted-foreground mt-0.5">
                {typeInfo?.label || automation.type}
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>{automation.runCount} runs</span>
                {automation.lastRunAt && (
                  <span>
                    Last run:{' '}
                    {new Date(automation.lastRunAt).toLocaleDateString()}
                  </span>
                )}
                {automation.lastRunStatus && (
                  <span
                    className={
                      automation.lastRunStatus === 'completed'
                        ? 'text-green-500'
                        : automation.lastRunStatus === 'failed'
                          ? 'text-red-500'
                          : 'text-yellow-500'
                    }
                  >
                    {automation.lastRunStatus}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={automation.enabled}
              onCheckedChange={onToggle}
              aria-label="Toggle automation"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/automator/${automation.id}`}>View Details</Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AutomatorLayout() {
  const {
    automations,
    isLoading,
    error,
    toggleAutomation,
    deleteAutomation,
  } = useAutomations();

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await toggleAutomation(id, enabled);
      toast.success(enabled ? 'Automation enabled' : 'Automation disabled');
    } catch {
      toast.error('Failed to toggle automation');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this automation?')) return;

    setDeletingId(id);
    try {
      await deleteAutomation(id);
      toast.success('Automation deleted');
    } catch {
      toast.error('Failed to delete automation');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6 pl-4 pr-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Automations</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Automate workflows with Baserow and AI
                </p>
              </div>
            </div>
            <Button asChild>
              <Link href="/automator/new">
                <Plus className="w-4 h-4" />
                New Automation
              </Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      ) : automations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">No automations yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first automation to get started
            </p>
            <Button asChild>
              <Link href="/automator/new">
                <Plus className="w-4 h-4" />
                Create Automation
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {automations.map((automation) => (
            <AutomationCard
              key={automation.id}
              automation={automation}
              onToggle={(enabled) => handleToggle(automation.id, enabled)}
              onDelete={() => handleDelete(automation.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
