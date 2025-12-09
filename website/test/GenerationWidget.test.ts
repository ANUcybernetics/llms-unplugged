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

  it("starts in editing mode", () => {
    const wrapper = mount(GenerationWidget);
    expect(wrapper.find(".input-section").exists()).toBe(true);
    expect(wrapper.find(".generation-view").exists()).toBe(false);
  });

  it("switches to generation view on submit", async () => {
    const wrapper = mount(GenerationWidget, {
      props: { initialText: "see spot run" },
    });
    await wrapper.find(".submit-button").trigger("click");
    expect(wrapper.find(".input-section").exists()).toBe(false);
    expect(wrapper.find(".generation-view").exists()).toBe(true);
  });

  it("creates grid with vocabulary", async () => {
    const wrapper = mount(GenerationWidget, {
      props: { initialText: "see spot run" },
    });
    await wrapper.find(".submit-button").trigger("click");
    const headers = wrapper.findAll(".generation-grid th code");
    expect(headers.length).toBe(3);
  });

  it("shows output section after starting", async () => {
    const wrapper = mount(GenerationWidget, {
      props: { initialText: "see spot" },
    });
    await wrapper.find(".submit-button").trigger("click");
    expect(wrapper.find(".output-section").exists()).toBe(true);
  });

  it("shows playback controls after starting", async () => {
    const wrapper = mount(GenerationWidget, {
      props: { initialText: "see spot" },
    });
    await wrapper.find(".submit-button").trigger("click");
    expect(wrapper.find(".playback-controls").exists()).toBe(true);
  });

  it("shows placeholder text when no words generated", async () => {
    const wrapper = mount(GenerationWidget, {
      props: { initialText: "see spot run" },
    });
    await wrapper.find(".submit-button").trigger("click");
    expect(wrapper.find(".placeholder").exists()).toBe(true);
  });

  it("marks rows as clickable initially", async () => {
    const wrapper = mount(GenerationWidget, {
      props: { initialText: "see spot run" },
    });
    await wrapper.find(".submit-button").trigger("click");
    const clickableRows = wrapper.findAll("tr.clickable");
    expect(clickableRows.length).toBeGreaterThan(0);
  });
});
