import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import { NotFound } from "./NotFound";
import "@/i18n";

describe("NotFound Page", () => {
  it("renders 404 heading and return to home link", () => {
    render(
      <BrowserRouter>
        <NotFound />
      </BrowserRouter>
    );

    expect(screen.getByRole("heading", { name: /Page Not Found/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Return to Home/i })).toBeInTheDocument();
  });
});
