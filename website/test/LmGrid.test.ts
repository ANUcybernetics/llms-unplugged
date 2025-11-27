import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import LmGrid from "../.vitepress/theme/components/LmGrid.vue";

describe("LmGrid", () => {
  it("renders a table", () => {
    const wrapper = mount(LmGrid, {
      props: {
        tokens: "see spot run",
      },
    });
    expect(wrapper.find("table").exists()).toBe(true);
  });

  it("creates correct headers from tokens", () => {
    const wrapper = mount(LmGrid, {
      props: {
        tokens: "see spot run",
      },
    });
    const headers = wrapper.findAll("th");
    // First header is empty, then unique tokens
    expect(headers.length).toBe(4); // empty + see + spot + run
    expect(headers[1].find("code").text()).toBe("see");
    expect(headers[2].find("code").text()).toBe("spot");
    expect(headers[3].find("code").text()).toBe("run");
  });

  it("creates correct row labels", () => {
    const wrapper = mount(LmGrid, {
      props: {
        tokens: "see spot run",
      },
    });
    const rows = wrapper.findAll("tbody tr");
    expect(rows.length).toBe(3);
    expect(rows[0].find("td code").text()).toBe("see");
    expect(rows[1].find("td code").text()).toBe("spot");
    expect(rows[2].find("td code").text()).toBe("run");
  });

  it("counts bigram occurrences correctly", () => {
    const wrapper = mount(LmGrid, {
      props: {
        tokens: "see spot see spot",
      },
    });
    // "see spot" appears twice
    const rows = wrapper.findAll("tbody tr");
    const seeRow = rows[0];
    const cells = seeRow.findAll("td");
    // cells[0] is "see" label, cells[1] is see->see, cells[2] is see->spot
    expect(cells[2].text()).toBe("||"); // 2 tally marks
  });

  it("converts counts to tally marks", () => {
    const wrapper = mount(LmGrid, {
      props: {
        // Create a sequence where one bigram appears 6 times
        tokens: "a b a b a b a b a b a b a",
      },
    });
    const rows = wrapper.findAll("tbody tr");
    const aRow = rows[0]; // row for 'a'
    const cells = aRow.findAll("td");
    // a->b appears 6 times: 卌 | (one group of 5 + 1)
    expect(cells[2].text()).toBe("卌 |");
  });

  it("respects nrows option", () => {
    const wrapper = mount(LmGrid, {
      props: {
        tokens: "a b c d",
        nrows: 2,
      },
    });
    const rows = wrapper.findAll("tbody tr");
    expect(rows.length).toBe(2);
  });

  it("respects ncols option", () => {
    const wrapper = mount(LmGrid, {
      props: {
        tokens: "a b c d",
        ncols: 3,
      },
    });
    const headers = wrapper.findAll("th");
    expect(headers.length).toBe(3); // empty + 2 tokens
  });

  it("handles empty tokens gracefully", () => {
    const wrapper = mount(LmGrid, {
      props: {
        tokens: "",
      },
    });
    expect(wrapper.find("table").exists()).toBe(true);
    expect(wrapper.findAll("tbody tr").length).toBe(0);
  });

  it("handles single token", () => {
    const wrapper = mount(LmGrid, {
      props: {
        tokens: "hello",
      },
    });
    const headers = wrapper.findAll("th");
    expect(headers.length).toBe(2); // empty + hello
    const rows = wrapper.findAll("tbody tr");
    expect(rows.length).toBe(1);
  });

  it("handles punctuation as tokens", () => {
    const wrapper = mount(LmGrid, {
      props: {
        tokens: "see spot . see",
      },
    });
    const headers = wrapper.findAll("th");
    // Unique tokens: see, spot, .
    expect(headers.length).toBe(4);
    expect(headers[3].find("code").text()).toBe(".");
  });
});
