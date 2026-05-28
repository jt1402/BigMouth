import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12 grid place-items-center">
      <SignUp />
    </div>
  );
}
