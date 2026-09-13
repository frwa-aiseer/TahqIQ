export type OperationState = "Pending" | "Running" | "Partial" | "Failed" | "Not Configured" | "Completed" | "Needs Review";

export interface OperationStatus { state: OperationState; message: string; }

export function operationFailure(message: string): OperationStatus {
  return { state: "Failed", message: message.trim() || "Operation failed without a diagnostic message." };
}

export function operationUnavailable(message = "This operation is not configured."): OperationStatus {
  return { state: "Not Configured", message };
}

export function operationSuccess(message: string, needsReview = false): OperationStatus {
  return { state: needsReview ? "Needs Review" : "Completed", message };
}
