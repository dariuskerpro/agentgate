/**
 * `agentgate init` command — interactive project setup
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { detectFramework, type Framework } from '../lib/detect.js';
import { generateApiKey, generateConfig, type RouteConfig } from '../lib/config.js';
import { validateWalletAddress, parseRoutePrice } from '../lib/validate.js';
import { generateMiddlewareSnippet } from '../lib/snippets.js';
import { MarketplaceClient } from '../lib/api.js';

export async function initCommand(): Promise<void> {
  console.log(chalk.bold('\n🚪 AgentGate — Monetize your API for AI agents\n'));

  // 1. Detect framework
  let framework: Framework | null = null;
  const pkgPath = join(process.cwd(), 'package.json');

  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      framework = detectFramework(pkg);
    } catch {
      // ignore parse errors
    }
  }

  const { selectedFramework } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedFramework',
      message: framework
        ? `What framework are you using? (auto-detected: ${chalk.cyan(framework)})`
        : 'What framework are you using?',
      choices: [
        { name: 'Express', value: 'express' as Framework },
        { name: 'Next.js', value: 'next' as Framework },
        { name: 'Hono', value: 'hono' as Framework },
      ],
      default: framework ?? 'express',
    },
  ]);

  // 2. Prompt for wallet address
  const { wallet } = await inquirer.prompt([
    {
      type: 'input',
      name: 'wallet',
      message: 'Your wallet address (receives USDC payments):',
      validate: (input: string) =>
        validateWalletAddress(input) || 'Invalid Ethereum address. Must be 0x + 40 hex characters.',
    },
  ]);

  // 3. Register with marketplace (or generate local key)
  const spinner = ora('Registering with AgentGate marketplace...').start();
  let apiKey: string;

  try {
    const client = new MarketplaceClient();
    const result = await client.registerSeller(wallet);
    apiKey = result.apiKey;
    spinner.succeed(chalk.green(`Registered! Your API key: ${chalk.bold(apiKey)}`));
  } catch {
    apiKey = generateApiKey();
    spinner.warn(
      chalk.yellow(`Marketplace unavailable. Generated local API key: ${chalk.bold(apiKey)}`)
    );
  }

  // 4. Prompt for routes
  const { routeInput } = await inquirer.prompt([
    {
      type: 'input',
      name: 'routeInput',
      message: 'Enter a route to monetize (e.g. GET /api/weather):',
      default: 'GET /api/data',
    },
  ]);

  const { priceInput } = await inquirer.prompt([
    {
      type: 'input',
      name: 'priceInput',
      message: `Pricing for ${chalk.cyan(routeInput)} (USDC per request):`,
      default: '$0.001',
      validate: (input: string) =>
        parseRoutePrice(input) !== null || 'Invalid price. Enter a positive number (e.g. $0.001)',
    },
  ]);

  const { description } = await inquirer.prompt([
    {
      type: 'input',
      name: 'description',
      message: `Description for ${chalk.cyan(routeInput)}:`,
      default: 'API endpoint',
    },
  ]);

  const routes: Record<string, RouteConfig> = {
    [routeInput]: {
      price: priceInput.startsWith('$') ? priceInput : `$${priceInput}`,
      description,
      category: 'data',
    },
  };

  // 5. Generate config
  const config = generateConfig({ wallet, apiKey, routes });
  const configPath = join(process.cwd(), '.agentgate.json');
  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
  console.log(chalk.green(`\n✅ Config written to ${chalk.bold('.agentgate.json')}`));

  // 6. Output snippet
  console.log(chalk.bold('\nAdd this to your app:\n'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log(generateMiddlewareSnippet(selectedFramework));
  console.log(chalk.gray('─'.repeat(50)));

  console.log(
    chalk.bold('\n🎉 Your endpoints are ready for the AgentGate marketplace!')
  );
  console.log(chalk.dim('Dashboard: https://agentgate.online/dashboard\n'));
}
