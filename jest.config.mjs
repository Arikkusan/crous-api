/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  testEnvironment: 'node',
  transform: {
    "^.+\\.[t|j]sx?$": "babel-jest"
  },
  moduleNameMapper: {
    "(.+)\\.js": "$1"
  },
  resolver: "ts-jest-resolver",
  extensionsToTreatAsEsm: [".ts"],
  testPathIgnorePatterns: ['/node_modules/', "/src/"],
  
  transformIgnorePatterns: ['/node_modules/(?!(crous-api-types)/)'],
  testTimeout: 60000,
};