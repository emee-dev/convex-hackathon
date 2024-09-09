import { SignUp, SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <main className="flex justify-center items-center pt-28">
      <SignUp />
    </main>
  );
}
