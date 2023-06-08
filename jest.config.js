/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { "useESM": true }]
  },
  moduleNameMapper: {
    "(.+)\\.js": "$1"
  },
  resolver: "ts-jest-resolver",
  extensionsToTreatAsEsm: [".ts"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};