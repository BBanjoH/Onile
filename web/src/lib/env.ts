// Configuration checks.
//
// The failure mode this prevents: the site deploys, looks fine, and then
// quietly misbehaves in production — sessions that can't be signed, links
// in emails pointing at localhost, a JWT secret left at its example value
// so anyone who has read the repository can forge a login.
//
// Rather than discovering that from a user, we check at startup and refuse
// to run with a plain message saying exactly what to fix.

const PLACEHOLDER_SECRETS = [
  "replace-this-with-a-long-random-secret",
  "changeme",
  "secret",
];

export type ConfigProblem = { variable: string; problem: string; fix: string };

export function findConfigProblems(env: NodeJS.ProcessEnv = process.env): ConfigProblem[] {
  const problems: ConfigProblem[] = [];
  const isProduction = env.NODE_ENV === "production";

  if (!env.DATABASE_URL) {
    problems.push({
      variable: "DATABASE_URL",
      problem: "No database is configured.",
      fix: 'Set DATABASE_URL to your database address (for local testing: "file:./dev.db").',
    });
  }

  const secret = env.JWT_SECRET;
  if (!secret) {
    problems.push({
      variable: "JWT_SECRET",
      problem: "Missing — nobody would be able to log in.",
      fix: 'Generate one by running: openssl rand -base64 48',
    });
  } else if (isProduction && (secret.length < 32 || PLACEHOLDER_SECRETS.includes(secret))) {
    problems.push({
      variable: "JWT_SECRET",
      problem: "Still set to a short or example value. Anyone could forge a login.",
      fix: "Generate a real one: openssl rand -base64 48",
    });
  }

  if (isProduction) {
    const appUrl = env.NEXT_PUBLIC_APP_URL;
    if (!appUrl || appUrl.includes("localhost")) {
      problems.push({
        variable: "NEXT_PUBLIC_APP_URL",
        problem: "Not set to your real web address, so payment links would send people to the wrong place.",
        fix: 'Set it to your live address, e.g. "https://onile.ng" (no slash at the end).',
      });
    }

    // Flutterwave is optional, but half-configured is worse than not
    // configured: the Pay Now button appears and then fails.
    const flwKeys = [env.FLW_PUBLIC_KEY, env.FLW_SECRET_KEY].filter(Boolean).length;
    if (flwKeys === 1) {
      problems.push({
        variable: "FLW_PUBLIC_KEY / FLW_SECRET_KEY",
        problem: "Only one of the two Flutterwave keys is set, so online rent payment would fail.",
        fix: "Set both keys, or remove both to turn online payment off.",
      });
    }
    if (env.FLW_SECRET_KEY && !env.FLW_SECRET_HASH) {
      problems.push({
        variable: "FLW_SECRET_HASH",
        problem: "Online payment is on but the webhook secret is missing, so some payments may not be recorded.",
        fix: "Copy the Secret Hash from Flutterwave (Settings > Webhooks) into FLW_SECRET_HASH.",
      });
    }
    // Same reasoning as Flutterwave: a half-configured SMS provider is
    // worse than none, because reset codes would silently never arrive.
    if (env.SMS_PROVIDER === "termii" && !env.TERMII_API_KEY) {
      problems.push({
        variable: "TERMII_API_KEY",
        problem: "SMS_PROVIDER is set to termii but the API key is missing, so no text messages would send.",
        fix: "Add your Termii API key, or clear SMS_PROVIDER to turn text messages off.",
      });
    }
    if (env.SMS_PROVIDER === "africastalking" && !(env.AT_API_KEY && env.AT_USERNAME)) {
      problems.push({
        variable: "AT_API_KEY / AT_USERNAME",
        problem: "SMS_PROVIDER is set to africastalking but its credentials are incomplete.",
        fix: "Add both AT_API_KEY and AT_USERNAME, or clear SMS_PROVIDER to turn text messages off.",
      });
    }
    if (env.SMS_PROVIDER && !["termii", "africastalking"].includes(env.SMS_PROVIDER)) {
      problems.push({
        variable: "SMS_PROVIDER",
        problem: `"${env.SMS_PROVIDER}" is not a provider Onile knows about.`,
        fix: 'Use "termii" or "africastalking", or leave it empty.',
      });
    }

    const supabaseBits = [env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, env.SUPABASE_STORAGE_BUCKET].filter(Boolean).length;
    if (supabaseBits > 0 && supabaseBits < 3) {
      problems.push({
        variable: "SUPABASE_URL / SUPABASE_SERVICE_KEY / SUPABASE_STORAGE_BUCKET",
        problem: "Photo storage is only partly configured, so uploading a photo would fail.",
        fix: "Set all three, or remove all three to keep photos in the database.",
      });
    }

    if (env.FLW_SECRET_KEY?.includes("TEST")) {
      problems.push({
        variable: "FLW_SECRET_KEY",
        problem: "This is a Flutterwave TEST key, so no real money can be collected.",
        fix: "Replace it with your Live key from the Flutterwave dashboard.",
      });
    }
  }

  return problems;
}

export function formatConfigProblems(problems: ConfigProblem[]): string {
  const lines = problems.map((p, i) => `  ${i + 1}. ${p.variable}\n     Problem: ${p.problem}\n     Fix:     ${p.fix}`);
  return [
    "",
    "=====================================================================",
    " Onile cannot start — something in the configuration needs fixing:",
    "=====================================================================",
    ...lines,
    "",
    " These are set as environment variables on your hosting provider",
    " (or in the .env file when running on your own computer).",
    " See LAUNCH.md for step-by-step instructions.",
    "=====================================================================",
    "",
  ].join("\n");
}

/**
 * Called once from instrumentation.ts when the server boots. In production
 * a bad configuration stops the process; in development we warn loudly but
 * let the developer carry on working.
 */
export function assertConfigOrExit() {
  const problems = findConfigProblems();
  if (problems.length === 0) return;

  const message = formatConfigProblems(problems);
  if (process.env.NODE_ENV === "production") {
    console.error(message);
    throw new Error(`Invalid configuration: ${problems.map((p) => p.variable).join(", ")}`);
  }
  console.warn(message);
}
