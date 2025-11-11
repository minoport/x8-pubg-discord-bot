import { InteractionResponseType } from "discord-interactions";
import { getPlayerData } from "../utils/storage.js";
import pubgApi from "../models/pubg-api.js";

/**
 * Handle /info command - Display user PUBG profile
 */
export async function handleInfoCommand(req, res) {
  const userId = req.body.member?.user?.id || req.body.user?.id;
  const playerData = getPlayerData(userId);

  // If user has not registered yet
  if (!playerData) {
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [
          {
            title: "🎮 PUBG Profile",
            description: `Profile for <@${userId}>`,
            color: 0xe74c3c,
            fields: [
              {
                name: "📊 Status",
                value:
                  "Not registered yet. Use `/register` to set up your profile!",
                inline: false,
              },
            ],
            timestamp: new Date().toISOString(),
          },
        ],
      },
    });
  }

  // Fetch player details from PUBG API
  const player = await pubgApi.getPlayerById(playerData.playerId, "steam");

  const fields = [
    {
      name: "🆔 Player ID",
      value: playerData.playerId,
      inline: true,
    },
    {
      name: "🎮 Player Name",
      value: playerData.playerName || "Unknown",
      inline: true,
    },
  ];

  // Fetch clan info if player has a clan
  if (player && !player.error) {
    const playerAttributes = player;

    // Get clan ID from player relationships (if exists)
    if (playerData.clanId) {
      const clanInfo = await pubgApi.getClanInfo(playerData.clanId, "steam");

      if (!clanInfo.error) {
        fields.push(
          {
            name: "👥 Clan Name",
            value: `${clanInfo.name} [${clanInfo.tag}]`,
            inline: true,
          },
          {
            name: "🆔 Clan ID",
            value: clanInfo.id,
            inline: true,
          },
          {
            name: "⭐ Clan Level",
            value: `Level ${clanInfo.level}`,
            inline: true,
          },
          {
            name: "👥 Members",
            value: `${clanInfo.memberCount} members`,
            inline: true,
          }
        );
      }
    } else {
      fields.push({
        name: "🏆 Clan",
        value: "No clan",
        inline: true,
      });
    }
  }

  return res.send({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [
        {
          title: "🎮 PUBG Profile",
          description: `Profile for <@${userId}>`,
          color: 0x27ae60,
          fields: fields,
          footer: {
            text: "PUBG Discord Bot",
          },
          timestamp: new Date().toISOString(),
        },
      ],
    },
  });
}
