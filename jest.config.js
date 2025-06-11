/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  // No preset, configure manually for clarity
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'], // Treat .ts files as ESM
  moduleFileExtensions: ['ts', 'js', 'json', 'node'], // Ensure .ts is processed
  roots: ['<rootDir>/__tests__'], // Explicitly look for tests only in the source __tests__ directory
  testPathIgnorePatterns: ['/node_modules/', '/dist/'], // Ignore node_modules and the build output directory

  // Map '.js' imports to corresponding '.ts' files for ESM compatibility
  // This helps Jest find the source files when imports use '.js' extension
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  transform: {
    // Use ts-jest to transform TypeScript files into ESM JavaScript
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true, // Ensure ts-jest outputs ESM syntax
        tsconfig: 'tsconfig.json', // Specify the tsconfig file
      },
    ],
  },

  // Optional: If node_modules contain ESM that needs transforming (uncommon)
  // transformIgnorePatterns: [
  //   '/node_modules/(?!some-esm-module)/'
  // ],
};