import type { Machine } from "./types";

export type TrainingState = {
  currentStep: number;
  totalSteps: number;
};

export function createTrainingMachine(
  totalSteps: number,
): Machine<TrainingState> {
  return {
    initialState: () => ({ currentStep: 0, totalSteps }),
    step(state) {
      if (state.currentStep >= state.totalSteps) return state;
      return { ...state, currentStep: state.currentStep + 1 };
    },
    isComplete: (state) => state.currentStep >= state.totalSteps,
  };
}
