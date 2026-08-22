import React, { useState } from "react";
import { AiLedgerEvent } from "../../types";
import { ShieldCheck, Copy, Sparkles, Check, Database, Lock } from "lucide-react";
import { generateLedgerDisclosureStatement } from "../../lib/aiValidationService";

interface AiLedgerViewProps {
  ledgerEvents: AiLedgerEvent[];
  projectTitle?: string;
}

export const AiLedgerView: React.FC<AiLedgerViewProps> = ({ ledgerEvents, projectTitle = "Scholarly Investigation" }) => {
  const [copied, setCopied] = useState(false);

  const disclosureStatement = generateLedgerDisclosureStatement(ledgerEvents, projectTitle);

  const handleCopy = () => {
    navigator.clipboard.writeText(disclosureStatement);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-mono uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Phase 6 • Append-Only AI Assistance Ledger</span>
          </div>
          <h2 className="font-bold text-xl text-white">
            AI Assistance Audit Ledger & Journal Disclosure Generator
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Every material AI action (prompt version, model, source IDs, user, timestamp, disposition) is immutably logged.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-zinc-950 p-2.5 rounded-2xl border border-zinc-800 text-xs font-mono text-amber-400">
          <Lock className="w-4 h-4 text-emerald-400" />
          <span>Append-Only Immutable Ledger</span>
        </div>
      </div>

      {/* Generated Disclosure Statement */}
      <div className="bg-gradient-to-r from-zinc-900 via-indigo-950/40 to-zinc-900 text-white p-6 rounded-3xl border border-indigo-500/40 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center space-x-2 text-amber-400">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-bold text-base text-white">Generated Scholarly AI-Use Disclosure Statement</h3>
          </div>

          <button
            onClick={handleCopy}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 transition shadow-md"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "Copied Disclosure" : "Copy Statement"}</span>
          </button>
        </div>

        <div className="bg-zinc-950 p-4 rounded-2xl font-serif text-xs text-zinc-200 leading-relaxed border border-zinc-800 whitespace-pre-wrap">
          {disclosureStatement}
        </div>

        <div className="text-[11px] text-zinc-400 flex items-center justify-between">
          <span>Compliant with ICMJE, Nature, Elsevier, Springer &amp; IEEE journal AI disclosure policies.</span>
          <span className="font-mono text-indigo-400 font-bold">Matching Events: {ledgerEvents.length}</span>
        </div>
      </div>

      {/* Ledger Audit Table */}
      <div className="bg-zinc-900 rounded-3xl border border-zinc-800 shadow-xl overflow-hidden text-xs">
        <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-white flex items-center space-x-2">
            <Database className="w-4 h-4 text-indigo-400" />
            <span>Immutable Action Log ({ledgerEvents.length} Events)</span>
          </h3>
          <span className="text-[11px] text-zinc-400 font-mono">Prompt Version: v2.4-phase6</span>
        </div>

        {ledgerEvents.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs">
            No material AI actions logged yet. Perform section drafting, peer review, or canvas suggestions to populate the ledger.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-950 text-zinc-400 font-mono uppercase tracking-wider text-[10px] border-b border-zinc-800">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Feature &amp; Section</th>
                  <th className="p-3.5">Model &amp; Prompt</th>
                  <th className="p-3.5">Source IDs</th>
                  <th className="p-3.5">CRediT Role</th>
                  <th className="p-3.5 text-right">Human Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 text-zinc-300">
                {ledgerEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-zinc-800/50 transition">
                    <td className="p-3.5 font-mono text-zinc-400 text-[11px]">
                      {new Date(ev.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3.5 font-bold text-white">
                      <div>{ev.featureUsed}</div>
                      {ev.manuscriptSection && (
                        <span className="text-[10px] font-mono text-indigo-400">{ev.manuscriptSection}</span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-amber-400 text-[11px]">
                      <div>{ev.model}</div>
                      <span className="text-zinc-500 text-[10px]">{ev.promptVersion || "v2.4-phase6"}</span>
                    </td>
                    <td className="p-3.5 font-mono text-zinc-400 text-[10px]">
                      {(ev.inputSourcesUsed || []).slice(0, 2).join(", ") || "None"}
                    </td>
                    <td className="p-3.5 font-semibold text-zinc-200">
                      {ev.creditRoleAssigned || "Writing - original draft"}
                    </td>
                    <td className="p-3.5 text-right">
                      <span
                        className={`font-bold text-[10px] px-2.5 py-1 rounded-full uppercase font-mono ${
                          ev.userDecision === "Accepted"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : ev.userDecision === "Edited"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                        }`}
                      >
                        {ev.userDecision}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
