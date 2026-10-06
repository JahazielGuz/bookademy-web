import type { Config } from "jest";

/** Node, not jsdom: what is tested here is the diffing behind the editor, which is
 *  plain string work. The editor itself is checked in a browser. */
const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/$1" },
  testMatch: ["<rootDir>/**/*.test.ts"],
};

export default config;
