/**
 * Central export file for all command handlers
 * Makes it easy to import handlers in app.js
 */

export {
  handleRegisterCommand,
  handleRegisterModalSubmit,
} from "./registerHandler.js";

export { handleInfoCommand } from "./infoHandler.js";

/**
 * Command handler map for easy routing
 */
export const commandHandlers = {
  register: "handleRegisterCommand",
  info: "handleInfoCommand",
};

/**
 * Modal handler map for easy routing
 */
export const modalHandlers = {
  pubg_register_modal: "handleRegisterModalSubmit",
};
