/**
 * Target Enumerator - Discovers API endpoints from codebase
 * Phase 113: Intelligence Gathering Core
 */

const fs = require('fs').promises;
const path = require('path');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const { glob } = require('glob');

/**
 * Discovers API endpoints through static code analysis
 */
class TargetEnumerator {
  constructor(options = {}) {
    this.routes = [];
    this.framework = null;
    this.options = {
      includeUndocumented: true,
      ...options
    };
  }

  /**
   * Discover routes from a file or directory
   * @param {string} targetPath - Path to analyze
   * @returns {Promise<Array>} Discovered routes
   */
  async discoverRoutes(targetPath) {
    const stats = await fs.stat(targetPath).catch(() => null);

    if (!stats) {
      return [];
    }

    if (stats.isDirectory()) {
      return this.analyzeDirectory(targetPath);
    } else {
      return this.analyzeFile(targetPath);
    }
  }

  /**
   * Analyze a directory for routes
   */
  async analyzeDirectory(dirPath) {
    const results = [];

    // Check for framework-specific route patterns
    const framework = await this.detectFramework(dirPath);
    this.framework = framework;

    // Framework-specific discovery
    switch (framework?.name) {
      case 'nextjs':
        results.push(...await this.discoverNextJsRoutes(dirPath));
        break;
      case 'express':
      case 'fastify':
      case 'koa':
        results.push(...await this.discoverTraditionalRoutes(dirPath));
        break;
      default:
        results.push(...await this.discoverTraditionalRoutes(dirPath));
    }

    return results;
  }

