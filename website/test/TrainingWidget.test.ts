import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import TrainingWidget from "../.vitepress/theme/components/TrainingWidget.vue";

describe("TrainingWidget", () => {
  it("renders with default text", () => {
    const wrapper = mount(TrainingWidget);
    expect(wrapper.find(".training-widget").exists()).toBe(true);
    expect(wrapper.find("textarea").exists()).toBe(true);
  });

  it("renders with custom initial text", () => {
    const wrapper = mount(TrainingWidget, {
      props: { initialText: "hello world" },
    });
    expect(wrapper.find("textarea").element.value).toBe("hello world");
  });

  it("shows all sections at once", () => {
    const wrapper = mount(TrainingWidget);
    expect(wrapper.find(".input-section").exists()).toBe(true);
    expect(wrapper.find(".training-view").exists()).toBe(true);
    expect(wrapper.find(".tokens-section").exists()).toBe(true);
    expect(wrapper.find(".grid-section").exists()).toBe(true);
  });

  it("displays tokens from initial text", () => {
    const wrapper = mount(TrainingWidget, {
      props: { initialText: "see spot run" },
    });
    const tokens = wrapper.findAll(".token");
    expect(tokens.length).toBe(3);
    expect(tokens[0].text()).toBe("see");
    expect(tokens[1].text()).toBe("spot");
    expect(tokens[2].text()).toBe("run");
  });

  it("creates grid with vocabulary", () => {
    const wrapper = mount(TrainingWidget, {
      props: { initialText: "see spot run" },
    });
    const headers = wrapper.findAll(".training-grid th code");
    expect(headers.length).toBe(3);
    expect(headers[0].text()).toBe("see");
    expect(headers[1].text()).toBe("spot");
    expect(headers[2].text()).toBe("run");
  });

  it("shows playback controls", () => {
    const wrapper = mount(TrainingWidget, {
      props: { initialText: "see spot" },
    });
    expect(wrapper.find(".playback-controls").exists()).toBe(true);
  });

  it("handles empty input gracefully", () => {
    const wrapper = mount(TrainingWidget, {
      props: { initialText: "" },
    });
    expect(wrapper.find(".training-view").exists()).toBe(true);
    expect(wrapper.findAll(".token").length).toBe(0);
  });

  it("updates tokens when text changes", async () => {
    const wrapper = mount(TrainingWidget, {
      props: { initialText: "hello" },
    });
    expect(wrapper.findAll(".token").length).toBe(1);
    await wrapper.find("textarea").setValue("hello world");
    expect(wrapper.findAll(".token").length).toBe(2);
  });
});
