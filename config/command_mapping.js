import {
  handleRegisterCommand,
  handleRegisterModalSubmit,
  handleInfoCommand,
  handleStatsCommand,
} from "../handlers/index.js";

// Command handlers mapping
const COMMAND_HANDLERS = {
  register: handleRegisterCommand,
  info: handleInfoCommand,
  sting: handleStatsCommand,
};

// Modal handlers mapping
const MODAL_HANDLERS = {
  pubg_register_modal: handleRegisterModalSubmit,
};

export { COMMAND_HANDLERS, MODAL_HANDLERS };
