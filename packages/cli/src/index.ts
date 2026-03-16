#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init.js';

const program = new Command();

program
  .name('agentgate')
  .description('AgentGate CLI — monetize your API for AI agents')
  .version('0.0.1');

program
  .command('init')
  .description('Initialize AgentGate in your project')
  .action(async () => {
    await initCommand();
  });

program.parse();
