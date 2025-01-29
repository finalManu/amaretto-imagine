import { SignedOut, SignedIn, SignInButton, UserButton } from "@clerk/nextjs";

export function TopNav() {
  return (
    <nav className="flex items-center justify-between border-b p-4 text-xl font-semibold">
      <div>Amaretto Imagine</div>
      <div>
        <SignedOut>
          <SignInButton />
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </nav>
  );
}
