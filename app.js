import "dotenv/config";
import express from "express";
import { InteractionType, verifyKeyMiddleware } from "discord-interactions";
import { COMMAND_HANDLERS, MODAL_HANDLERS } from "./config/command_mapping.js";

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 * Parse request body and verifies incoming requests using discord-interactions package
 */
app.post(
  "/interactions",
  verifyKeyMiddleware(process.env.PUBLIC_KEY),
  async function (req, res) {
    // Interaction id, type and data
    const { id, type, data } = req.body;

    /**
     * Handle verification requests
     */
    if (type === InteractionType.PING) {
      return res.send({ type: 1 }); // PONG
    }

    /**
     * Handle slash command requests
     */
    if (type === InteractionType.APPLICATION_COMMAND) {
      const { name } = data;
      console.log(`🎮 Command received: ${name}`);

      // Route to appropriate command handler using mapping
      const handler = COMMAND_HANDLERS[name];
      if (handler) {
        return handler(req, res);
      }

      console.error(`unknown command: ${name}`);
      return res.status(400).json({ error: "unknown command" });
    }

    /**
     * Handle Modal Submissions
     */
    if (type === InteractionType.MODAL_SUBMIT) {
      const customId = data.custom_id;

      // Route to appropriate modal handler using mapping
      const handler = MODAL_HANDLERS[customId];
      if (handler) {
        return handler(req, res);
      }
    }

    console.error("unknown interaction type", type);
    return res.status(400).json({ error: "unknown interaction type" });
  }
);

app.listen(PORT, () => {
  console.log("Listening on port", PORT);
  console.log("PUBG Discord Bot is ready! 🎮");
});
