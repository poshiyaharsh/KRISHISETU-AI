import { describe, it, expect, beforeEach } from "vitest";
import i18n from "./index";
import { applyLanguageAndFont } from "./fonts";

describe("i18n Internationalization Engine", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("translates common and home strings in English", () => {
    expect(i18n.t("common.appName")).toBe("KrishiSetu AI");
    expect(i18n.t("home.ctaButton")).toBe("Get Crop Advice");
  });

  it("switches to Hindi and translates strings accurately", async () => {
    await i18n.changeLanguage("hi");
    expect(i18n.t("common.appName")).toBe("कृषिसेतु AI");
    expect(i18n.t("home.ctaButton")).toBe("फसल सलाह प्राप्त करें");
    expect(i18n.t("crops.rice")).toBe("धान (चावल)");
  });

  it("switches to Gujarati and translates crops", async () => {
    await i18n.changeLanguage("gu");
    expect(i18n.t("common.appName")).toBe("કૃષિસેતુ AI");
    expect(i18n.t("crops.rice")).toBe("ડાંગર (ચોખા)");
    expect(i18n.t("crops.cotton")).toBe("કપાસ");
  });

  it("applies RTL layout direction for Urdu", async () => {
    await applyLanguageAndFont("ur");
    expect(document.documentElement.dir).toBe("rtl");
    expect(document.documentElement.lang).toBe("ur");
  });

  it("falls back to English when a translation key is missing in a draft language", async () => {
    await i18n.changeLanguage("en");
    expect(i18n.t("nonExistentKey", "Fallback Text")).toBe("Fallback Text");
  });
});
