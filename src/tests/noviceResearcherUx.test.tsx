import React, { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QuestionBuilderView } from "../components/views/QuestionBuilderView";
import type { ResearchQuestionItem } from "../types";

function QuestionBuilderHarness({ onUpdate }: { onUpdate: (updated: ResearchQuestionItem[]) => void }) {
  const [questions, setQuestions] = useState<ResearchQuestionItem[]>([]);
  return (
    <QuestionBuilderView
      questions={questions}
      onUpdateQuestions={(updated) => {
        onUpdate(updated);
        setQuestions(updated);
      }}
    />
  );
}

describe("TQ-VSC-094 novice-researcher question flow", () => {
  it("does not show an inferred FINER score or an unusable approval state for a new project", () => {
    const onUpdate = vi.fn();
    render(<QuestionBuilderView questions={[]} onUpdateQuestions={onUpdate} />);

    expect(screen.getByText(/No research question has been added/i)).toBeInTheDocument();
    expect(screen.getByText(/FINER scores remain Researcher Input Required/i)).toBeInTheDocument();
    expect(screen.queryByText(/41\/50/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Approve as researcher/i })).not.toBeInTheDocument();
  });

  it("lets a researcher add, score, and explicitly approve a question", () => {
    const onUpdate = vi.fn();
    render(<QuestionBuilderHarness onUpdate={onUpdate} />);

    fireEvent.click(screen.getByRole("button", { name: /Add research question/i }));
    const questionInput = screen.getByPlaceholderText(/Write the question your study will answer/i);
    fireEvent.change(questionInput, { target: { value: "What outcome will this study measure?" } });

    fireEvent.click(screen.getByRole("button", { name: /Approve as researcher/i }));
    expect(screen.getByRole("status")).toHaveTextContent(/score all five FINER criteria/i);

    for (const label of ["Feasible", "Interesting", "Novel", "Ethical", "Relevant"]) {
      fireEvent.change(screen.getByRole("spinbutton", { name: `${label} FINER score` }), { target: { value: "8" } });
    }

    fireEvent.click(screen.getByRole("button", { name: /Approve as researcher/i }));
    expect(onUpdate).toHaveBeenLastCalledWith([
      expect.objectContaining({
        question: "What outcome will this study measure?",
        isApproved: true,
        finerScore: expect.objectContaining({ totalScore: 40 }),
      }),
    ]);
    expect(screen.getByRole("button", { name: /Approved by researcher/i })).toBeInTheDocument();
  });

  it("keeps a blank question visibly unresolved", () => {
    const onUpdate = vi.fn();
    render(<QuestionBuilderHarness onUpdate={onUpdate} />);

    fireEvent.click(screen.getByRole("button", { name: /Add research question/i }));
    expect(screen.getByText(/Questions \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/FINER: Researcher input required/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Approve as researcher/i })).toBeInTheDocument();
  });
});
