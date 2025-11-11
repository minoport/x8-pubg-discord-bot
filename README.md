# 🎮 X8 PUBG Discord Bot

A Discord bot that integrates with PUBG API to manage player registrations and display profile information.

## 📋 Features

- **Player Registration** (`/register`) - Register your PUBG account via modal form
- **Profile Information** (`/info`) - Display your PUBG profile with clan details
- **Persistent Storage** - File-based JSON storage for user data
- **PUBG API Integration** - Real-time data from PUBG Developer API
- **Modular Architecture** - Clean, maintainable code structure

## 🏗️ Project Structure

```
discord-example-app/
├── app.js                          # Main Express server & Discord interaction handler
├── commands.js                     # Command registration script
├── package.json                    # Project dependencies & scripts
├── .env                           # Environment variables (not in git)
│
├── config/
│   └── command_mapping.js         # Command & modal handler mappings
│
├── handlers/                      # Command handlers (one file per command)
│   ├── index.js                   # Export all handlers
│   ├── registerHandler.js         # /register command & modal submission
│   └── infoHandler.js             # /info command
│
├── models/
│   └── pubg-api.js                # PUBG API client (Singleton pattern)
│
├── utils/
│   ├── helper.js                  # Discord API helpers
│   └── storage.js                 # File-based storage functions
│
└── data/
    └── users.json                 # User data storage (auto-generated)
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.x
- Discord Application (Bot Token, App ID, Public Key)
- PUBG Developer API Key

### Local Development

1. **Clone and install**
   ```bash
   git clone <repository-url>
   cd discord-example-app
   npm install
   ```

2. **Configure environment**
   
   Copy `.env.sample` to `.env` and fill in your credentials:
   ```env
   APP_ID=your_discord_app_id
   DISCORD_TOKEN=your_discord_bot_token
   PUBLIC_KEY=your_discord_public_key
   PUBG_API_KEY=your_pubg_api_key
   PUBG_BASE_URL=https://api.pubg.com
   ```

3. **Register commands (one-time)**
   ```bash
   npm run register
   ```

4. **Start the bot**
   ```bash
   npm start
   # OR with auto-reload
   npm run dev
   ```

5. **Setup ngrok for local testing**
   ```bash
   ngrok http 3000
   ```
   
   Update Discord Interactions Endpoint URL:
   ```
   https://your-ngrok-url.ngrok-free.app/interactions
   ```

### Deploy to Production

See [RENDER_DEPLOY.md](RENDER_DEPLOY.md) for detailed deployment guide to Render (Recommended).

**Quick Deploy to Render:**
1. Push to GitHub
2. Connect repository on Render
3. Add environment variables
4. Deploy (commands auto-register!)
5. Update Discord Interactions URL

Your bot will automatically register commands on every deploy! 🎉

## 📝 Available Commands

### `/register`
Opens a modal form to register your PUBG player name. The bot will:
- Search for the player in PUBG API
- Save the mapping between Discord User ID and PUBG Player ID
- Store clan information if the player belongs to a clan

### `/info`
Displays your registered PUBG profile including:
- Player ID
- Player Name
- Clan Name & Tag (if applicable)
- Clan ID
- Clan Level
- Member Count

## 🔧 Development

### Run with auto-reload
```bash
npm run dev
```

### Project Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start the bot server |
| `npm run register` | Register/update Discord commands |
| `npm run dev` | Start with auto-reload (nodemon) |

## 📦 Key Dependencies

- **express** - Web server for Discord interactions
- **discord-interactions** - Discord API wrapper with signature verification
- **axios** - HTTP client for PUBG API
- **dotenv** - Environment variable management

## 🗂️ Storage System

The bot uses file-based JSON storage in `data/users.json`:

```json
{
  "discord_user_id": {
    "playerId": "account.xxx...",
    "playerName": "PlayerName",
    "clanId": "clan.yyy...",
    "savedAt": "2025-11-11T04:00:00.000Z",
    "updatedAt": "2025-11-11T04:30:00.000Z"
  }
}
```

**Storage Functions:**
- `savePlayerData(userId, data)` - Save user registration
- `getPlayerData(userId)` - Retrieve user data
- `deletePlayerData(userId)` - Remove user data
- `getAllPlayerData()` - Get all registered users
- `getStats()` - Get storage statistics

## 🎯 Architecture

### Command Routing (Mapping Pattern)

Instead of multiple if-else statements, the bot uses a mapping pattern:

```javascript
// config/command_mapping.js
const COMMAND_HANDLERS = {
  register: handleRegisterCommand,
  info: handleInfoCommand,
};

// app.js - Simple lookup
const handler = COMMAND_HANDLERS[name];
if (handler) {
  return handler(req, res);
}
```

### PUBG API Client (Singleton Pattern)

```javascript
import pubgApi from "./models/pubg-api.js";

// Always returns the same instance
const playerData = await pubgApi.searchPlayerByName(name, shard);
const clanInfo = await pubgApi.getClanInfo(clanId, shard);
```

## ➕ Adding New Commands

1. **Define command in `commands.js`**
   ```javascript
   const NEW_COMMAND = {
     name: "stats",
     description: "Show player statistics",
     type: 1,
     integration_types: [0],
     contexts: [0],
   };
   ```

2. **Create handler in `handlers/statsHandler.js`**
   ```javascript
   export async function handleStatsCommand(req, res) {
     // Your logic here
     return res.send({ ... });
   }
   ```

3. **Export handler in `handlers/index.js`**
   ```javascript
   export { handleStatsCommand } from "./statsHandler.js";
   ```

4. **Add to mapping in `config/command_mapping.js`**
   ```javascript
   import { handleStatsCommand } from "../handlers/index.js";
   
   const COMMAND_HANDLERS = {
     register: handleRegisterCommand,
     info: handleInfoCommand,
     stats: handleStatsCommand, // Add this line
   };
   ```

5. **Register commands**
   ```bash
   npm run register
   ```

That's it! No need to modify `app.js`.

## 🔐 Security

- Discord signature verification enabled via `verifyKeyMiddleware`
- Environment variables for sensitive data
- `.gitignore` configured to exclude:
  - `.env` - API keys and tokens
  - `data/` - User data storage
  - `node_modules/` - Dependencies

## 🐛 Troubleshooting

### Commands not showing in Discord
1. Run `npm run register` to register commands
2. Wait a few minutes for Discord to propagate
3. Reload Discord (Ctrl+R)

### Bot not responding
1. Check if server is running on port 3000
2. Verify ngrok is forwarding to correct port
3. Check Discord Interactions Endpoint URL is correct
4. Check logs for signature verification errors

### PUBG API errors
- **404**: Player not found - Check spelling and platform (steam/kakao/psn/xbox)
- **401**: Invalid API key - Check `PUBG_API_KEY` in `.env`
- **429**: Rate limit exceeded - Wait a few minutes

### Storage issues
- Storage automatically creates `data/` directory if missing
- Check file permissions if write errors occur
- `users.json` is auto-created on first registration

## 📚 Resources

- [Discord Developer Portal](https://discord.com/developers/applications)
- [Discord Interactions API](https://discord.com/developers/docs/interactions/receiving-and-responding)
- [PUBG Developer API](https://developer.pubg.com/)
- [discord-interactions Package](https://www.npmjs.com/package/discord-interactions)

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details

## 👨‍💻 Author

Modified from Discord's example app by Shay DeWael

---

**Note:** This bot is designed for development/small servers. For production with many users, consider migrating to a database (PostgreSQL, MongoDB, etc.) instead of file-based storage.
