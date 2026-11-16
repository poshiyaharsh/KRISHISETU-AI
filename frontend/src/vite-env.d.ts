/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  google?: {
    accounts: {
      id: {
        initialize: (config: Record<string, unknown>) => void;
        renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        prompt: () => void;
        cancel: () => void;
      };
    };
  };
}
