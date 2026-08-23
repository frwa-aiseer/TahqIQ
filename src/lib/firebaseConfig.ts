export const FIREBASE_CLIENT_ENV_KEYS = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
] as const;

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export type FirebaseConfigurationState =
  | { status: "Configured"; config: FirebaseClientConfig; missingKeys: []; invalidKeys: [] }
  | { status: "Not Configured"; config: null; missingKeys: string[]; invalidKeys: string[] };

const PLACEHOLDER_PATTERN = /^(?:your[_-]|replace[_-]|example|placeholder|my[_-]|<|\$\{)/i;

function isValidHostname(value: string): boolean {
  return /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(value);
}

export function validateFirebaseClientEnv(env: Record<string, unknown>): FirebaseConfigurationState {
  const values = Object.fromEntries(
    FIREBASE_CLIENT_ENV_KEYS.map((key) => [key, typeof env[key] === "string" ? env[key].trim() : ""])
  ) as Record<(typeof FIREBASE_CLIENT_ENV_KEYS)[number], string>;
  const missingKeys = FIREBASE_CLIENT_ENV_KEYS.filter((key) => !values[key]);
  const invalidKeys = FIREBASE_CLIENT_ENV_KEYS.filter((key) => values[key] && PLACEHOLDER_PATTERN.test(values[key]));

  if (values.VITE_FIREBASE_API_KEY && !/^AIza[0-9A-Za-z_-]{20,}$/.test(values.VITE_FIREBASE_API_KEY)) invalidKeys.push("VITE_FIREBASE_API_KEY");
  if (values.VITE_FIREBASE_AUTH_DOMAIN && !isValidHostname(values.VITE_FIREBASE_AUTH_DOMAIN)) invalidKeys.push("VITE_FIREBASE_AUTH_DOMAIN");
  if (values.VITE_FIREBASE_PROJECT_ID && !/^[a-z][a-z0-9-]{4,29}[a-z0-9]$/.test(values.VITE_FIREBASE_PROJECT_ID)) invalidKeys.push("VITE_FIREBASE_PROJECT_ID");
  if (values.VITE_FIREBASE_STORAGE_BUCKET && !isValidHostname(values.VITE_FIREBASE_STORAGE_BUCKET)) invalidKeys.push("VITE_FIREBASE_STORAGE_BUCKET");
  if (values.VITE_FIREBASE_MESSAGING_SENDER_ID && !/^\d+$/.test(values.VITE_FIREBASE_MESSAGING_SENDER_ID)) invalidKeys.push("VITE_FIREBASE_MESSAGING_SENDER_ID");
  if (values.VITE_FIREBASE_APP_ID && !/^1:\d+:(?:web|android|ios):[A-Za-z0-9]+$/.test(values.VITE_FIREBASE_APP_ID)) invalidKeys.push("VITE_FIREBASE_APP_ID");

  const uniqueInvalidKeys = [...new Set(invalidKeys)];
  if (missingKeys.length || uniqueInvalidKeys.length) {
    return { status: "Not Configured", config: null, missingKeys, invalidKeys: uniqueInvalidKeys };
  }

  return {
    status: "Configured",
    config: {
      apiKey: values.VITE_FIREBASE_API_KEY,
      authDomain: values.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: values.VITE_FIREBASE_PROJECT_ID,
      storageBucket: values.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: values.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: values.VITE_FIREBASE_APP_ID,
    },
    missingKeys: [],
    invalidKeys: [],
  };
}
