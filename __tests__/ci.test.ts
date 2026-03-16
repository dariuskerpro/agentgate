import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { parse as parseYaml } from 'yaml';
import { join } from 'path';

const ROOT = join(__dirname, '..');

function loadYaml(relativePath: string) {
  const fullPath = join(ROOT, relativePath);
  expect(existsSync(fullPath), `${relativePath} should exist`).toBe(true);
  const content = readFileSync(fullPath, 'utf-8');
  return parseYaml(content);
}

describe('AG-014: CI/CD Configuration', () => {
  describe('CI workflow (.github/workflows/ci.yml)', () => {
    it('exists and is valid YAML', () => {
      const config = loadYaml('.github/workflows/ci.yml');
      expect(config).toBeDefined();
      expect(config.name).toBe('CI');
    });

    it('triggers on pull_request and push to main', () => {
      const config = loadYaml('.github/workflows/ci.yml');
      expect(config.on).toHaveProperty('pull_request');
      expect(config.on).toHaveProperty('push');
      expect(config.on.push.branches).toContain('main');
    });

    it('has lint, build, and test steps', () => {
      const config = loadYaml('.github/workflows/ci.yml');
      const jobs = config.jobs;
      expect(jobs).toBeDefined();

      // Find the check job
      const checkJob = jobs.check;
      expect(checkJob).toBeDefined();

      const runs = checkJob.steps
        .filter((s: any) => s.run)
        .map((s: any) => s.run);

      expect(runs.some((r: string) => r.includes('lint'))).toBe(true);
      expect(runs.some((r: string) => r.includes('build'))).toBe(true);
      expect(runs.some((r: string) => r.includes('test'))).toBe(true);
    });

    it('uses pnpm', () => {
      const config = loadYaml('.github/workflows/ci.yml');
      const checkJob = config.jobs.check;
      const steps = checkJob.steps;

      const usesPnpmAction = steps.some(
        (s: any) => s.uses && s.uses.includes('pnpm/action-setup')
      );
      const runsPnpm = steps.some(
        (s: any) => s.run && s.run.includes('pnpm')
      );

      expect(usesPnpmAction).toBe(true);
      expect(runsPnpm).toBe(true);
    });
  });

  describe('Deploy workflow (.github/workflows/deploy.yml)', () => {
    it('triggers on push to main only', () => {
      const config = loadYaml('.github/workflows/deploy.yml');
      expect(config.on.push.branches).toContain('main');
      expect(config.on).not.toHaveProperty('pull_request');
    });

    it('has separate jobs for marketplace-api, dashboard, and web', () => {
      const config = loadYaml('.github/workflows/deploy.yml');
      const jobNames = Object.keys(config.jobs);

      const hasMarketplaceApi = jobNames.some((j) =>
        j.toLowerCase().includes('marketplace')
      );
      const hasDashboard = jobNames.some((j) =>
        j.toLowerCase().includes('dashboard')
      );
      const hasWeb = jobNames.some((j) =>
        j.toLowerCase().includes('web')
      );

      expect(hasMarketplaceApi).toBe(true);
      expect(hasDashboard).toBe(true);
      expect(hasWeb).toBe(true);
    });
  });

  describe('Publish workflow (.github/workflows/publish.yml)', () => {
    it('triggers on version tags', () => {
      const config = loadYaml('.github/workflows/publish.yml');
      expect(config.on.push.tags).toBeDefined();

      const tags = config.on.push.tags;
      const hasVersionTag = tags.some((t: string) => t.startsWith('v'));
      expect(hasVersionTag).toBe(true);
    });
  });

  describe('.gitignore', () => {
    it('includes required entries', () => {
      const gitignorePath = join(ROOT, '.gitignore');
      expect(existsSync(gitignorePath)).toBe(true);

      const content = readFileSync(gitignorePath, 'utf-8');
      expect(content).toContain('node_modules');
      expect(content).toContain('dist');
      expect(content).toContain('.env');
      expect(content).toContain('.turbo');
      expect(content).toContain('.next');
    });
  });

  describe('wrangler.toml', () => {
    it('exists in apps/marketplace-api/', () => {
      const wranglerPath = join(ROOT, 'apps/marketplace-api/wrangler.toml');
      expect(existsSync(wranglerPath)).toBe(true);

      const content = readFileSync(wranglerPath, 'utf-8');
      expect(content).toContain('agentgate-marketplace-api');
      expect(content).toContain('compatibility_date');
    });
  });
});
