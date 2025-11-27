import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import LmGrid from "./components/LmGrid.vue";
import LmTable from "./components/LmTable.vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // Register global components
    app.component("LmGrid", LmGrid);
    app.component("LmTable", LmTable);
  },
} satisfies Theme;
