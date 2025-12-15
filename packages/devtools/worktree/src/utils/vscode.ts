import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function isVSCodeInstalled(): Promise<boolean> {
  try {
    await execAsync('code --version');
    return true;
  } catch {
    return false;
  }
}

export async function openInVSCode(path: string, newWindow: boolean = true): Promise<void> {
  const args = newWindow ? '--new-window' : '--reuse-window';

  try {
    await execAsync(`code ${args} "${path}"`);
  } catch (error) {
    throw new Error(`Failed to open VS Code: ${error}`);
  }
}

export async function openInTerminal(path: string): Promise<void> {
  // Open a new terminal in the specified directory
  const command = process.platform === 'darwin'
    ? `open -a Terminal "${path}"`
    : process.platform === 'win32'
    ? `start cmd.exe /K "cd /d ${path}"`
    : `x-terminal-emulator --working-directory="${path}" || gnome-terminal --working-directory="${path}" || xterm -e "cd ${path} && bash"`;

  try {
    await execAsync(command);
  } catch (error) {
    throw new Error(`Failed to open terminal: ${error}`);
  }
}
