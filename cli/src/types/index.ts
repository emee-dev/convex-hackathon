export type PushRequest = {
  path: string;
  content: string;
  fileName: string;
  projectId: string;
  clerkUserId: string;
};

export type PullRequest = {
  fileName: string;
  projectId: string;
  userEmail: string;
  clerkUserId: string;
};

export type UserConfig = {
  code: string;
  email: string;
  userId: string;
  redirectUrl: string;
  clerkUserId: string;
  project_role: "basic_user" | "admin_user";
};

export type Config = {
  projectId: string;
  profiles: Record<string, string>;
};

export type PushResponse = {
  message: string[];
  data: {
    modified: boolean;
    acknowledged: boolean;
  };
};
export type PullResponse = {
  message: string | string[];
  data: {
    fileName: string;
    decryptedText: string;
  };
};

export type WriteGlobalType = {
  dir: string;
  data: string;
  alias: string;
};
