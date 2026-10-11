import initUI from './wipecord-ui.js';
import { VERSION } from 'process.env';
import { claimRuntime } from './runtime-guard.js';

if (claimRuntime(document, VERSION)) initUI();
else console.warn('[WIPECORD] Another installation already owns this page. Disable the duplicate and reload.');
