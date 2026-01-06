import { ContentHeader } from '@/components/shared/ContentHeader';
import { MediaManagerLayout } from '@/components/media/MediaManagerLayout';

export default function MediaPage() {
  return (
    <>
      <ContentHeader title="Media Manager" />
      <MediaManagerLayout />
    </>
  );
}
