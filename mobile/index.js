/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: index.js
 * Creato: 2025-12-30
 * Descrizione: React Native entry point - Registra l'app
 * =============================================================================
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
