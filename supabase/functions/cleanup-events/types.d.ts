// Tipos globales para Deno Edge Functions
/// <reference no-default-lib="true" />
/// <reference lib="deno.ns" />

declare namespace Deno {
  export const env: {
    get(key: string): string | undefined;
  };
}
