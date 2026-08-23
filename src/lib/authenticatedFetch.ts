import { getFirebaseServices } from "./firebase";

export async function authenticatedProjectFetch(
  input: RequestInfo | URL,
  projectId: string,
  init: RequestInit = {}
): Promise<Response> {
  if (!projectId) throw new Error("A project is required for this server operation.");
  const user = getFirebaseServices().auth.currentUser;
  if (!user) throw new Error("Researcher sign-in is required for this server operation.");
  const token = await user.getIdToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("X-TehqIQ-Project-Id", projectId);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return fetch(input, { ...init, headers });
}
