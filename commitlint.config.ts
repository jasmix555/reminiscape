import type {UserConfig} from "@commitlint/types";

const Configuration: UserConfig = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat", // New feature
        "fix", // Bug fix
        "docs", // Documentation changes
        "style", // Changes that do not affect the meaning of the code (white-space, formatting, etc.)
        "refactor", // Code changes that neither fix a bug nor add a feature
        "perf", // Performance improvement
        "test", // Adding missing tests or correcting existing tests
        "build", // Changes that affect the build system or external dependencies
        "ci", // Changes to CI configuration files and scripts
        "chore", // Other changes that don't modify src or test files
        "revert", // Reverts a previous commit
      ],
    ],
    "subject-empty": [2, "never"], // Ensure the subject is not empty
    "header-max-length": [2, "always", 100], // Limit the header length
  },
};

export default Configuration;
