export interface Machine<S> {
  initialState(): S;
  step(state: S, rng: () => number): S;
  isComplete(state: S): boolean;
}
