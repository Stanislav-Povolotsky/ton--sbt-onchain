import type { Config } from 'jest';

const reporters = ["default"];
if (process.env.CI) {
  reporters.push("github-actions");
}

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
    cache: false,
    verbose: true,
    testTimeout: 60000,
    reporters: reporters
};

export default config;
