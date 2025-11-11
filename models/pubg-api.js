// pubg-api.js - PUBG API integration with Singleton pattern
import "dotenv/config";
import axios from "axios";

/**
 * PUBG API Client - Singleton pattern
 * Handles all interactions with PUBG API
 */
class PubgApi {
  static instance = null;

  constructor() {
    if (PubgApi.instance) {
      return PubgApi.instance;
    }

    this.apiKey = process.env.PUBG_API_KEY;
    this.baseURL = process.env.PUBG_BASE_URL || "https://api.pubg.com";

    // Create axios instance with default config
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: "application/vnd.api+json",
      },
      timeout: 10000, // 10 seconds timeout
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(
          `🌐 PUBG API Request: ${config.method.toUpperCase()} ${config.url}`
        );
        return config;
      },
      (error) => {
        console.error("❌ Request error:", error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log(
          `✅ PUBG API Response: ${response.status} ${response.config.url}`
        );
        return response;
      },
      (error) => {
        if (error.response) {
          console.error(
            `❌ PUBG API Error: ${error.response.status} - ${error.response.statusText}`
          );
        } else if (error.request) {
          console.error("❌ No response from PUBG API");
        } else {
          console.error("❌ Request setup error:", error.message);
        }
        return Promise.reject(error);
      }
    );

    PubgApi.instance = this;
  }

  /**
   * Get singleton instance
   * @returns {PubgApi}
   */
  static getInstance() {
    if (!PubgApi.instance) {
      PubgApi.instance = new PubgApi();
    }
    return PubgApi.instance;
  }

  /**
   * Search for a PUBG player by name
   * @param {string} playerName - The player name to search for
   * @param {string} shard - Platform shard (steam, xbox, psn, kakao, etc.)
   * @returns {Promise<{id: string, name: string, shard: string, patchVersion: string}|{error: string, statusCode: number}>}
   */
  async searchPlayerByName(playerName, shard = "steam") {
    try {
      console.log(`🔍 Searching PUBG player: ${playerName} on ${shard}`);

      const response = await this.client.get(`/shards/${shard}/players`, {
        params: {
          "filter[playerNames]": playerName,
        },
      });

      // Check if player was found
      if (!response.data.data || response.data.data.length === 0) {
        console.log(`❌ Player not found: ${playerName}`);
        return { error: "Player not found", statusCode: 404 };
      }

      const player = response.data.data[0];
      console.log(
        `✅ Found player: ${player.attributes.name} (ID: ${player.id})`
      );

      return {
        id: player.id,
        name: player.attributes.name,
        shard: player.attributes.shardId,
        patchVersion: player.attributes.patchVersion,
        clanId: player.attributes?.clanId || null,
      };
    } catch (error) {
      return this._handleError(error, playerName);
    }
  }

  /**
   * Get player by ID with match history
   * @param {string} playerId - The player ID
   * @param {string} shard - Platform shard
   * @returns {Promise<object>}
   */
  async getPlayerById(playerId, shard = "steam") {
    try {
      console.log(`🔍 Fetching player by ID: ${playerId} on ${shard}`);

      const response = await this.client.get(
        `/shards/${shard}/players/${playerId}`
      );

      const player = response.data.data;

      // Extract match IDs from relationships
      const matchIds =
        player.relationships?.matches?.data?.map((match) => match.id) || [];

      return {
        id: player.id,
        name: player.attributes.name,
        shard: player.attributes.shardId,
        patchVersion: player.attributes.patchVersion,
        matchIds: matchIds,
      };
    } catch (error) {
      return this._handleError(error, playerId);
    }
  }

  /**
   * Get match details by match ID
   * @param {string} matchId - The match ID
   * @param {string} shard - Platform shard
   * @returns {Promise<object>}
   */
  async getMatchDetails(matchId, shard = "steam") {
    try {
      console.log(`🎯 Fetching match details: ${matchId} on ${shard}`);

      const response = await this.client.get(
        `/shards/${shard}/matches/${matchId}`
      );

      const matchData = response.data.data;
      const included = response.data.included || [];

      console.log(
        `✅ Match fetched: ${matchId} - ${matchData.attributes.gameMode}`
      );

      return {
        matchId: matchData.id,
        gameMode: matchData.attributes.gameMode,
        mapName: matchData.attributes.mapName,
        duration: matchData.attributes.duration,
        createdAt: matchData.attributes.createdAt,
        included: included, // Contains participant and roster data
      };
    } catch (error) {
      return this._handleError(error, matchId);
    }
  }

  /**
   * Get player stats from recent matches
   * @param {string} playerId - The player ID
   * @param {string} shard - Platform shard
   * @param {number} limit - Number of recent matches to fetch (default 3)
   * @returns {Promise<Array>}
   */
  async getRecentMatchesStats(playerId, shard = "steam", limit = 3) {
    try {
      // First, get player to get match IDs
      const playerData = await this.getPlayerById(playerId, shard);
      if (playerData.error) {
        return playerData;
      }

      const matchIds = playerData.matchIds.slice(0, limit);
      console.log(`📊 Fetching stats for ${matchIds.length} recent matches`);

      // Fetch all matches in parallel
      const matchPromises = matchIds.map((matchId) =>
        this.getMatchDetails(matchId, shard)
      );

      const matches = await Promise.all(matchPromises);

      // Extract player stats from each match
      const stats = matches
        .map((match, index) => {
          if (match.error) {
            console.error(`❌ Failed to fetch match ${matchIds[index]}`);
            return null;
          }

          // Find participant data for this player
          const participant = match.included.find(
            (item) =>
              item.type === "participant" &&
              item.attributes.stats.playerId === playerId
          );

          if (!participant) {
            console.warn(`⚠️ Player not found in match ${match.matchId}`);
            return null;
          }

          const stats = participant.attributes.stats;

          // Find roster that contains this participant to get team rank
          const roster = match.included.find(
            (item) =>
              item.type === "roster" &&
              item.relationships.participants.data.some(
                (p) => p.id === participant.id
              )
          );

          const teamRank = roster?.attributes?.stats?.rank || null;
          const teamWon = roster?.attributes?.won === "true";

          return {
            matchId: match.matchId,
            gameMode: match.gameMode,
            mapName: match.mapName,
            createdAt: match.createdAt,
            damageDealt: stats.damageDealt,
            revives: stats.revives,
            kills: stats.kills,
            heals: stats.heals,
            assists: stats.assists,
            timeSurvived: stats.timeSurvived,
            walkDistance: stats.walkDistance,
            rideDistance: stats.rideDistance,
            teamRank: teamRank,
            teamWon: teamWon,
          };
        })
        .filter((stat) => stat !== null);

      console.log(`✅ Retrieved stats for ${stats.length} matches`);
      return stats;
    } catch (error) {
      return this._handleError(error, playerId);
    }
  }

  /**
   * Get player season stats
   * @param {string} playerId - The player ID
   * @param {string} seasonId - The season ID
   * @param {string} shard - Platform shard
   * @returns {Promise<object>}
   */
  async getPlayerSeasonStats(playerId, seasonId, shard = "steam") {
    try {
      console.log(
        `📊 Fetching season stats for player: ${playerId}, season: ${seasonId}`
      );

      const response = await this.client.get(
        `/shards/${shard}/players/${playerId}/seasons/${seasonId}`
      );

      return response.data;
    } catch (error) {
      return this._handleError(error, playerId);
    }
  }

  /**
   * Get list of available seasons
   * @param {string} shard - Platform shard
   * @returns {Promise<Array>}
   */
  async getSeasons(shard = "steam") {
    try {
      console.log(`📅 Fetching seasons for ${shard}`);

      const response = await this.client.get(`/shards/${shard}/seasons`);

      return response.data.data.map((season) => ({
        id: season.id,
        isCurrentSeason: season.attributes.isCurrentSeason,
        isOffseason: season.attributes.isOffseason,
      }));
    } catch (error) {
      return this._handleError(error, "seasons");
    }
  }

  /**
   * Get clan information by clan ID
   * @param {string} clanId - The clan ID
   * @param {string} shard - Platform shard
   * @returns {Promise<{id: string, name: string, tag: string, level: number}|{error: string, statusCode: number}>}
   */
  async getClanInfo(clanId, shard = "steam") {
    try {
      console.log(`🏆 Fetching clan info: ${clanId} on ${shard}`);

      const response = await this.client.get(
        `/shards/${shard}/clans/${clanId}`
      );

      const clan = response.data.data;

      console.log(
        `✅ Found clan: ${clan.attributes.clanName} [${clan.attributes.clanTag}]`
      );

      return {
        id: clan.id,
        name: clan.attributes.clanName,
        tag: clan.attributes.clanTag,
        level: clan.attributes.clanLevel,
        memberCount: clan.attributes.clanMemberCount,
      };
    } catch (error) {
      return this._handleError(error, clanId);
    }
  }

  /**
   * Handle API errors
   * @private
   * @param {Error} error - The error object
   * @param {string} context - Context information for logging
   * @returns {{error: string, statusCode: number}}
   */
  _handleError(error, context = "") {
    if (error.response) {
      const status = error.response.status;
      const statusText = error.response.statusText;

      console.error(
        `❌ PUBG API Error (${status}) for ${context}: ${statusText}`
      );

      switch (status) {
        case 404:
          return { error: "Player not found", statusCode: 404 };
        case 401:
          return { error: "Invalid API key", statusCode: 401 };
        case 429:
          return { error: "Rate limit exceeded", statusCode: 429 };
        case 415:
          return { error: "Unsupported media type", statusCode: 415 };
        default:
          return { error: `API error: ${statusText}`, statusCode: status };
      }
    } else if (error.request) {
      console.error("❌ No response from PUBG API");
      return { error: "No response from server", statusCode: 503 };
    } else {
      console.error("❌ Request setup error:", error.message);
      return { error: "Failed to make request", statusCode: 500 };
    }
  }

  /**
   * Check if API is configured correctly
   * @returns {boolean}
   */
  isConfigured() {
    return !!(this.apiKey && this.baseURL);
  }

  /**
   * Get API configuration status
   * @returns {{configured: boolean, hasApiKey: boolean, baseURL: string}}
   */
  getConfig() {
    return {
      configured: this.isConfigured(),
      hasApiKey: !!this.apiKey,
      baseURL: this.baseURL,
    };
  }
}

// Export singleton instance
export default PubgApi.getInstance();

// Also export class for testing purposes
export { PubgApi };
