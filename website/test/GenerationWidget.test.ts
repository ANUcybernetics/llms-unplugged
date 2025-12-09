import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import GenerationWidget from "../.vitepress/theme/components/GenerationWidget.vue";
import { resetTrainingText } from "../.vitepress/theme/composables/useTrainingText";

describe("GenerationWidget", () => {
  beforeEach(() => {
    resetTrainingText();
  });

  it("renders with default text", () => {
    const wrapper = mount(GenerationWidget);
    expect(wrapper.find(".generation-widget").exists()).toBe(true);
    expect(wrapper.find("textarea").exists()).toBe(true);
  });

  it("renders with custom dice sides", () => {
    const wrapper = mount(GenerationWidget, {
      props: { diceSides: 20 },
    });
    expect(wrapper.props("diceSides")).toBe(20);
  });

  it("shows all sections on initial render", () => {
    const wrapper = mount(GenerationWidget);
    expect(wrapper.find(".generation-view").exists()).toBe(true);
    const sections = wrapper.findAll(".widget-section");
    expect(sections.length).toBeGreaterThanOrEqual(4);
  });

  it("creates grid with vocabulary", async () => {
    const wrapper = mount(GenerationWidget);
    await wrapper.find("textarea").setValue("see spot run");
    const headers = wrapper.findAll(".bigram-grid th code");
    expect(headers.length).toBe(3);
  });

  it("shows output section", () => {
    const wrapper = mount(GenerationWidget);
    expect(wrapper.find(".output-content").exists()).toBe(true);
  });

  it("shows playback controls", () => {
    const wrapper = mount(GenerationWidget);
    expect(wrapper.find(".playback-controls").exists()).toBe(true);
  });

  it("shows placeholder text when no words generated", () => {
    const wrapper = mount(GenerationWidget);
    expect(wrapper.find(".placeholder").exists()).toBe(true);
  });

  it("marks rows as clickable initially", async () => {
    const wrapper = mount(GenerationWidget);
    await wrapper.find("textarea").setValue("see spot run");
    const clickableRows = wrapper.findAll("tr.clickable");
    expect(clickableRows.length).toBeGreaterThan(0);
  });

  it("displays tokens section with parsed tokens", async () => {
    const wrapper = mount(GenerationWidget);
    await wrapper.find("textarea").setValue("Hello, world.");
    const tokens = wrapper.findAll(".tokens-content .token");
    expect(tokens.length).toBe(4);
    expect(tokens.map((t) => t.text())).toEqual(["hello", ",", "world", "."]);
  });
});
