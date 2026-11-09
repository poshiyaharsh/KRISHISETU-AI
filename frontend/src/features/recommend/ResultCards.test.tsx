import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ResultCards } from "./ResultCards";
import type { RecommendationResponse } from "./types";
import "@/i18n";

const MOCK_RESPONSE: RecommendationResponse = {
  request_id: "test-uuid-1234",
  results: [
    { rank: 1, crop: { key: "rice", name: "Rice" }, score: 0.9215, label: "strongly_recommended" },
    { rank: 2, crop: { key: "jute", name: "Jute" }, score: 0.0785, label: "conditional" },
    { rank: 3, crop: { key: "pomegranate", name: "Pomegranate" }, score: 0.0, label: "conditional" },
  ],
  warnings: ["Temperature 52.0°C is outside historical training range."],
  model: { version: "crs-1.0.0" },
};

const renderResultCards = (props: {
  response: RecommendationResponse;
  onReset: () => void;
  onEdit: () => void;
}) =>
  render(
    <MemoryRouter>
      <ResultCards {...props} />
    </MemoryRouter>
  );

describe("ResultCards Component", () => {
  it("renders all top 3 crops with rankings and percentage texts", () => {
    renderResultCards({ response: MOCK_RESPONSE, onReset: vi.fn(), onEdit: vi.fn() });

    expect(screen.getByRole("heading", { name: /Rice/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Jute/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Pomegranate/i })).toBeInTheDocument();

    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("#2")).toBeInTheDocument();
    expect(screen.getByText("#3")).toBeInTheDocument();

    // Check percentage and score text
    expect(screen.getByText(/92%/i)).toBeInTheDocument();
    expect(screen.getByText(/0.9215/i)).toBeInTheDocument();

    // Check Nutrition info links
    const nutritionLinks = screen.getAllByText(/Nutrition info/i);
    expect(nutritionLinks.length).toBe(3);
  });

  it("displays warnings banner when warnings exist", () => {
    renderResultCards({ response: MOCK_RESPONSE, onReset: vi.fn(), onEdit: vi.fn() });

    expect(screen.getByRole("status")).toHaveTextContent(
      /Temperature 52\.0°C is outside historical training range/i
    );
  });

  it("triggers onEdit and onReset callbacks", () => {
    const handleEdit = vi.fn();
    const handleReset = vi.fn();

    renderResultCards({ response: MOCK_RESPONSE, onReset: handleReset, onEdit: handleEdit });

    fireEvent.click(screen.getByRole("button", { name: /Edit Values/i }));
    expect(handleEdit).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /Start Again/i }));
    expect(handleReset).toHaveBeenCalledTimes(1);
  });
});
