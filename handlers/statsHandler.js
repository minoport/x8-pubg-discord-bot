import { InteractionResponseType } from "discord-interactions";
import { getPlayerData } from "../utils/storage.js";
import { getMapDisplayName } from "../utils/helper.js";
import pubgApi from "../models/pubg-api.js";

/**
 * Handle /stats command - Display player statistics from recent 3 matches
 */
export async function handleStatsCommand(req, res) {
  const userId = req.body.member?.user?.id || req.body.user?.id;
  const playerData = getPlayerData(userId);

  // If user has not registered yet
  if (!playerData) {
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [
          {
            title: "📊 PUBG Match Statistics",
            description: `Statistics for <@${userId}>`,
            color: 0xe74c3c,
            fields: [
              {
                name: "⚠️ Not Registered",
                value:
                  "You need to register first! Use `/register` to set up your profile.",
                inline: false,
              },
            ],
            timestamp: new Date().toISOString(),
          },
        ],
      },
    });
  }

  // Fetch recent match stats from PUBG API
  console.log(
    `📊 Fetching recent match stats for player: ${playerData.playerId}`
  );

  const matchesStats = await pubgApi.getRecentMatchesStats(
    playerData.playerId,
    "steam",
    3
  );

  // Handle API errors
  if (matchesStats.error) {
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [
          {
            title: "❌ Failed to Fetch Statistics",
            description: `Could not retrieve match data for **${playerData.playerName}**`,
            color: 0xe74c3c,
            fields: [
              {
                name: "Error",
                value: matchesStats.error,
                inline: false,
              },
            ],
            timestamp: new Date().toISOString(),
          },
        ],
      },
    });
  }

  // Check if we got any match data
  if (!matchesStats || matchesStats.length === 0) {
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [
          {
            title: "📊 PUBG Match Statistics",
            description: `Statistics for **${playerData.playerName}**`,
            color: 0xf39c12,
            fields: [
              {
                name: "⚠️ No Recent Matches",
                value:
                  "No recent match data found. Play some games and try again!",
                inline: false,
              },
            ],
            timestamp: new Date().toISOString(),
          },
        ],
      },
    });
  }

  // Calculate totals
  const totalDamage = matchesStats.reduce(
    (sum, match) => sum + match.damageDealt,
    0
  );
  const totalRevives = matchesStats.reduce(
    (sum, match) => sum + match.revives,
    0
  );
  const totalKills = matchesStats.reduce((sum, match) => sum + match.kills, 0);

  // Build fields for each match
  const fields = [];

  matchesStats.forEach((match, index) => {
    const matchNumber = index + 1;
    const date = new Date(match.createdAt).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Determine rank emoji
    let rankEmoji = "🏅";
    if (match.teamRank === 1) rankEmoji = "🥇";
    else if (match.teamRank === 2) rankEmoji = "🥈";
    else if (match.teamRank === 3) rankEmoji = "🥉";

    const rankText = match.teamRank
      ? `${rankEmoji} Rank #${match.teamRank}`
      : "❓ Rank Unknown";

    fields.push({
      name: `🎮 Match ${matchNumber} - ${match.gameMode}`,
      value: `📍 ${getMapDisplayName(match.mapName)} • 🕐 ${date}\n${rankText}`,
      inline: false,
    });

    fields.push(
      {
        name: "💥 Damage",
        value: `${Math.round(match.damageDealt)}`,
        inline: true,
      },
      {
        name: "💊 Revives",
        value: `${match.revives}`,
        inline: true,
      },
      {
        name: "💀 Kills",
        value: `${match.kills}`,
        inline: true,
      }
    );

    // Add spacing between matches (except after last match)
    if (index < matchesStats.length - 1) {
      fields.push({
        name: "\u200b",
        value: "\u200b",
        inline: false,
      });
    }
  });

  // Add summary totals
  fields.push(
    {
      name: "📈 Total Statistics (3 Matches)",
      value: "━━━━━━━━━━━━━━━━━━━━",
      inline: false,
    },
    {
      name: "💥 Total Damage",
      value: `**${Math.round(totalDamage)}**`,
      inline: true,
    },
    {
      name: "💊 Total Revives",
      value: `**${totalRevives}**`,
      inline: true,
    },
    {
      name: "💀 Total Kills",
      value: `**${totalKills}**`,
      inline: true,
    }
  );

  return res.send({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [
        {
          title: "📊 PUBG Match Statistics",
          description: `Recent performance for **${playerData.playerName}**`,
          color: 0x3498db,
          fields: fields,
          footer: {
            text: `Statistics based on ${matchesStats.length} most recent matches`,
          },
          timestamp: new Date().toISOString(),
        },
      ],
    },
  });
}
