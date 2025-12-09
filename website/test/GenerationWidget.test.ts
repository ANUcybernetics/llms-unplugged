import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import GenerationWidget from "../.vitepress/theme/components/GenerationWidget.vue";

describe("GenerationWidget", () => {
  it("renders with default text", () => {
    const wrapper = mount(GenerationWidget);
    expect(wrapper.find(".generation-widget").exists()).toBe(true);
    expect(wrapper.find("textarea").exists()).toBe(true);
  });

  it("renders with custom initial text", () => {
    const wrapper = mount(GenerationWidget, {
      props: { initialText: "hello world" },
    });
    expect(wrapper.find("textarea").element.value).toBe("hello world");
  });

  it("renders with custom dice sides", () => {
    const wrapper = mount(GenerationWidget, {
      props: { diceSides: 20 },
    });
    expect(wrapper.props("diceSides")).toBe(20);
  });

  it("shows all sections on initial render", () => {
    const wrapper = mount(GenerationWidget);
    expect(wrapper.find(".input-section").exists()).toBe(true);
    expect(wrapper.find(".generation-view").exists()).toBe(true);
    expect(wrapper.find(".tokens-section").exists()).toBe(true);
    expect(wrapper.find(".grid-section").exists()).toBe(true);
  });

  it("creates grid with vocabulary", () => {
    const wrapper = mount(GenerationWidget, {
      props: { initialText: "see spot run" },
    });
    const headers = wrapper.findAll(".generation-grid th code");
    expect(headers.length).toBe(3);
  });

  it("shows output section", () => {
    const wrapper = mount(GenerationWidget, {
      props: { initialText: "see spot" },
    });
    expect(wrapper.find(".output-section").exists()).toBe(true);
  });

  it("shows playback controls", () => {
    const wrapper = mount(GenerationWidget, {
      props: { initialText: "see spot" },
    });
    expect(wrapper.find(".playback-controls").exists()).toBe(true);
  });

  it("shows placeholder text when no words generated", () => {
    const wrapper = mount(GenerationWidget, {
      props: { initialText: "see spot run" },
    });
    expect(wrapper.find(".placeholder").exists()).toBe(true);
  });

  it("marks rows as clickable initially", () => {
    const wrapper = mount(GenerationWidget, {
      props: { initialText: "see spot run" },
    });
    const clickableRows = wrapper.findAll("tr.clickable");
    expect(clickableRows.length).toBeGreaterThan(0);
  });

  it("displays tokens section with parsed tokens", () => {
    const wrapper = mount(GenerationWidget, {
      props: { initialText: "Hello, world!" },
    });
    const tokens = wrapper.findAll(".tokens-section .token");
    expect(tokens.length).toBe(4);
    expect(tokens.map((t) => t.text())).toEqual(["hello", ",", "world", "!"]);
  });
});
