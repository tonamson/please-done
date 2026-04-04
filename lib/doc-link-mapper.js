/**
 * Documentation Link Mapper
 * Maps detected technologies to their official documentation URLs
 * @module lib/doc-link-mapper
 */

/**
 * Mapping of technology names to their documentation URLs
 * @constant {Object}
 */
const DOC_LINKS = {
  // Frameworks
  nestjs: 'https://docs.nestjs.com',
  nextjs: 'https://nextjs.org/docs',
  express: 'https://expressjs.com/en/api.html',
  fastify: 'https://www.fastify.io/docs/latest/',
  react: 'https://react.dev',
  vue: 'https://vuejs.org/guide/',
  angular: 'https://angular.io/docs',
  svelte: 'https://svelte.dev/docs',

  // Languages
  typescript: 'https://www.typescriptlang.org/docs/',
  javascript: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
  python: 'https://docs.python.org/3/',
  go: 'https://go.dev/doc/',
  rust: 'https://www.rust-lang.org/learn',

  // ORMs/Databases
  prisma: 'https://www.prisma.io/docs',
  typeorm: 'https://typeorm.io',
  sequelize: 'https://sequelize.org/docs/v6/',
  mongoose: 'https://mongoosejs.com/docs/',
  drizzle: 'https://orm.drizzle.team/docs/overview',

  // Testing
  jest: 'https://jestjs.io/docs',
  vitest: 'https://vitest.dev/guide',
  mocha: 'https://mochajs.org/',
  cypress: 'https://docs.cypress.io',
  playwright: 'https://playwright.dev/docs/intro',

  // Build Tools
  webpack: 'https://webpack.js.org/concepts/',
  vite: 'https://vitejs.dev/guide/',
  rollup: 'https://rollupjs.org/introduction/',
  esbuild: 'https://esbuild.github.io/api/',
  turborepo: 'https://turbo.build/repo/docs',

  // Package Managers
  npm: 'https://docs.npmjs.com/',
  yarn: 'https://yarnpkg.com/getting-started',
  pnpm: 'https://pnpm.io/motivation',

  // Other
  docker: 'https://docs.docker.com/',
  graphql: 'https://graphql.org/learn/',
  redis: 'https://redis.io/docs/',
  kafka: 'https://kafka.apache.org/documentation/',
};

/**
 * Get documentation links for detected technologies
 * @param {Object} techStack - Object with technology names as keys (values are typically booleans or version strings)
 * @returns {Object} - Object with tech name -> doc URL mappings for known technologies
 * @example
 * const links = getDocumentationLinks({ nestjs: true, prisma: '5.0.0', typescript: true });
 * // Returns: { nestjs: 'https://docs.nestjs.com', prisma: 'https://www.prisma.io/docs', typescript: 'https://www.typescriptlang.org/docs/' }
 */
function getDocumentationLinks(techStack) {
  // Handle edge cases
  if (!techStack || typeof techStack !== 'object') {
    return {};
  }

  const result = {};
  const techNames = Object.keys(techStack);

  for (const tech of techNames) {
    const normalizedTech = tech.toLowerCase().trim();
    const docUrl = DOC_LINKS[normalizedTech];

    if (docUrl) {
      result[normalizedTech] = docUrl;
    }
    // Graceful fallback: unknown technologies are simply skipped
    // This allows the caller to handle unknowns as needed
  }

  return result;
}

/**
 * Check if a technology has a known documentation link
 * @param {string} techName - Name of the technology
 * @returns {boolean} - True if documentation link exists
 */
function hasDocumentationLink(techName) {
  if (!techName || typeof techName !== 'string') {
    return false;
  }
  const normalized = techName.toLowerCase().trim();
  return normalized in DOC_LINKS;
}

/**
 * Get a single documentation link for a technology
 * @param {string} techName - Name of the technology
 * @returns {string|null} - Documentation URL or null if not found
 */
function getDocumentationLink(techName) {
  if (!techName || typeof techName !== 'string') {
    return null;
  }
  const normalized = techName.toLowerCase().trim();
  return DOC_LINKS[normalized] || null;
}

module.exports = {
  DOC_LINKS,
  getDocumentationLinks,
  hasDocumentationLink,
  getDocumentationLink,
};
