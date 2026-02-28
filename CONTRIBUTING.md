# Contributing to GoodReads Book Weighting System

## Development Workflow

We follow a branch-based workflow to ensure code quality and proper versioning.

### Branch Strategy

- **`main`** - Production-ready code. Protected branch. Only receives merges from `dev` or hotfix branches.
- **`dev`** - Development branch. All feature branches merge here first.
- **`feature/*`** - Feature branches for new functionality
- **`fix/*`** - Bug fix branches for non-critical issues
- **`hotfix/*`** - Critical bug fixes that need to go directly to main

### Workflow Steps

#### For New Features or Bug Fixes

1. **Start from dev branch**
   ```bash
   git checkout dev
   git pull origin dev
   ```

2. **Create a feature/fix branch**
   ```bash
   # For features
   git checkout -b feature/your-feature-name
   
   # For bug fixes
   git checkout -b fix/your-bug-fix-name
   ```

3. **Make your changes**
   - Write code
   - Add/update tests
   - Ensure all tests pass: `npm test`
   - Ensure linting passes: `npm run lint`

4. **Commit with conventional commits**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   # or
   git commit -m "fix: resolve bug"
   ```
   
   Commit types:
   - `feat:` - New feature (triggers minor version bump)
   - `fix:` - Bug fix (triggers patch version bump)
   - `docs:` - Documentation changes
   - `chore:` - Maintenance tasks
   - `refactor:` - Code refactoring
   - `test:` - Test additions/changes
   - `BREAKING CHANGE:` - Breaking changes (triggers major version bump)

5. **Push your branch**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request to dev**
   - Go to GitHub
   - Create PR from your branch to `dev`
   - Wait for CI checks to pass
   - Request review if needed
   - Merge when approved

#### For Hotfixes (Critical Production Issues)

1. **Start from main branch**
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Create hotfix branch**
   ```bash
   git checkout -b hotfix/critical-issue-name
   ```

3. **Make your fix**
   - Fix the issue
   - Add tests
   - Ensure all tests pass

4. **Commit and push**
   ```bash
   git add .
   git commit -m "fix: critical issue description"
   git push origin hotfix/critical-issue-name
   ```

5. **Create PR to main**
   - Create PR from hotfix branch to `main`
   - After merging to main, also merge to `dev` to keep branches in sync

### Release Process

Releases are automated using semantic-release:

1. **Merge dev to main** (when ready for release)
   ```bash
   git checkout main
   git pull origin main
   git merge dev
   git push origin main
   ```

2. **Semantic-release automatically:**
   - Analyzes commits since last release
   - Determines version bump (major/minor/patch)
   - Updates CHANGELOG.md
   - Updates package.json version
   - Creates GitHub release
   - Creates git tag

3. **Dev syncs back from main**
   - Automated workflow syncs main changes back to dev
   - Includes version bumps and changelog updates

### Local Development

```bash
# Install dependencies
pnpm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint

# Build TypeScript
npm run build

# Run CLI locally
npm start

# Run GUI locally
npm run start:gui

# Build executable
npm run build:executable
```

### Code Quality

- All code must pass ESLint checks
- All tests must pass
- Maintain test coverage
- Follow existing code style
- Use TypeScript strict mode

### Testing

- Write unit tests for new functionality
- Update existing tests when modifying code
- Ensure integration tests pass
- Test the GUI executable before releasing

## Questions?

If you have questions about the workflow, open an issue or reach out to the maintainers.
