import { ContentHeader } from '@/components/shared/ContentHeader';
import { AutomationForm } from '@/components/automator/AutomationForm';

export default async function AutomationEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <ContentHeader title="Automator" />
      <AutomationForm automationId={id} />
    </>
  );
}
