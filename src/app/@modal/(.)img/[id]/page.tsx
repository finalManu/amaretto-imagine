import { getImage } from "~/server/queries";

export default async function ImageModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const imageId = (await params).id;

  const idAsNumber = Number(imageId);
  if (Number.isNaN(idAsNumber)) throw new Error("Invalid photo id");

  const image = await getImage(idAsNumber);
  return (
    <div>
      <img src={image.url} className="w-96" alt="" />
    </div>
  );
}
