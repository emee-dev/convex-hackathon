import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <main className="flex justify-center items-center pt-28">
      <SignIn forceRedirectUrl={"/console"} />
    </main>
  );
}
