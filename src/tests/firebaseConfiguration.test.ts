import { describe, expect, it } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { FIREBASE_CLIENT_ENV_KEYS, validateFirebaseClientEnv } from "../lib/firebaseConfig";

const validEnv = {
  VITE_FIREBASE_API_KEY: "AIzaTestClientKey01234567890123456789",
  VITE_FIREBASE_AUTH_DOMAIN: "project.firebaseapp.com",
  VITE_FIREBASE_PROJECT_ID: "project-id",
  VITE_FIREBASE_STORAGE_BUCKET: "project.appspot.com",
  VITE_FIREBASE_MESSAGING_SENDER_ID: "123456789",
  VITE_FIREBASE_APP_ID: "1:123456789:web:abcdef123456",
};

describe("Firebase client environment configuration", () => {
  it("returns an explicit Not Configured state when values are missing", () => {
    const result = validateFirebaseClientEnv({});
    expect(result.status).toBe("Not Configured");
    expect(result.config).toBeNull();
    expect(result.missingKeys).toEqual(FIREBASE_CLIENT_ENV_KEYS);
  });

  it("accepts a complete valid Vite client configuration", () => {
    const result = validateFirebaseClientEnv(validEnv);
    expect(result.status).toBe("Configured");
    expect(result.config).toMatchObject({ projectId: "project-id", authDomain: "project.firebaseapp.com" });
  });

  it("rejects placeholders and malformed Firebase identifiers", () => {
    const result = validateFirebaseClientEnv({
      ...validEnv,
      VITE_FIREBASE_API_KEY: "YOUR_FIREBASE_API_KEY",
      VITE_FIREBASE_AUTH_DOMAIN: "not a hostname",
      VITE_FIREBASE_MESSAGING_SENDER_ID: "sender-id",
      VITE_FIREBASE_APP_ID: "invalid-app-id",
    });
    expect(result.status).toBe("Not Configured");
    expect(result.invalidKeys).toEqual(expect.arrayContaining([
      "VITE_FIREBASE_API_KEY", "VITE_FIREBASE_AUTH_DOMAIN", "VITE_FIREBASE_MESSAGING_SENDER_ID", "VITE_FIREBASE_APP_ID",
    ]));
  });

  it("documents every required public client variable with blank placeholders", () => {
    const example = fs.readFileSync(path.resolve(process.cwd(), ".env.example"), "utf8");
    for (const key of FIREBASE_CLIENT_ENV_KEYS) expect(example).toContain(`${key}=`);
    expect(example).not.toMatch(/VITE_FIREBASE_(?:ADMIN|SERVICE_ACCOUNT|PRIVATE_KEY)/);
  });

  it("contains no built-in Firebase project fallback in application logic", () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), "src/lib/firebase.ts"), "utf8");
    expect(source).not.toContain("defaultConfig");
    expect(source).not.toContain("tehqiq-applet");
    expect(source).not.toContain("AIzaSyDemoKey");
    expect(source).toContain("validateFirebaseClientEnv");
  });
});
