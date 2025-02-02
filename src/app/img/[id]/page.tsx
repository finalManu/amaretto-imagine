export default async function ImageModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const imageId = (await params).id;
  return <div>{imageId}</div>;
}
