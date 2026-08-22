import '@testing-library/jest-dom';

// Global mocks for DOM APIs in jsdom environment if missing
if (typeof window !== 'undefined') {
  // Mock ResizeObserver
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = window.ResizeObserver || ResizeObserverMock;

  // Mock matchMedia
  window.matchMedia = window.matchMedia || function (query: string) {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    };
  };

  // Mock URL.createObjectURL and revokeObjectURL
  if (!URL.createObjectURL) {
    URL.createObjectURL = () => 'blob:mock-url';
  }
  if (!URL.revokeObjectURL) {
    URL.revokeObjectURL = () => {};
  }
}
