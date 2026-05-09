import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

const loaderUrl = pathToFileURL(join(import.meta.dirname, 'alias-loader.mjs')).href;
register(loaderUrl, import.meta.url);
