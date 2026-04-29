/// <reference types="vite/client" />

/** Salesforce API version injected at build time by the Vite define plugin. */
declare const __SF_API_VERSION__: string;

/** Package version of @salesforce/sdk-data injected at build time by its own Vite build. */
declare const __SDK_DATA_VERSION__: string;
