import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import LmGrid from "./components/LmGrid.vue";
import LmTable from "./components/LmTable.vue";
import Card from "./components/Card.vue";
import CardList from "./components/CardList.vue";
import NewsCards from "./components/NewsCards.vue";
import TrainingWidget from "./components/TrainingWidget.vue";
import GenerationWidget from "./components/GenerationWidget.vue";
import BucketTrainingWidget from "./components/BucketTrainingWidget.vue";
import BucketGenerationWidget from "./components/BucketGenerationWidget.vue";
import PretrainedGenerationWidget from "./components/PretrainedGenerationWidget.vue";
import PlaybackControls from "./components/PlaybackControls.vue";
import FullscreenWrapper from "./components/FullscreenWrapper.vue";
import VariantToggle from "./components/VariantToggle.vue";
import GridOnly from "./components/GridOnly.vue";
import BucketOnly from "./components/BucketOnly.vue";
import EmbeddingWidget from "./components/EmbeddingWidget.vue";
import Layout from "./Layout.vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component("LmGrid", LmGrid);
    app.component("LmTable", LmTable);
    app.component("Card", Card);
    app.component("CardList", CardList);
    app.component("NewsCards", NewsCards);
    app.component("TrainingWidget", TrainingWidget);
    app.component("GenerationWidget", GenerationWidget);
    app.component("BucketTrainingWidget", BucketTrainingWidget);
    app.component("BucketGenerationWidget", BucketGenerationWidget);
    app.component("PretrainedGenerationWidget", PretrainedGenerationWidget);
    app.component("PlaybackControls", PlaybackControls);
    app.component("FullscreenWrapper", FullscreenWrapper);
    app.component("VariantToggle", VariantToggle);
    app.component("GridOnly", GridOnly);
    app.component("BucketOnly", BucketOnly);
    app.component("EmbeddingWidget", EmbeddingWidget);
  },
} satisfies Theme;
