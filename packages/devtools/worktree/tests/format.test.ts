import { formatPath, formatDaysAgo, formatSize, getStatusSymbol } from '../src/utils/format';
import { GitStatus } from '../src/types';

describe('format utilities', () => {
  describe('formatPath', () => {
    it('should return path as-is if under max length', () => {
      const path = '/short/path';
      expect(formatPath(path, 50)).toBe(path);
    });

    it('should replace home directory with tilde', () => {
      const home = process.env.HOME || '/home/user';
      const path = `${home}/projects/repo`;
      const result = formatPath(path, 50);
      expect(result).toContain('~');
    });

    it('should truncate long paths', () => {
      const longPath = '/very/long/path/that/exceeds/maximum/length/allowed';
      const result = formatPath(longPath, 20);
      expect(result.length).toBeLessThanOrEqual(20);
      expect(result).toContain('...');
    });
  });

  describe('formatDaysAgo', () => {
    it('should format 0 days as "today"', () => {
      expect(formatDaysAgo(0)).toBe('today');
    });

    it('should format 1 day as "yesterday"', () => {
      expect(formatDaysAgo(1)).toBe('yesterday');
    });

    it('should format days < 7 as "N days ago"', () => {
      expect(formatDaysAgo(3)).toBe('3 days ago');
    });

    it('should format days < 30 as "N weeks ago"', () => {
      expect(formatDaysAgo(14)).toBe('2 weeks ago');
    });

    it('should format days < 365 as "N months ago"', () => {
      expect(formatDaysAgo(60)).toBe('2 months ago');
    });

    it('should format days >= 365 as "N years ago"', () => {
      expect(formatDaysAgo(400)).toBe('1 years ago');
    });
  });

  describe('formatSize', () => {
    it('should format bytes', () => {
      expect(formatSize(500)).toBe('500.0 B');
    });

    it('should format kilobytes', () => {
      expect(formatSize(1536)).toBe('1.5 KB');
    });

    it('should format megabytes', () => {
      expect(formatSize(1572864)).toBe('1.5 MB');
    });

    it('should format gigabytes', () => {
      expect(formatSize(1610612736)).toBe('1.5 GB');
    });
  });

  describe('getStatusSymbol', () => {
    it('should return ✗ for conflicted status', () => {
      const status: GitStatus = {
        ahead: 0,
        behind: 0,
        modified: 0,
        added: 0,
        deleted: 0,
        renamed: 0,
        untracked: 0,
        conflicted: 1,
        staged: 0,
      };
      const symbol = getStatusSymbol(status);
      expect(symbol).toContain('✗');
    });

    it('should return ● for modified status', () => {
      const status: GitStatus = {
        ahead: 0,
        behind: 0,
        modified: 1,
        added: 0,
        deleted: 0,
        renamed: 0,
        untracked: 0,
        conflicted: 0,
        staged: 0,
      };
      const symbol = getStatusSymbol(status);
      expect(symbol).toContain('●');
    });

    it('should return ◆ for out-of-sync status', () => {
      const status: GitStatus = {
        ahead: 1,
        behind: 0,
        modified: 0,
        added: 0,
        deleted: 0,
        renamed: 0,
        untracked: 0,
        conflicted: 0,
        staged: 0,
      };
      const symbol = getStatusSymbol(status);
      expect(symbol).toContain('◆');
    });

    it('should return ✓ for clean status', () => {
      const status: GitStatus = {
        ahead: 0,
        behind: 0,
        modified: 0,
        added: 0,
        deleted: 0,
        renamed: 0,
        untracked: 0,
        conflicted: 0,
        staged: 0,
      };
      const symbol = getStatusSymbol(status);
      expect(symbol).toContain('✓');
    });
  });
});
