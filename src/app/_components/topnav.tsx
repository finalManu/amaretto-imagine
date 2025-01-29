"use client"; /* get error for router.refresh() if not used
because hooks need to be in client components since they are all
about the component updating once it's on the client's device */

import { SignedOut, SignedIn, SignInButton, UserButton } from "@clerk/nextjs";
import { UploadButton } from "../utils/uploadthing";
import { useRouter } from "next/navigation";

export function TopNav() {
  const router = useRouter();

  return (
    <nav className="flex items-center justify-between border-b p-4 text-xl font-semibold">
      <div>Amaretto Imagine</div>
      <div className="flex flex-row">
        <SignedOut>
          <SignInButton />
        </SignedOut>
        <SignedIn>
          <UploadButton
            endpoint="imageUploader"
            onClientUploadComplete={() => {
              /*
              router refresh is kind of magical,
              it Reruns current route we're on, 
              on the server and sends you down the 
              necessary parts to update the page's content
               */
              router.refresh();
            }}
          />
          <UserButton />
        </SignedIn>
      </div>
    </nav>
  );
}
