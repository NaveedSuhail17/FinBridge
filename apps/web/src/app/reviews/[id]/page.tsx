import { ReviewDetailClient } from './review-detail-client';

export default async function ReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ReviewDetailClient id={id} />;
}
