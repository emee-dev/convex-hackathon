# @dxenv/cli Documentation

## Overview

`@dxenv/cli` is a command-line tool designed to help teams securely manage and share environment variables. With `@dxenv/cli`, you can easily push and pull environment variable files to and from your SaaS application. This tool also supports user authentication and integration with CI/CD pipelines.

## Table of Contents

- [Installation](#installation)
- [Commands](#commands)
  - [push](#push)
  - [pull](#pull)
  - [login](#login)
  - [ci](#ci)
- [Configuration File](#configuration-file)
- [Configuration](#configuration)
- [Examples](#examples)
- [Error Handling](#error-handling)
- [Additional Information](#additional-information)

## Disclaimer

**Note**: This cli has not been uploaded to npm yet. See the workspace readme for detailed build instructions. The details here includes some of the cli commands.

## Installation

Install `@dxenv/cli` globally using npm, yarn or pnpm:

```bash
npm install -g @dxenv/cli
# or
yarn global add @dxenv/cli
# or
pnpm add -g @dxenv/cli
```

## Commands

### `push`

Uploads the chosen `.env.*` file to the server.

#### Usage

```bash
dx push <filename> [options]
```

#### Arguments

- `<filename>`: The filename of the dotenv file to upload.

#### Options

- `-s, --skip [skip]`: Skip the profile mapping in the configuration.

#### Description

Uploads the specified environment file to the server. If the `-s` flag is used, it will skip profile mapping and use the default file mapping.

#### Example

```bash
dx push development
```

### `pull`

Pulls the latest changes from the server and optionally generates global types.

#### Usage

```bash
dx pull <environment> [options]
```

#### Arguments

- `<environment>`: The filename or profile alias of the file to pull.

#### Options

- `-s, --skip [skip]`: Skip the profile mapping in the configuration.
- `-ts, --types [types]`: Configure the global types for the file.

#### Description

Fetches the latest environment changes from the server. Optionally generates global types based on the pulled file.

#### Example

```bash
dx pull development --types
```

### `login`

Authenticates the user via the web app.

#### Usage

```bash
dx login [options]
```

#### Options

- `-o, --open [open]`: Open the authentication URL in the default configured browser.

#### Description

Authenticates the user by opening a web page where you can complete the login process. The tool will handle the redirect and authentication callback.

#### Example

```bash
dx login --open
```

### `ci`

Pulls the environment and injects it into the process for CI/CD environments.

#### Usage

```bash
dx ci <environment> [options]
```

#### Arguments

- `<environment>`: The filename or profile alias of the file to pull.

#### Options

- `-k, --key <char>`: API Key required to continue this action.
- `-s, --skip [skip]`: Skip the profile mapping in the configuration.

#### Description

Pulls the environment file and injects it into the process for continuous integration and deployment environments. This command is useful for environments with limited user interaction.

#### Example

```bash
dx ci local -k "dxenv_key1399202" -s
```

## Configuration File

Create a `dxenv.config.json` file in your project root to define your project and profile mappings:

```json copy
{
  "projectId": "<project id>",
  "profiles": {
    "development": ".env",
    "local": ".env.local",
    "production": ".env.production",
    "ci": ".env.ci",
    "staging": ".env.staging",
    "test": ".env.test"
  }
}
```

The configuration allows you to set your own aliases or skip it using the `-s` flag.

## Configuration

The configuration file `dxenv.config.json` should be placed in your project's root directory. It contains information about project aliases and environment mappings.

### Local Development

To configure `@dxenv/cli` for local development, follow these steps:

1. **Set Up Environment Variables**

   Create a `.env.local` file in the cli workspace based on the `.env.example` file. Ensure you include the `FRONTEND_URL` variable:

   ```env
   FRONTEND_URL=http://localhost:3000
   ```

2. **Build Script**

   When building `@dxenv/cli`, make sure `FRONTEND_URL` variable is included in the build. The following `tsup` build script ensures the `FRONTEND_URL` environment variable is correctly replaced during the build process:

   ```typescript
   import { defineConfig } from "tsup";
   import { readFile } from "fs/promises";
   import { Plugin } from "esbuild";

   const FRONTEND_URL = process.env.FRONTEND_URL;

   if (!FRONTEND_URL) {
     throw new Error("Environment variable [FRONTEND_URL] was not specified.");
   }

   const replace = (replacementMap: Record<string, string>): Plugin => {
     return {
       name: "replace-plugin",
       setup(build) {
         build.onLoad({ filter: /\.(ts|tsx|js|jsx)$/ }, async (args) => {
           let source = await readFile(args.path, "utf8");

           for (const [searchValue, replaceValue] of Object.entries(
             replacementMap
           )) {
             const regex = new RegExp(searchValue, "g");
             source = source.replace(regex, replaceValue);
           }

           return {
             contents: source,
             loader:
               args.path.endsWith(".ts") || args.path.endsWith(".tsx")
                 ? "ts"
                 : "js",
           };
         });
       },
     };
   };

   export default defineConfig({
     entry: ["./src/index.ts"],
     format: ["esm", "cjs"],
     dts: true,
     esbuildPlugins: [
       replace({
         "process.env.FRONTEND_URL": `'${FRONTEND_URL}'`,
       }),
     ],
   });
   ```

3. **Development Script**

   Use the following script to start `@dxenv/cli` in development mode:

   ```json
   "scripts": {
     "dev": "dotenv -e .env.local -- tsx ./src/index.ts"
   }
   ```

### CI Pipeline

For building in CI environments, ensure you provide the `FRONTEND_URL` as an environment variable in your CI configuration:

```yaml
env:
  FRONTEND_URL: https://convex-hackathon-pi.vercel.app
```

**Example GitHub Actions Configuration:**

```yaml
name: CI

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Install Dependencies
        run: npm install

      - name: Build
        run: npm run build

      - name: Inject Environment Variables and Start Next.js Application
        run: |
          dx ci production -k ${{ secrets.DXENV_INTEGRATION_KEY }}
          next start
```

## Examples

### Pushing an Environment File

```bash
ven push development
```

This command uploads the `.env` file associated with the `development` profile.

### Pulling an Environment File

```bash
ven pull production --types
```

This command pulls the latest changes for the `production` environment and generates global types.

### Logging In

```bash
ven login --open
```

This command opens the authentication URL in the default browser.

## Contributing

Feel free to contribute to the project by submitting issues or pull requests. Please ensure you follow the project's coding standards and guidelines.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
