"use client";

import { notFound, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CheckCircle,
  Fingerprint,
  Loader2,
  PartyPopper,
  XCircle,
} from "lucide-react";
// import toast, { Toaster } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { useAuth, useUser } from "@clerk/nextjs";

function CodeCharacter({ char }: { char: string }) {
  return (
    <div className="p-2 font-mono text-xl bg-gray-900 rounded lg:p-4 lg:text-4xl">
      {char}
    </div>
  );
}

function Cancelled() {
  return (
    <div className="w-full min-h-screen flex items-center pt-[250px] px-4 flex-col">
      {/* <Toaster />  */}
      <div className="flex pt-10">
        <div className="flex items-center justify-center pr-10">
          <XCircle className="text-gray-100" />
        </div>
        <div className="flex-col">
          <h1 className="text-lg text-gray-100">Login cancelled</h1>
          <p className="text-sm text-gray-500">You can return to your CLI.</p>
        </div>
      </div>
    </div>
  );
}

function Success() {
  return (
    <div className="w-full min-h-screen flex items-center pt-[250px] px-4 flex-col">
      {/* <Toaster /> */}
      <div className="flex pt-10">
        <div className="flex items-center justify-center pr-10">
          <PartyPopper className="text-gray-100" />
        </div>
        <div className="flex-col">
          <h1 className="text-lg text-gray-100">Login successful!</h1>
          <p className="text-sm text-gray-500">You can return to your CLI.</p>
        </div>
      </div>
    </div>
  );
}

type CliRouteResponse = {
  redirectUrl: string;
  code: string;
  userId: string;
  clerkUserId: string;
  project_role: "basic_user" | "admin_user";
  email: string;
};

type VerifyProps = {
  code: string | null;
  redirect: string | null;
  clerkUserId: string | null;
  uniqueProjectId: string | null;
};

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [success, setSuccess] = useState(false);

  const searchParams = useSearchParams();

  const { user, isLoaded, isSignedIn } = useUser();

  const _code = searchParams.get("code");
  const _redirect = searchParams.get("redirect");
  const _projectId = searchParams.get("pid");

  // useEffect(() => {
  //   if (user && isLoaded && isSignedIn) {
  //     console.log("user", user);
  //   }
  // }, [isSignedIn, isLoaded]);

  async function verify(opts: VerifyProps) {
    setLoading(true);
    try {
      const req = await fetch("/api/cli", {
        method: "POST",
        body: JSON.stringify(opts),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!req.ok) {
        throw new Error(`HTTP error! status: ${req.status}`);
      }

      const res = (await req.json()) as {
        message: string;
        data: CliRouteResponse | null;
      };

      console.log("res", res);

      if (!res.data) {
        throw new Error(`User data was not found`);
      }

      let {
        code,
        email,
        userId,
        clerkUserId,
        project_role,
        redirectUrl: redirect,
      } = res.data;

      try {
        const redirectUrl = new URL(redirect);
        redirectUrl.searchParams.append("code", code);
        redirectUrl.searchParams.append("email", email);
        redirectUrl.searchParams.append("userId", userId);
        redirectUrl.searchParams.append("clerkUserId", clerkUserId);
        redirectUrl.searchParams.append("project_role", project_role);

        await fetch(redirectUrl.toString());

        setLoading(false);
        setSuccess(true);
      } catch (_error) {
        console.error(_error);
        setLoading(false);
        // toast.error(
        //   "Error redirecting back to local CLI. Is your CLI running?"
        // );
      }
    } catch (_error) {
      setLoading(false);
      //   toast.error("Error creating Unkey API key.");
    }
  }

  async function cancel() {
    try {
      setLoading(true);
      const redirectUrl = new URL(_redirect as string);
      redirectUrl.searchParams.append("cancelled", "true");
      await fetch(redirectUrl.toString());
      setLoading(false);
      setCancelled(true);
    } catch (error: any) {
      setLoading(false);
      //   toast.error("Error cancelling login. Is your local CLI running?");
    }
  }

  if (!_code || !_redirect || !_projectId) {
    return notFound();
  }

  const opts = {
    code: _code,
    redirect: _redirect,
    clerkUserId: user?.id,
    uniqueProjectId: _projectId,
  } as VerifyProps;

  if (cancelled) {
    return <Cancelled />;
  }

  if (success) {
    return <Success />;
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center px-4 flex-col">
      {/* <Toaster /> */}
      <div className="flex flex-col">
        <div className="flex ">
          <div className="flex items-center justify-center pr-4">
            <Fingerprint className="text-gray-100" />
          </div>
          <div className="flex-col">
            <h1 className="text-lg text-gray-100">Device confirmation</h1>
            <p className="text-sm text-gray-500">
              Please confirm this is the code shown in your terminal
            </p>
          </div>
        </div>
        <div>
          <div className="grid grid-flow-col gap-1 pt-6 leading-none text-white lg:gap-3 auto-cols-auto">
            {_code
              ?.split("")
              .map((char, i) => (
                <CodeCharacter char={char} key={`${char}-${i}`} />
              ))}
          </div>
          <div className="flex justify-center pt-6">
            <div className="flex items-center">
              <Button
                variant="default"
                className="mr-2"
                onClick={() => verify(opts)}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Confirm code
              </Button>
              <Button variant="outline" onClick={() => cancel()}>
                <XCircle className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
