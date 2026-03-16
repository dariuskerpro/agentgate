/**
 * Framework detection from package.json
 */

export type Framework = 'express' | 'next' | 'hono';

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const FRAMEWORK_MAP: Record<string, Framework> = {
  express: 'express',
  next: 'next',
  hono: 'hono',
};

/**
 * Detect the web framework from a parsed package.json object.
 * Checks both dependencies and devDependencies.
 * Returns the first match or null.
 */
export function detectFramework(pkg: PackageJson): Framework | null {
  const allDeps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };

  for (const [dep, framework] of Object.entries(FRAMEWORK_MAP)) {
    if (dep in allDeps) {
      return framework;
    }
  }

  return null;
}
