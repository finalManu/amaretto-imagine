import {
  generateUploadButton,
  generateUploadDropzone,
  generateReactHelpers,
} from "@uploadthing/react";

import type { OurFileRouter } from "~/app/api/uploadthing/core";

export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();

//in an obj because it's a value that exists within the sdk / thing we are generating
export const { useUploadThing } = generateReactHelpers<OurFileRouter>();
