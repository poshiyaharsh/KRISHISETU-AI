import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { RecommendForm } from "./RecommendForm";
import "@/i18n"; // Ensure i18n initialized

describe("RecommendForm Component", () => {
  it("renders all 7 agricultural input fields with units", () => {
    const { container } = render(<RecommendForm onSubmit={vi.fn()} isLoading={false} />);

    expect(container.querySelector("#field-nitrogen")).toBeInTheDocument();
    expect(container.querySelector("#field-phosphorus")).toBeInTheDocument();
    expect(container.querySelector("#field-potassium")).toBeInTheDocument();
    expect(container.querySelector("#field-temperature")).toBeInTheDocument();
    expect(container.querySelector("#field-humidity")).toBeInTheDocument();
    expect(container.querySelector("#field-ph")).toBeInTheDocument();
    expect(container.querySelector("#field-rainfall")).toBeInTheDocument();
  });

  it("populates inputs when clicking 'Fill Sample Values'", async () => {
    const { container } = render(<RecommendForm onSubmit={vi.fn()} isLoading={false} />);

    const sampleBtn = screen.getByRole("button", { name: /Fill Sample Values/i });
    fireEvent.click(sampleBtn);

    const nitrogenInput = container.querySelector("#field-nitrogen") as HTMLInputElement;
    const phInput = container.querySelector("#field-ph") as HTMLInputElement;

    await waitFor(() => {
      expect(nitrogenInput.value).toBe("90");
      expect(phInput.value).toBe("6.5");
    });
  });

  it("calls onSubmit with numeric values when form is valid", async () => {
    const handleSubmit = vi.fn();
    render(<RecommendForm onSubmit={handleSubmit} isLoading={false} />);

    // Click sample button
    fireEvent.click(screen.getByRole("button", { name: /Fill Sample Values/i }));

    // Click submit
    const submitBtn = screen.getByRole("button", { name: /Analyze & Recommend Crops/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
      const data = handleSubmit.mock.calls[0][0];
      expect(data.nitrogen).toBe(90);
      expect(data.ph).toBe(6.5);
    });
  });

  it("blocks submission and shows error when a value is out of range", async () => {
    const handleSubmit = vi.fn();
    const { container } = render(<RecommendForm onSubmit={handleSubmit} isLoading={false} />);

    fireEvent.click(screen.getByRole("button", { name: /Fill Sample Values/i }));

    // Set pH out of range (max is 14)
    const phInput = container.querySelector("#field-ph") as HTMLInputElement;
    fireEvent.change(phInput, { target: { value: "25" } });

    fireEvent.click(screen.getByRole("button", { name: /Analyze & Recommend Crops/i }));

    await waitFor(() => {
      expect(handleSubmit).not.toHaveBeenCalled();
      expect(screen.getByText(/at most 14/i)).toBeInTheDocument();
    });
  });

  it("renders server error alert when passed via props", () => {
    render(
      <RecommendForm
        onSubmit={vi.fn()}
        isLoading={false}
        serverError="The recommendation model is temporarily unavailable."
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      /The recommendation model is temporarily unavailable/i
    );
  });
});
