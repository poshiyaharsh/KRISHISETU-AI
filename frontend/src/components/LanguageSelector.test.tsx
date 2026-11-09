import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { LanguageSelector } from "./LanguageSelector";
import i18n from "@/i18n";

describe("LanguageSelector Component", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("renders current language name and globe icon", () => {
    render(<LanguageSelector />);
    expect(screen.getByRole("button", { name: /Language selector/i })).toBeInTheDocument();
    expect(screen.getByText("English")).toBeInTheDocument();
  });

  it("opens listbox with search and categories when clicked", () => {
    render(<LanguageSelector />);
    const trigger = screen.getByRole("button", { name: /Language selector/i });
    fireEvent.click(trigger);

    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search/i)).toBeInTheDocument();
    expect(screen.getByText(/Verified & Ready/i)).toBeInTheDocument();
    expect(screen.getByText(/Additional Indic Languages/i)).toBeInTheDocument();
  });

  it("switches language to Hindi when clicked", async () => {
    render(<LanguageSelector />);
    fireEvent.click(screen.getByRole("button", { name: /Language selector/i }));

    const hindiOption = screen.getByRole("option", { name: /हिन्दी/i });
    fireEvent.click(hindiOption);

    expect(i18n.language).toBe("hi");
    expect(document.documentElement.lang).toBe("hi");
    expect(document.documentElement.dir).toBe("ltr");
  });

  it("switches to Urdu and sets RTL direction", async () => {
    render(<LanguageSelector />);
    fireEvent.click(screen.getByRole("button", { name: /Language selector/i }));

    const urduOption = screen.getByRole("option", { name: /اردو/i });
    fireEvent.click(urduOption);

    expect(i18n.language).toBe("ur");
    expect(document.documentElement.lang).toBe("ur");
    expect(document.documentElement.dir).toBe("rtl");
  });
});
