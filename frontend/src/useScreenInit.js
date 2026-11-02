// Legacy hook from the design-tool export, where each preview screen injected its own
// initial state. The real app takes state from the URL and the API, so this always
// returns {}. Kept so pages that still call it compile; later phases remove the calls.
const EMPTY = Object.freeze({});

export function useScreenInit() {
  return EMPTY;
}
