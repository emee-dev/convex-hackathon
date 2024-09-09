export type WebhookUserCreatedPayload = {
  data: {
    birthday: string;
    created_at: number;
    email_addresses: {
      email_address: string;
      id: string;
      linked_to: never[];
      object: string;
      verification: {
        status: string;
        strategy: string;
      };
    }[];
    external_accounts: never[];
    external_id: string;
    first_name: string;
    gender: string;
    id: string;
    image_url: string;
    last_name: string;
    last_sign_in_at: number;
    object: string;
    password_enabled: boolean;
    phone_numbers: never[];
    primary_email_address_id: string;
    primary_phone_number_id: null;
    primary_web3_wallet_id: null;
    private_metadata: {};
    profile_image_url: string;
    public_metadata: {};
    two_factor_enabled: boolean;
    unsafe_metadata: {};
    updated_at: number;
    username: null;
    web3_wallets: never[];
  };
  object: "event";
  type: "user.created";
};

export type Permissions = {
  name: string;
  code: "view:env" | "create:env" | "delete:env";
  description: string;
};

export type Roles = {
  name: string;
  code: "basic_user" | "admin_user";
  description: string;
  permissions: Permissions["code"][];
};

export const permissions: Permissions[] = [
  {
    name: "View env",
    code: "view:env",
    description: "Able to view environment variables.",
  },
  {
    name: "Create env",
    code: "create:env",
    description: "Able to create environment variables.",
  },
  {
    name: "Delete env",
    code: "delete:env",
    description: "Able to delete environment variables.",
  },
];

export const roles: Record<Roles["code"], Roles> = {
  basic_user: {
    name: "Basic user",
    code: "basic_user",
    description: "",
    permissions: ["view:env"],
  },
  admin_user: {
    name: "Admin user",
    code: "admin_user",
    description:
      "Overall Project manager, coordinates the onboarding of team members.",
    permissions: ["view:env", "create:env", "delete:env"],
  },
};

export type ProfileConfig = {
  profiles: Record<string, string>;
};

export const defaultEnvMapping: Record<string, string> = {
  ".env": "development",
  ".env.local": "local",
  ".env.production": "production",
  ".env.ci": "ci",
  ".env.staging": "staging",
};

export const defaultKeyMapping: Record<string, string> = {
  development: ".env",
  local: ".env.local",
  production: ".env.production",
  ci: ".env.ci",
  staging: ".env.staging",
  test: ".env.test",
} as const;
