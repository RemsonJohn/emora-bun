const { loadEnv } = require("@medusajs/utils");
loadEnv("test", process.cwd());

// SWC is the default transformer. Where its native binding cannot load (Windows
// Smart App Control blocks the unsigned binary), fall back to esbuild.
function swcAvailable() {
  try {
    require("@swc/core")
    return true
  } catch {
    return false
  }
}

const transformer = swcAvailable()
  ? [
      "@swc/jest",
      {
        jsc: {
          parser: { syntax: "typescript", decorators: true },
        },
      },
    ]
  : "<rootDir>/integration-tests/esbuild-transform.js"

module.exports = {
  transform: {
    "^.+\\.[jt]s$": transformer,
  },
  testEnvironment: "node",
  moduleFileExtensions: ["js", "ts", "json"],
  modulePathIgnorePatterns: ["dist/", "<rootDir>/.medusa/"],
  setupFiles: ["./integration-tests/setup.js"],
};

if (process.env.TEST_TYPE === "integration:http") {
  module.exports.testMatch = ["**/integration-tests/http/*.spec.[jt]s"];
} else if (process.env.TEST_TYPE === "integration:modules") {
  module.exports.testMatch = ["**/src/modules/*/__tests__/**/*.[jt]s"];
} else if (process.env.TEST_TYPE === "unit") {
  module.exports.testMatch = ["**/src/**/__tests__/**/*.unit.spec.[jt]s"];
}
