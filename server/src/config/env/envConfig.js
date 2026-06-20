// region imports
import dotenv from 'dotenv';
dotenv.config();
// endregion

// region parse config — reads the APP JSON blob from .env
let env = {};
try {
  env = JSON.parse(process?.env?.APP ?? '{}');
} catch {
  throw new Error('Invalid APP environment variable JSON');
}
// endregion

// region exports
export { env };
// endregion
