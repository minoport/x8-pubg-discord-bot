// storage.js - File-based storage for Discord ID -> PUBG Player data mapping
// Data is persisted to a JSON file for easy tracking and persistence
import fs from "fs";
import path from "path";

const DATA_DIR = path.resolve("./data");
const DB_FILE = path.join(DATA_DIR, "users.json");

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log("📁 Created data directory:", DATA_DIR);
  }
}

// Read database from file
function readDB() {
  ensureDataDir();
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf8");
      return JSON.parse(raw);
    }
  } catch (error) {
    console.error("❌ Error reading database:", error.message);
  }
  return {};
}

// Write database to file
function writeDB(data) {
  ensureDataDir();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
    console.log("💾 Database saved to:", DB_FILE);
  } catch (error) {
    console.error("❌ Error writing database:", error.message);
  }
}

/**
 * Save Discord User ID -> PUBG Player data mapping
 * @param {string} discordUserId - Discord user ID
 * @param {object} playerData - Player data { playerId, playerName, clanId (optional) }
 */
export function savePlayerData(discordUserId, playerData) {
  const db = readDB();

  db[discordUserId] = {
    playerId: playerData.playerId,
    playerName: playerData.playerName,
    clanId: playerData.clanId || null,
    savedAt: db[discordUserId]?.savedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  writeDB(db);
  console.log(
    `✅ Saved mapping: ${discordUserId} -> ${playerData.playerName} (${playerData.playerId})`
  );
}

/**
 * Get PUBG Player data for a Discord user
 * @param {string} discordUserId - Discord user ID
 * @returns {object|null} Player data or null if not found
 */
export function getPlayerData(discordUserId) {
  const db = readDB();
  return db[discordUserId] || null;
}

/**
 * Delete player data for a Discord user
 * @param {string} discordUserId - Discord user ID
 * @returns {boolean} True if deleted, false if not found
 */
export function deletePlayerData(discordUserId) {
  const db = readDB();

  if (db[discordUserId]) {
    delete db[discordUserId];
    writeDB(db);
    console.log(`🗑️ Deleted mapping for: ${discordUserId}`);
    return true;
  }

  return false;
}

/**
 * Get all registered users
 * @returns {object} All user mappings
 */
export function getAllPlayerData() {
  return readDB();
}

/**
 * Get statistics about stored data
 * @returns {object} Stats
 */
export function getStats() {
  const db = readDB();
  const users = Object.keys(db);
  const usersWithClans = users.filter((userId) => db[userId].clanId).length;

  return {
    totalUsers: users.length,
    usersWithClans: usersWithClans,
    usersWithoutClans: users.length - usersWithClans,
    dbFilePath: DB_FILE,
  };
}

// Backward compatibility
export function savePlayerId(discordUserId, pubgPlayerId) {
  savePlayerData(discordUserId, {
    playerId: pubgPlayerId,
    playerName: null,
    clanId: null,
  });
}

export function getPlayerId(discordUserId) {
  const data = getPlayerData(discordUserId);
  return data ? data.playerId : null;
}

/**
 * Check if a Discord user has registered
 * @param {string} discordUserId - Discord user ID
 * @returns {boolean}
 */
export function hasRegistered(discordUserId) {
  const db = readDB();
  return discordUserId in db;
}
