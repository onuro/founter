'use client';

import { Header } from '@/components/shared/Header';
import { SettingsForm } from './SettingsForm';

export function SettingsLayout() {
  return (
    <div className="min-h-screen p-4 bg-background text-foreground">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your API keys and tokens
          </p>
        </div>

        <SettingsForm />
      </main>
    </div>
  );
}