  /**
   * Analyze a single file for routes
   */
  async analyzeFile(filePath) {
    const code = await fs.readFile(filePath, 'utf-8');
    const ast = this.parseAST(code, filePath);
    const routes = [];

    traverse(ast, {
      // Express/Fastify/Koa: app.get('/path', handler)
      CallExpression: (nodePath) => {
        const { callee, arguments: args } = nodePath.node;

        if (callee.type === 'MemberExpression') {
          const method = callee.property?.name;
          if (['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'all'].includes(method)) {
            const pathArg = args[0];
            if (pathArg && (pathArg.type === 'StringLiteral' || pathArg.type === 'TemplateLiteral')) {
              const routePath = pathArg.type === 'StringLiteral' ? pathArg.value : '[template]';
              const middleware = this.extractMiddleware(args);

              routes.push({
                path: routePath,
                methods: [method.toUpperCase()],
                file: filePath,
                line: nodePath.node.loc?.start?.line || 0,
                middleware: middleware.map(m => m.name || '[anonymous]'),
                authRequired: this.detectAuthRequirement(middleware),
                isDocumented: !this.isInternalRoute(routePath)
              });
            }
          }
        }

        // Hapi: server.route({ method, path })
        if (callee.type === 'MemberExpression' && callee.property?.name === 'route') {
          const configArg = args[0];
          if (configArg?.type === 'ObjectExpression') {
            const route = this.parseHapiRoute(configArg, filePath, nodePath.node.loc?.start?.line || 0);
            if (route) routes.push(route);
          }
        }
      },

      // NestJS: @Get('/path') decorator
      Decorator: (nodePath) => {
        const decoratorName = nodePath.node.expression?.name ||
                             nodePath.node.expression?.callee?.name;

        if (['Get', 'Post', 'Put', 'Delete', 'Patch', 'Options', 'Head', 'All'].includes(decoratorName)) {
          const method = decoratorName.toUpperCase();
          const pathArg = nodePath.node.expression?.arguments?.[0];
          const path = pathArg?.value || '/';

          const parent = nodePath.findParent(p => p.isMethodDefinition() || p.isClassMethod());
          const line = parent?.node?.loc?.start?.line || nodePath.node.loc?.start?.line || 0;

          routes.push({
            path,
            methods: [method],
            file: filePath,
            line,
            middleware: [],
            authRequired: false, // Would need decorator analysis
            isDocumented: true,
            framework: 'nestjs'
          });
        }
      }
    });

    return routes;
  }

  /**
   * Parse AST with appropriate plugins
   */
  parseAST(code, filePath) {
    const isTypeScript = filePath.endsWith('.ts') || filePath.endsWith('.tsx');

    return parse(code, {
      sourceType: 'module',
      allowImportExportEverywhere: true,
      plugins: [
        'jsx',
        'classProperties',
        'decorators-legacy',
        'dynamicImport',
        'optionalChaining',
        'nullishCoalescingOperator',
        ...(isTypeScript ? ['typescript'] : [])
      ]
    });
  }

  /**
   * Detect the framework used in the project
   */
  async detectFramework(projectPath) {
    try {
      const packageJsonPath = path.join(projectPath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

      if (deps['next']) return { name: 'nextjs', version: deps['next'] };
      if (deps['@nestjs/core']) return { name: 'nestjs', version: deps['@nestjs/core'] };
      if (deps['fastify']) return { name: 'fastify', version: deps['fastify'] };
      if (deps['koa'] || deps['@koa/router']) return { name: 'koa', version: deps['koa'] || deps['@koa/router'] };
      if (deps['@hapi/hapi']) return { name: 'hapi', version: deps['@hapi/hapi'] };
      if (deps['express']) return { name: 'express', version: deps['express'] };

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Discover Next.js routes from file structure
   */
  async discoverNextJsRoutes(dirPath) {
    const routes = [];
    const pagesDir = path.join(dirPath, 'pages');
    const appDir = path.join(dirPath, 'app');

    // Check for Pages Router
    if (await this.dirExists(pagesDir)) {
      const files = await glob('**/*.{js,jsx,ts,tsx}', { cwd: pagesDir });

      for (const file of files) {
        const routePath = this.fileToRoutePath(file);
        routes.push({
          path: routePath,
          methods: ['GET'],
          file: path.join(pagesDir, file),
          line: 1,
          middleware: [],
          authRequired: false,
          isDocumented: !this.isInternalRoute(routePath),
          framework: 'nextjs'
        });
      }
    }

    // Check for App Router
    if (await this.dirExists(appDir)) {
      const files = await glob('**/route.{js,ts}', { cwd: appDir });

      for (const file of files) {
        const routePath = this.appRouterFileToRoutePath(file);
        // App router files export HTTP method handlers
        routes.push({
          path: routePath,
          methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // All possible
          file: path.join(appDir, file),
          line: 1,
          middleware: [],
          authRequired: false,
          isDocumented: !this.isInternalRoute(routePath),
          framework: 'nextjs',
          router: 'app'
        });
      }
    }

    return routes;
  }

  /**
   * Discover routes from traditional server files
   */
  async discoverTraditionalRoutes(dirPath) {
    const routes = [];
    const patterns = [
      '**/routes/**/*.{js,ts}',
      '**/api/**/*.{js,ts}',
      '**/server.{js,ts}',
      '**/app.{js,ts}',
      '**/index.{js,ts}'
    ];

    for (const pattern of patterns) {
      const files = await glob(pattern, { cwd: dirPath, absolute: true });

      for (const file of files) {
        const fileRoutes = await this.analyzeFile(file);
        routes.push(...fileRoutes);
      }
    }

    return routes;
  }

  /**
   * Convert file path to route path (Next.js Pages Router)
   */
  fileToRoutePath(file) {
    let route = file
      .replace(/\.(js|jsx|ts|tsx)$/, '')
      .replace(/\/index$/, '')
      .replace(/\[(.*?)\]/g, ':$1');

    return route === '' ? '/' : '/' + route;
  }

  /**
   * Convert App Router file path to route path
   */
  appRouterFileToRoutePath(file) {
    const dir = path.dirname(file);
    return dir === '.' ? '/' : '/' + dir.replace(/\/route$/, '');
  }

  /**
   * Parse Hapi route configuration
   */
  parseHapiRoute(configNode, filePath, line) {
    let method = 'GET';
    let path = '/';
    let options = {};

    for (const prop of configNode.properties || []) {
      if (prop.key?.name === 'method' && prop.value?.type === 'StringLiteral') {
        method = prop.value.value.toUpperCase();
      }
      if (prop.key?.name === 'path' && prop.value?.type === 'StringLiteral') {
        path = prop.value.value;
      }
      if (prop.key?.name === 'options') {
        // Check for auth in options
        for (const opt of prop.value.properties || []) {
          if (opt.key?.name === 'auth') {
            options.auth = opt.value;
          }
        }
      }
    }

    return {
      path,
      methods: [method],
      file: filePath,
      line,
      middleware: [],
      authRequired: options.auth !== false,
      isDocumented: !this.isInternalRoute(path),
      framework: 'hapi'
    };
  }

  /**
   * Extract middleware from route arguments
   */
  extractMiddleware(args) {
    if (args.length <= 1) return [];

    return args.slice(1).filter(arg =>
      arg.type === 'Identifier' || arg.type === 'FunctionExpression' || arg.type === 'ArrowFunctionExpression'
    );
  }

  /**
   * Detect if route requires authentication
   */
  detectAuthRequirement(middleware) {
    const authPatterns = ['auth', 'authenticate', 'requireAuth', 'isAuth', 'checkAuth', 'verifyToken', 'jwt'];

    for (const m of middleware) {
      const name = m.name || '';
      if (authPatterns.some(pattern => name.toLowerCase().includes(pattern))) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if route is internal/undocumented
   */
  isInternalRoute(routePath) {
    const internalPatterns = [
      /^\/_.*/,           // /_debug, /_internal
      /^\/internal/,      // /internal/...
      /^\/admin/,          // /admin (if not properly protected)
      /^\/api\/v\d+$/,     // Version without specific endpoint
      /^\/health$/i,      // /health
      /^\/ping$/i,        // /ping
      /^\/ready$/i,       // /ready
      /^\/_next/,         // Next.js internal
      /^\/static/,         // Static files
      /\/_hidden\//        // Hidden routes
    ];

    return internalPatterns.some(pattern => pattern.test(routePath));
  }

  /**
   * Get discovered routes summary
   */
  getSummary() {
    const publicRoutes = this.routes.filter(r => r.isDocumented);
    const internalRoutes = this.routes.filter(r => !r.isDocumented);
    const protectedRoutes = this.routes.filter(r => r.authRequired);
    const unprotectedRoutes = this.routes.filter(r => !r.authRequired);

    return {
      total: this.routes.length,
      public: publicRoutes.length,
      internal: internalRoutes.length,
      protected: protectedRoutes.length,
      unprotected: unprotectedRoutes.length,
      framework: this.framework?.name || 'unknown'
    };
  }

  /**
   * Get all discovered routes
   */
  getRoutes() {
    return this.routes;
  }

  /**
   * Generate OpenAPI-like specification
   */
  generateApiSpec() {
    const paths = {};

    for (const route of this.routes) {
      if (!paths[route.path]) {
        paths[route.path] = {};
      }

      for (const method of route.methods) {
        paths[route.path][method.toLowerCase()] = {
          operationId: `${method.toLowerCase()}${route.path.replace(/[^a-zA-Z0-9]/g, '_')}`,
          security: route.authRequired ? [{ bearerAuth: [] }] : [],
          x-internal: !route.isDocumented,
          'x-middleware': route.middleware,
          'x-file': route.file,
          'x-line': route.line
        };
      }
    }

    return {
      openapi: '3.0.0',
      info: {
        title: 'Discovered API',
        version: '1.0.0'
      },
      paths
    };
  }

  /**
   * Check if directory exists
   */
  async dirExists(dirPath) {
    try {
      const stats = await fs.stat(dirPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }
}

module.exports = { TargetEnumerator };
