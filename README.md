This is a convex hackathon project which is a monorepo setup and the following includes setup guides.

## Getting Started

Git clone the project repo

```bash
# Pull repo
git clone https://github.com/emee-dev/convex-hackathon.git

# cd folder directory
cd convex-hackathon

```

## Install dependancies

You can probably use any package manager of your choice, but pnpm is recommended.

```bash

npm install -g pnpm

# Install packages
pnpm install

```

## Folder structure

- **/cli:** the cli workspace includes all the code required to build and run the cli.
- **/ui:** The UI workspace includes the Next js code required to start the webapp.

## Environment variables in UI workspace

Please copy the files in `.env.example` to `.env.local`. The following technologies were used, in order to make this tool work, so register and get the required keys and credentials.

- **Convex DB:** https://dashboard.convex.dev/
- **Gemini LLM:** https://aistudio.google.com/app/apikey
- **Clerk Auth:** https://dashboard.clerk.com/apps/
- **Upstash Redis:** https://console.upstash.com/redis/
- **Unkey:** https://unkey.com/
- **Sentry:** https://sentry.io/

## CLI Setup and Usage

To be able to push and pull environment variables, it is important to do the following. Since the npm package has not yet been upload to npm. In the CLI workspace, copy `.env.example` to `.env.local`.

```bash
# cd cli folder
cd cli

# rename .env.example to .env.local

# build workspace
pnpm build

# install cli globally on your machine
pnpm link --global

# check if it was installed
dx --version # or dxenv --version

# Login with command (will open in default browser)
dx login --open

# Usage:
# create project on the webapp
# copy project config from webapp and
# paste config into the project directory

# Configure alias or use --skip flag to use default mapping
dx push local --skip

# Goto dashboard and to see the changes
# under the newly created project

# Pull environment variables into the process
# Optionally generate types using -ts flag
dx pull local --skip

```

The following is the default environment name or profile alias mapping. Be sure the file exists in the folder when you run the command.

```ts
export const defaultKeyMapping: Record<string, string> = {
  development: ".env",
  local: ".env.local",
  production: ".env.production",
  ci: ".env.ci",
  staging: ".env.staging",
  test: ".env.test",
} as const;
```

## Live deployment

The project is deployed on vercel. You can preview a demo here (on vercel)[https://convex-hackathon-pi.vercel.app/]
