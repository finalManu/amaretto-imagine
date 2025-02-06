import FullPageImageView from "~/components/full-page-image";

export default async function ImagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const imageId = (await params).id;

  const idAsNumber = Number(imageId);
  if (Number.isNaN(idAsNumber)) throw new Error("Invalid photo id");

  return <FullPageImageView id={idAsNumber} />;
}
