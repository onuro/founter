'use client';

import { ContentHeader } from '@/components/shared/ContentHeader';
import { SettingsForm } from './SettingsForm';
import { DatabaseBackups } from './DatabaseBackups';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Settings, HardDrive } from 'lucide-react';

export function SettingsLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ContentHeader title="Settings" />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your API keys and database backups
          </p>
        </div>

        <Tabs defaultValue="general">
          <TabsList className="mb-6">
            <TabsTrigger value="general" className="cursor-pointer">
              <Settings className="w-4 h-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="backups" className="cursor-pointer">
              <HardDrive className="w-4 h-4 mr-2" />
              DB Backups
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <SettingsForm />
          </TabsContent>

          <TabsContent value="backups">
            <DatabaseBackups />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
