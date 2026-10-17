// Copies svg-country-flags (the same flags the desktop app uses) to public/flags/<code>.svg,
// so they're served as static files. Runs before `dev` and `build`.
import { cpSync } from "node:fs";

cpSync("node_modules/svg-country-flags/svg", "public/flags", { recursive: true });
