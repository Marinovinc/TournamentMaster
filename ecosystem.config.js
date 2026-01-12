/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: ecosystem.config.js
 * Creato: 2026-01-11
 * Descrizione: Configurazione PM2 per avvio servizi TournamentMaster in background
 *
 * Utilizzo:
 * - pm2 start ecosystem.config.js
 * - pm2 stop all
 * - pm2 restart all
 * - pm2 logs
 * =============================================================================
 */

module.exports = {
  apps: [
    {
      name: 'tm-backend',
      cwd: 'D:/Dev/TournamentMaster/backend',
      script: 'src/index.ts',
      interpreter: 'node',
      interpreter_args: '-r ts-node/register',
      env: {
        NODE_ENV: 'development'
      },
      watch: false,
      autorestart: true,
      max_restarts: 5,
      windowsHide: true
    },
    {
      name: 'tm-frontend',
      cwd: 'D:/Dev/TournamentMaster/frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'dev',
      env: {
        NODE_ENV: 'development'
      },
      watch: false,
      autorestart: true,
      max_restarts: 5,
      windowsHide: true
    }
  ]
};
