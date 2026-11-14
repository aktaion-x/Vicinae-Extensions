declare module 'x11' {
  export function createClient(
    callback: (err: Error | null, display: any) => void
  ): void;
}