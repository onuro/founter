import { ContentHeader } from '@/components/shared/ContentHeader';
import { AutomationDetailLayout } from '@/components/automator/AutomationDetailLayout';

export default async function AutomationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <ContentHeader title="Automator" />
      <AutomationDetailLayout automationId={id} />
    </>
  );
}
