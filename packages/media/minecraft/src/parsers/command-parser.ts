/**
 * Natural Language Command Parser
 * Translates natural language requests into Minecraft commands
 */

import type {
  NaturalLanguageRequest,
  ParsedCommand,
  ParsedIntent,
  CommandIntent,
} from '../types.js';

export class CommandParser {
  /**
   * Parse natural language into Minecraft command
   */
  static parse(request: NaturalLanguageRequest): ParsedCommand {
    const prompt = request.prompt.toLowerCase().trim();

    // Detect intent
    const intent = this.detectIntent(prompt);

    // Extract entities (players, items, coordinates, etc.)
    const entities = this.extractEntities(prompt, intent.intent);

    // Generate Minecraft command
    const minecraftCommand = this.generateCommand(intent, entities);

    return {
      action: intent.intent,
      parameters: entities,
      minecraftCommand,
    };
  }

  /**
   * Detect command intent from natural language
   */
  private static detectIntent(prompt: string): ParsedIntent {
    // Give item patterns
    if (
      /give|grant|award|provide/i.test(prompt) &&
      /diamond|sword|pickaxe|bow|arrow|block|item/i.test(prompt)
    ) {
      return { intent: 'give_item', entities: {}, confidence: 0.9 };
    }

    // Teleport patterns
    if (
      /teleport|tp|move|send|transport/i.test(prompt) ||
      /go to|bring to|take to/i.test(prompt)
    ) {
      return { intent: 'teleport', entities: {}, confidence: 0.9 };
    }

    // Gamemode patterns
    if (
      /gamemode|mode|change.*mode|set.*mode/i.test(prompt) ||
      /creative|survival|adventure|spectator/i.test(prompt)
    ) {
      return { intent: 'change_gamemode', entities: {}, confidence: 0.9 };
    }

    // Time patterns
    if (/time|day|night|noon|midnight|sunrise|sunset/i.test(prompt)) {
      return { intent: 'set_time', entities: {}, confidence: 0.9 };
    }

    // Weather patterns
    if (/weather|rain|clear|thunder|storm/i.test(prompt)) {
      return { intent: 'set_weather', entities: {}, confidence: 0.9 };
    }

    // Kill patterns
    if (/kill|slay|destroy|eliminate|remove/i.test(prompt)) {
      return { intent: 'kill_entity', entities: {}, confidence: 0.8 };
    }

    // Summon patterns
    if (/summon|spawn|create|conjure/i.test(prompt)) {
      return { intent: 'summon_entity', entities: {}, confidence: 0.9 };
    }

    // Set block patterns
    if (/set.*block|place.*block|fill|replace/i.test(prompt)) {
      return { intent: 'set_block', entities: {}, confidence: 0.8 };
    }

    // Broadcast patterns
    if (
      /say|tell|announce|broadcast|message|inform/i.test(prompt) &&
      /everyone|all|server/i.test(prompt)
    ) {
      return { intent: 'broadcast_message', entities: {}, confidence: 0.9 };
    }

    // Kick patterns
    if (/kick|remove.*player|boot/i.test(prompt)) {
      return { intent: 'kick_player', entities: {}, confidence: 0.9 };
    }

    // Ban patterns
    if (/ban|block.*player|blacklist/i.test(prompt)) {
      return { intent: 'ban_player', entities: {}, confidence: 0.9 };
    }

    // Op patterns
    if (/op|operator|admin|promote/i.test(prompt)) {
      return { intent: 'op_player', entities: {}, confidence: 0.9 };
    }

    // Clear inventory patterns
    if (/clear.*inventory|remove.*items|delete.*items/i.test(prompt)) {
      return { intent: 'clear_inventory', entities: {}, confidence: 0.9 };
    }

    // Difficulty patterns
    if (/difficulty|hard|easy|peaceful|normal/i.test(prompt)) {
      return { intent: 'set_difficulty', entities: {}, confidence: 0.9 };
    }

    return { intent: 'other', entities: {}, confidence: 0.5 };
  }

