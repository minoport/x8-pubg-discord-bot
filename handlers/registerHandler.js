import {
  InteractionResponseFlags,
  InteractionResponseType,
  MessageComponentTypes,
} from "discord-interactions";
import { savePlayerData } from "../utils/storage.js";
import pubgApi from "../models/pubg-api.js";

/**
 * Handle /register command - Show registration modal
 */
export async function handleRegisterCommand(req, res) {
  return res.send({
    type: InteractionResponseType.MODAL,
    data: {
      title: "Register PUBG Player",
      custom_id: "pubg_register_modal",
      components: [
        {
          type: MessageComponentTypes.ACTION_ROW,
          components: [
            {
              type: MessageComponentTypes.INPUT_TEXT,
              custom_id: "pubg_player_name",
              label: "PUBG Player Name",
              style: 1,
              placeholder: "Enter your exact PUBG in-game name",
              required: true,
              max_length: 100,
            },
          ],
        },
      ],
    },
  });
}

/**
 * Handle registration modal submission
 */
export async function handleRegisterModalSubmit(req, res) {
  // Extract Player Name from modal
  const components = req.body.data.components;
  const playerName = components[0].components[0].value;
  const userId = req.body.member?.user?.id || req.body.user?.id;

  console.log(
    `🔍 Searching PUBG player: ${playerName} for Discord user: ${userId}`
  );

  // Query PUBG API to get Player ID using Singleton instance
  const playerData = await pubgApi.searchPlayerByName(playerName, "steam");

  // Handle errors from PUBG API
  if (playerData.error) {
    let errorMessage = "Failed to find PUBG player.";
    let errorDetail = playerData.error;

    if (playerData.statusCode === 404) {
      errorMessage = "Player not found!";
      errorDetail = `No PUBG player found with name **${playerName}** on Steam platform.\n\nPlease check:\n• Spelling is correct\n• Player exists on Steam platform\n• Try with exact in-game name`;
    } else if (playerData.statusCode === 401) {
      errorMessage = "API Configuration Error";
      errorDetail =
        "PUBG API key is invalid or missing. Please contact bot administrator.";
    } else if (playerData.statusCode === 429) {
      errorMessage = "Too Many Requests";
      errorDetail = "Rate limit exceeded. Please try again in a few minutes.";
    }

    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [
          {
            title: `❌ ${errorMessage}`,
            description: errorDetail,
            color: 0xe74c3c,
            footer: {
              text: "PUBG Discord Bot",
            },
            timestamp: new Date().toISOString(),
          },
        ],
        flags: InteractionResponseFlags.EPHEMERAL,
      },
    });
  }

  // Successfully found player - save mapping with full data
  savePlayerData(userId, {
    playerId: playerData.id,
    playerName: playerData.name,
    clanId: playerData.clanId || null,
  });

  console.log(
    `✅ Registration saved: Discord ${userId} -> PUBG ${playerData.name} (${playerData.id})`
  );

  // Build registration success fields
  const registrationFields = [
    {
      name: "🎮 Player Name",
      value: playerData.name,
      inline: true,
    },
    {
      name: "🆔 Player ID",
      value: playerData.id,
      inline: true,
    },
    {
      name: "🖥️ Platform",
      value: playerData.shard.toUpperCase(),
      inline: true,
    },
  ];

  // Add clan info if player has clan
  if (playerData.clanId) {
    registrationFields.push({
      name: "👥 Clan Status",
      value: "Part of a clan! Use `/info` to see details.",
      inline: false,
    });
  } else {
    registrationFields.push({
      name: "🏆 Clan Status",
      value: "No clan",
      inline: false,
    });
  }

  registrationFields.push({
    name: "💡 Next Step",
    value: "Use `/info` command to view your full profile!",
    inline: false,
  });

  return res.send({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [
        {
          title: "✅ Registration Successful!",
          description: `Successfully registered PUBG player **${playerData.name}**!`,
          color: 0x27ae60,
          fields: registrationFields,
          footer: {
            text: "PUBG Discord Bot",
          },
          timestamp: new Date().toISOString(),
        },
      ],
      flags: InteractionResponseFlags.EPHEMERAL,
    },
  });
}
