export default function Default() {
  return null;
}

/*
without this page, app/page.tsx <Link href={`/img/${image.id}`}> 
would not work with app/@modal/(.)img/[id]/page.tsx
export default async function ImageModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const imageId = (await params).id;
  return <div>{imageId}</div>;
}
*/
