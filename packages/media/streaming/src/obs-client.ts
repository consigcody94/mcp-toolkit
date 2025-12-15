/**
 * OBS Studio WebSocket client wrapper
 */

import OBSWebSocket from 'obs-websocket-js';
import type { OBSConfig, OBSScene, OBSSource, OBSStreamStatus, OBSRecordStatus, OBSStats, OperationResult } from './types.js';

export class OBSClient {
  private obs: OBSWebSocket;
  private connected: boolean = false;

  constructor() {
    this.obs = new OBSWebSocket();
  }

  /**
   * Connect to OBS Studio
   */
  async connect(config: OBSConfig = {}): Promise<OperationResult> {
    try {
      await this.obs.connect(
        `ws://${config.host || 'localhost'}:${config.port || 4455}`,
        config.password
      );
      this.connected = true;
      const version = await this.obs.call('GetVersion');
      return {
        success: true,
        message: 'Connected to OBS Studio',
        data: { version: version.obsVersion, wsVersion: version.obsWebSocketVersion },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to connect to OBS',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Disconnect from OBS
   */
  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.obs.disconnect();
      this.connected = false;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * List scenes
   */
  async listScenes(): Promise<OBSScene[]> {
    this.ensureConnected();
    const result = await this.obs.call('GetSceneList');
    return result.scenes.map((scene: any, index: number) => ({
      sceneName: scene.sceneName,
      sceneIndex: index,
    }));
  }

  /**
   * Get current scene
   */
  async getCurrentScene(): Promise<string> {
    this.ensureConnected();
    const result = await this.obs.call('GetCurrentProgramScene');
    return result.currentProgramSceneName;
  }

  /**
   * Switch to scene
   */
  async switchScene(sceneName: string): Promise<OperationResult> {
    try {
      this.ensureConnected();
      await this.obs.call('SetCurrentProgramScene', { sceneName });
      return {
        success: true,
        message: `Switched to scene: ${sceneName}`,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to switch scene',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Start streaming
   */
  async startStream(): Promise<OperationResult> {
    try {
      this.ensureConnected();
      await this.obs.call('StartStream');
      return {
        success: true,
        message: 'Started streaming',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to start stream',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Stop streaming
   */
  async stopStream(): Promise<OperationResult> {
    try {
      this.ensureConnected();
      await this.obs.call('StopStream');
      return {
        success: true,
        message: 'Stopped streaming',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to stop stream',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get stream status
   */
  async getStreamStatus(): Promise<OBSStreamStatus> {
    this.ensureConnected();
    const result = await this.obs.call('GetStreamStatus');
    return {
      outputActive: result.outputActive,
      outputReconnecting: result.outputReconnecting,
      outputTimecode: result.outputTimecode,
      outputDuration: result.outputDuration,
      outputBytes: result.outputBytes,
    };
  }

  /**
   * Start recording
   */
  async startRecording(): Promise<OperationResult> {
    try {
      this.ensureConnected();
      await this.obs.call('StartRecord');
      return {
        success: true,
        message: 'Started recording',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to start recording',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Stop recording
   */
  async stopRecording(): Promise<OperationResult> {
    try {
      this.ensureConnected();
      await this.obs.call('StopRecord');
      return {
        success: true,
        message: 'Stopped recording',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to stop recording',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get recording status
   */
  async getRecordStatus(): Promise<OBSRecordStatus> {
    this.ensureConnected();
    const result = await this.obs.call('GetRecordStatus');
    return {
      outputActive: result.outputActive,
      outputPaused: result.outputPaused,
      outputTimecode: result.outputTimecode,
      outputDuration: result.outputDuration,
      outputBytes: result.outputBytes,
    };
  }

  /**
   * List sources
   */
  async listSources(): Promise<OBSSource[]> {
    this.ensureConnected();
    const result = await this.obs.call('GetInputList');
    return result.inputs.map((input: any) => ({
      sourceName: input.inputName,
      sourceType: input.inputKind,
      sourceKind: input.unversionedInputKind,
    }));
  }

  /**
   * Set source visibility
   */
  async setSourceVisibility(sourceName: string, visible: boolean): Promise<OperationResult> {
    try {
      this.ensureConnected();
      const sceneName = await this.getCurrentScene();
      const sceneItemId = await this.getSceneItemId(sceneName, sourceName);
      await this.obs.call('SetSceneItemEnabled', {
        sceneName,
        sceneItemId,
        sceneItemEnabled: visible,
      });
      return {
        success: true,
        message: `Set ${sourceName} visibility to ${visible}`,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to set source visibility',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get scene item ID
   */
  private async getSceneItemId(sceneName: string, sourceName: string): Promise<number> {
    const result = await this.obs.call('GetSceneItemId', { sceneName, sourceName });
    return result.sceneItemId;
  }

  /**
   * Get OBS stats
   */
  async getStats(): Promise<OBSStats> {
    this.ensureConnected();
    const result = await this.obs.call('GetStats');
    return {
      cpuUsage: result.cpuUsage,
      memoryUsage: result.memoryUsage,
      availableDiskSpace: result.availableDiskSpace,
      activeFps: result.activeFps,
      renderTotalFrames: result.renderTotalFrames,
      renderSkippedFrames: result.renderSkippedFrames,
      outputTotalFrames: result.outputTotalFrames,
      outputSkippedFrames: result.outputSkippedFrames,
    };
  }

  /**
   * Ensure connected
   */
  private ensureConnected(): void {
    if (!this.connected) {
      throw new Error('Not connected to OBS Studio. Use connect_obs tool first.');
    }
  }
}
