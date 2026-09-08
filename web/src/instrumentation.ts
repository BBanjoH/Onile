import { assertConfigOrExit } from "@/lib/env";

/**
 * Runs once when the server starts, before it accepts any request.
 *
 * The job here is to catch a broken deployment at boot rather than letting
 * real landlords and tenants discover it. See src/lib/env.ts for what's
 * checked and why.
 */
export function register() {
  // Only the Node.js server runtime has the environment we're validating;
  // the edge runtime boots separately and doesn't need this.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    assertConfigOrExit();
  }
}
