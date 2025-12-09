import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import TrainingWidget from "../.vitepress/theme/components/TrainingWidget.vue";
import { resetTrainingText } from "../.vitepress/theme/composables/useTrainingText";

describe("TrainingWidget", () => {
  beforeEach(() => {
    resetTrainingText();
  });

  it("renders with default text", () => {
    const wrapper = mount(TrainingWidget);
    expect(wrapper.find(".training-widget").exists()).toBe(true);
    expect(wrapper.find("textarea").exists()).toBe(true);
  });

  it("shows all sections at once", () => {
    const wrapper = mount(TrainingWidget);
    expect(wrapper.find(".training-view").exists()).toBe(true);
    const sections = wrapper.findAll(".widget-section");
    expect(sections.length).toBeGreaterThanOrEqual(4);
  });

  it("displays tokens from text", async () => {
    const wrapper = mount(TrainingWidget);
    await wrapper.find("textarea").setValue("see spot run");
    const tokens = wrapper.findAll(".token");
    expect(tokens.length).toBe(3);
    expect(tokens[0].text()).toBe("see");
    expect(tokens[1].text()).toBe("spot");
    expect(tokens[2].text()).toBe("run");
  });

  it("creates grid with vocabulary", async () => {
    const wrapper = mount(TrainingWidget);
    await wrapper.find("textarea").setValue("see spot run");
    const headers = wrapper.findAll(".bigram-grid th code");
    expect(headers.length).toBe(3);
    expect(headers[0].text()).toBe("see");
    expect(headers[1].text()).toBe("spot");
    expect(headers[2].text()).toBe("run");
  });

  it("shows playback controls", () => {
    const wrapper = mount(TrainingWidget);
    expect(wrapper.find(".playback-controls").exists()).toBe(true);
  });

  it("handles empty input gracefully", async () => {
    const wrapper = mount(TrainingWidget);
    await wrapper.find("textarea").setValue("");
    expect(wrapper.find(".training-view").exists()).toBe(true);
    expect(wrapper.findAll(".token").length).toBe(0);
  });

  it("updates tokens when text changes", async () => {
    const wrapper = mount(TrainingWidget);
    await wrapper.find("textarea").setValue("hello");
    expect(wrapper.findAll(".token").length).toBe(1);
    await wrapper.find("textarea").setValue("hello world");
    expect(wrapper.findAll(".token").length).toBe(2);
  });
});
