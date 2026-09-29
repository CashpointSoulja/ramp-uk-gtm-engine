declare module "*?raw" {
  const content: string;
  export default content;
}

declare module "node:fs" {
  export function readFileSync(path: string, encoding: "utf8"): string;
}