  /**
   * Extract entities from prompt based on intent
   */
  private static extractEntities(
    prompt: string,
    _intent: CommandIntent
  ): Record<string, string | number | boolean> {
    const entities: Record<string, string | number | boolean> = {};

    // Extract player names (capitalized words or @selectors)
    const playerMatch = prompt.match(/@[aeprst]|[A-Z][a-z]+/g);
    if (playerMatch) {
      entities.player = playerMatch[0];
    }

    // Extract item names
    const itemMatch = prompt.match(
      /diamond|iron|gold|wooden|stone|netherite|emerald|sword|pickaxe|axe|shovel|hoe|bow|arrow|block|dirt|grass|stone|cobblestone|oak|birch|spruce|jungle|acacia|dark_oak/gi
    );
    if (itemMatch && itemMatch.length > 0) {
      entities.item = itemMatch.join('_').toLowerCase();
    }

    // Extract numbers
    const numberMatch = prompt.match(/\b\d+\b/g);
    if (numberMatch) {
      entities.amount = parseInt(numberMatch[0]);
    }

    // Extract coordinates
    const coordMatch = prompt.match(/(-?\d+)\s+(-?\d+)\s+(-?\d+)/);
    if (coordMatch) {
      entities.x = parseInt(coordMatch[1]);
      entities.y = parseInt(coordMatch[2]);
      entities.z = parseInt(coordMatch[3]);
    }

    // Extract gamemode
    if (/creative/i.test(prompt)) entities.gamemode = 'creative';
    if (/survival/i.test(prompt)) entities.gamemode = 'survival';
    if (/adventure/i.test(prompt)) entities.gamemode = 'adventure';
    if (/spectator/i.test(prompt)) entities.gamemode = 'spectator';

    // Extract time
    if (/day|sunrise/i.test(prompt)) entities.time = 0;
    if (/noon/i.test(prompt)) entities.time = 6000;
    if (/night|sunset/i.test(prompt)) entities.time = 13000;
    if (/midnight/i.test(prompt)) entities.time = 18000;

    // Extract weather
    if (/clear/i.test(prompt)) entities.weather = 'clear';
    if (/rain/i.test(prompt)) entities.weather = 'rain';
    if (/thunder|storm/i.test(prompt)) entities.weather = 'thunder';

    // Extract difficulty
    if (/peaceful/i.test(prompt)) entities.difficulty = 'peaceful';
    if (/easy/i.test(prompt)) entities.difficulty = 'easy';
    if (/normal/i.test(prompt)) entities.difficulty = 'normal';
    if (/hard/i.test(prompt)) entities.difficulty = 'hard';

    // Extract message (text in quotes or after 'say')
    const messageMatch = prompt.match(/"([^"]+)"|'([^']+)'|say\s+(.+?)(?:\s+to|$)/i);
    if (messageMatch) {
      entities.message = messageMatch[1] || messageMatch[2] || messageMatch[3];
    }

    return entities;
  }

  /**
   * Generate Minecraft command from parsed intent and entities
   */
  private static generateCommand(
    intent: ParsedIntent,
    entities: Record<string, string | number | boolean>
  ): string {
    const player = entities.player || '@p'; // Default to nearest player

    switch (intent.intent) {
      case 'give_item': {
        const item = entities.item || 'diamond';
        const amount = entities.amount || 1;
        return `give ${player} minecraft:${item} ${amount}`;
      }

      case 'teleport': {
        if (entities.x !== undefined && entities.y !== undefined && entities.z !== undefined) {
          return `tp ${player} ${entities.x} ${entities.y} ${entities.z}`;
        }
        const target = entities.target || '@p';
        return `tp ${player} ${target}`;
      }

      case 'change_gamemode': {
        const gamemode = entities.gamemode || 'creative';
        return `gamemode ${gamemode} ${player}`;
      }

      case 'set_time': {
        const time = entities.time ?? 0;
        return `time set ${time}`;
      }

      case 'set_weather': {
        const weather = entities.weather || 'clear';
        return `weather ${weather}`;
      }

      case 'kill_entity': {
        return `kill ${player}`;
      }

      case 'summon_entity': {
        const entity = entities.entity || 'pig';
        if (entities.x !== undefined && entities.y !== undefined && entities.z !== undefined) {
          return `summon minecraft:${entity} ${entities.x} ${entities.y} ${entities.z}`;
        }
        return `summon minecraft:${entity}`;
      }

      case 'set_block': {
        const block = entities.block || 'stone';
        if (entities.x !== undefined && entities.y !== undefined && entities.z !== undefined) {
          return `setblock ${entities.x} ${entities.y} ${entities.z} minecraft:${block}`;
        }
        return `setblock ~ ~ ~ minecraft:${block}`;
      }

      case 'broadcast_message': {
        const message = entities.message || 'Hello, server!';
        return `say ${message}`;
      }

      case 'kick_player': {
        const reason = entities.reason || 'Kicked by admin';
        return `kick ${player} ${reason}`;
      }

      case 'ban_player': {
        const reason = entities.reason || 'Banned by admin';
        return `ban ${player} ${reason}`;
      }

      case 'op_player': {
        return `op ${player}`;
      }

      case 'clear_inventory': {
        return `clear ${player}`;
      }

      case 'set_difficulty': {
        const difficulty = entities.difficulty || 'normal';
        return `difficulty ${difficulty}`;
      }

      default:
        return 'help';
    }
  }

  /**
   * Validate if a command is safe to execute
   */
  static validate(command: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for dangerous commands
    const dangerousPatterns = [
      /stop/i,           // Server stop
      /restart/i,        // Server restart
      /whitelist\s+off/i, // Disable whitelist
      /op\s+\*/i,        // Op everyone
      /ban\s+\*/i,       // Ban everyone
      /kill\s+@[ae]/i,   // Kill all entities/players
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(command)) {
        errors.push(`Potentially dangerous command detected: ${command}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
