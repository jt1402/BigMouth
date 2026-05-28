import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12 grid place-items-center">
      <SignIn />
    </div>
  );
}
