import type { AnalysisOutput } from "../types";

export type AnalysisVariableType = "Numeric" | "Categorical" | "Ordinal" | "Date" | "ID";

export interface AnalysisMethodDiagnostic {
  id: string;
  label: string;
  description: string;
}

export interface AnalysisMethodDefinition<TInput> {
  id: string;
  family: string;
  label: string;
  availability: "Enabled" | "Planned" | "Unavailable";
  availabilityReason?: string;
  aliases: readonly string[];
  compatibleVariableTypes: Readonly<Record<string, readonly AnalysisVariableType[]>>;
  requiredInputs: readonly string[];
  assumptions: readonly string[];
  outputSchema: Readonly<Record<string, string>>;
  diagnostics: readonly AnalysisMethodDiagnostic[];
  reproducibility: Readonly<{
    deterministic: boolean;
    recordsDatasetHash: boolean;
    recordsPlanId: boolean;
    emitsCode: boolean;
  }>;
  execute?: (input: TInput) => AnalysisOutput;
}

const normalizeMethodName = (value: string): string => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export class AnalysisMethodRegistry {
  private readonly methods = new Map<string, AnalysisMethodDefinition<unknown>>();
  private readonly aliases = new Map<string, string>();

  register<TInput>(definition: AnalysisMethodDefinition<TInput>): void {
    const id = definition.id.trim();
    if (!id || this.methods.has(id)) throw new Error(`Analysis method '${id || "Missing"}' is already registered or invalid.`);
    if (definition.availability === "Enabled" && typeof definition.execute !== "function") throw new Error(`Enabled analysis method '${id}' requires an executor.`);
    if (definition.availability !== "Enabled" && typeof definition.execute === "function") throw new Error(`${definition.availability} analysis method '${id}' cannot expose an executor.`);
    if (definition.availability !== "Enabled" && !definition.availabilityReason?.trim()) throw new Error(`${definition.availability} analysis method '${id}' requires an availability reason.`);

    const methodNames = [id, definition.label, ...definition.aliases].map(normalizeMethodName);
    for (const name of methodNames) {
      if (!name) throw new Error(`Analysis method '${id}' contains an empty identifier or alias.`);
      if (this.aliases.has(name)) throw new Error(`Analysis method alias '${name}' is already registered.`);
    }

    const frozen = Object.freeze({
      ...definition,
      aliases: Object.freeze([...definition.aliases]),
      requiredInputs: Object.freeze([...definition.requiredInputs]),
      assumptions: Object.freeze([...definition.assumptions]),
      diagnostics: Object.freeze(definition.diagnostics.map((item) => Object.freeze({ ...item }))),
      compatibleVariableTypes: Object.freeze({ ...definition.compatibleVariableTypes }),
      outputSchema: Object.freeze({ ...definition.outputSchema }),
      reproducibility: Object.freeze({ ...definition.reproducibility }),
    }) as AnalysisMethodDefinition<unknown>;

    this.methods.set(id, frozen);
    methodNames.forEach((name) => this.aliases.set(name, id));
  }

  get<TInput = unknown>(id: string): AnalysisMethodDefinition<TInput> | undefined {
    return this.methods.get(id) as AnalysisMethodDefinition<TInput> | undefined;
  }

  resolve<TInput = unknown>(methodName: string): AnalysisMethodDefinition<TInput> | undefined {
    const id = this.aliases.get(normalizeMethodName(methodName));
    return id ? this.get<TInput>(id) : undefined;
  }

  list(): readonly AnalysisMethodDefinition<unknown>[] {
    return Object.freeze([...this.methods.values()]);
  }

  execute<TInput>(methodId: string, input: TInput): AnalysisOutput {
    const method = this.get<TInput>(methodId);
    if (!method) throw new Error(`Analysis method '${methodId}' is not configured.`);
    if (method.availability !== "Enabled" || !method.execute) throw new Error(`Analysis method '${methodId}' is ${method.availability.toLowerCase()}: ${method.availabilityReason}`);
    return method.execute(input);
  }
}
