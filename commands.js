import 'dotenv/config';
import { InstallGlobalCommands } from "./utils/helper.js";

// PUBG Registration command
const REGISTER_COMMAND = {
  name: "register",
  description: "Register your PUBG account information",
  type: 1,
  integration_types: [0],
  contexts: [0],
};

// PUBG Info command
const INFO_COMMAND = {
  name: "info",
  description: "Display your PUBG profile information",
  type: 1,
  integration_types: [0],
  contexts: [0],
};

// Keep test command for debugging
const TEST_COMMAND = {
  name: "test",
  description: "Basic test command",
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

const ALL_COMMANDS = [REGISTER_COMMAND, INFO_COMMAND, TEST_COMMAND];

console.log("📝 Registering commands...");
console.log("Commands:", ALL_COMMANDS.map((c) => c.name).join(", "));

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS)
  .then(() => console.log("✅ Commands registered successfully!"))
  .catch((error) => console.error("❌ Error registering commands:", error));
