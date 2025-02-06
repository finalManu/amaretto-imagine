import { SignedOut, SignedIn, SignInButton, UserButton } from "@clerk/nextjs";
import { SimpleUploadButton } from "./simple-upload-button";

export function TopNav() {
  return (
    <nav className="flex items-center justify-between border-b p-4 text-xl font-semibold">
      <div>Amaretto Imagine</div>
      <div className="flex flex-row items-center gap-4">
        <SignedOut>
          <SignInButton />
        </SignedOut>
        <SignedIn>
          {/* <UploadButton
            endpoint="imageUploader"
            onClientUploadComplete={() => {
              
              router refresh is kind of magical,
              it Reruns current route we're on, 
              on the server and sends you down the 
              necessary parts to update the page's content
               
              router.refresh();
            }}
          /> */}
          <SimpleUploadButton />
          <UserButton />
        </SignedIn>
      </div>
    </nav>
  );
}
