import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import LmGrid from "./components/LmGrid.vue";
import LmTable from "./components/LmTable.vue";
import LessonCards from "./components/LessonCards.vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("LmGrid", LmGrid);
    app.component("LmTable", LmTable);
    app.component("LessonCards", LessonCards);
  },
} satisfies Theme;
