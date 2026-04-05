import { readFileSync } from "node:fs";
import { join } from "node:path";
import { defineConfig, loadEnv } from "vite";
import { fileURLToPath, URL } from "node:url";

function readAngularPackageVersion(): string {
  try {
    const pkgPath = join(process.cwd(), "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as {
      version?: string;
    };
    return pkg.version ?? "4.0.0";
  } catch {
    return "4.0.0";
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const defaultAppVersion = readAngularPackageVersion();

  return {
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
        env["VITE_SUPABASE_URL"],
      ),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(
        env["VITE_SUPABASE_ANON_KEY"],
      ),
      "import.meta.env.VITE_APP_ENVIRONMENT": JSON.stringify(
        env["VITE_APP_ENVIRONMENT"] || "development",
      ),
      "import.meta.env.VITE_APP_NAME": JSON.stringify(
        env["VITE_APP_NAME"] || "FlagFit Pro",
      ),
      "import.meta.env.VITE_APP_VERSION": JSON.stringify(
        env["VITE_APP_VERSION"] || defaultAppVersion,
      ),
    },
  };
});
