#!/bin/bash

# Cleanup Obsolete Code Script
# Based on the Obsolete Code Audit Report
# Run from project root: ./cleanup-obsolete-code.sh

set -e  # Exit on error

echo "🧹 Cleaning obsolete code from FlagFit Pro..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Confirmation prompt
read -p "This will remove backup files and unused dependencies. Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cleanup cancelled"
    exit 0
fi

echo ""

# 1. Remove backup files
echo "📁 Step 1: Removing backup files..."
if [ -f "package-lock.json.bak" ]; then
    rm -f package-lock.json.bak
    echo "✅ Removed package-lock.json.bak"
else
    echo "ℹ️  No package-lock.json.bak found"
fi

# 2. Check for and remove deno.lock if Deno not used
echo ""
echo "📁 Step 2: Checking Deno usage..."
if [ -f "deno.lock" ]; then
    if ! grep -rq "deno" package.json scripts/ 2>/dev/null; then
        rm -f deno.lock
        echo "✅ Removed deno.lock (Deno not in use)"
    else
        echo "ℹ️  Keeping deno.lock (Deno detected in project)"
    fi
else
    echo "ℹ️  No deno.lock found"
fi

# 3. Update .gitignore
echo ""
echo "📝 Step 3: Updating .gitignore..."
if ! grep -q "^\*\.bak$" .gitignore 2>/dev/null; then
    echo "*.bak" >> .gitignore
    echo "✅ Added *.bak to .gitignore"
else
    echo "ℹ️  *.bak already in .gitignore"
fi

if ! grep -q "^\*\.backup$" .gitignore 2>/dev/null; then
    echo "*.backup" >> .gitignore
    echo "✅ Added *.backup to .gitignore"
else
    echo "ℹ️  *.backup already in .gitignore"
fi

if ! grep -q "^\.ports\.lock$" .gitignore 2>/dev/null; then
    echo ".ports.lock" >> .gitignore
    echo "✅ Added .ports.lock to .gitignore"
else
    echo "ℹ️  .ports.lock already in .gitignore"
fi

# 4. Remove unused dependency - bcryptjs
echo ""
echo "📦 Step 4: Removing unused dependency (bcryptjs)..."
if grep -q '"bcryptjs"' package.json 2>/dev/null; then
    npm uninstall bcryptjs --no-save 2>/dev/null || true
    echo "✅ Removed bcryptjs from dependencies"
else
    echo "ℹ️  bcryptjs not found in package.json"
fi

# 5. Update package.json - remove deprecated scripts
echo ""
echo "📝 Step 5: Cleaning deprecated npm scripts..."
if [ -f "package.json" ]; then
    # Create backup of package.json
    cp package.json package.json.tmp
    
    # Remove deprecated audit scripts using node
    node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        
        const deprecatedScripts = [
            'audit:docs:generate',
            'audit:docs:verify',
            'audit:docs'
        ];
        
        let removed = false;
        deprecatedScripts.forEach(script => {
            if (pkg.scripts && pkg.scripts[script]) {
                delete pkg.scripts[script];
                removed = true;
                console.log(\`✅ Removed deprecated script: \${script}\`);
            }
        });
        
        if (removed) {
            fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n', 'utf8');
            console.log('✅ Updated package.json');
        } else {
            console.log('ℹ️  No deprecated scripts found');
        }
    "
    
    # Remove temporary backup
    rm -f package.json.tmp
else
    echo "⚠️  package.json not found"
fi

# 6. Git status check
echo ""
echo "📊 Step 6: Checking git status..."
if command -v git &> /dev/null && [ -d ".git" ]; then
    echo ""
    echo "Deleted files (ready to commit):"
    git diff --name-only --diff-filter=D 2>/dev/null | while read -r file; do
        echo "  ❌ $file"
    done
    
    echo ""
    echo "New files (not yet tracked):"
    git ls-files --others --exclude-standard 2>/dev/null | grep -E "\.ts$|\.js$" | while read -r file; do
        echo "  ➕ $file"
    done
else
    echo "ℹ️  Not a git repository or git not installed"
fi

# 7. Optional: Remove redundant dev servers (with confirmation)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Optional: Remove redundant development servers?"
echo ""
echo "The following files may be redundant:"
echo "  • dev-server.cjs (replaced by Angular CLI)"
echo "  • dev-server-enhanced.cjs (replaced by Angular CLI + Netlify CLI)"
echo "  • simple-server.js (minimal static server - may still be useful)"
echo ""
read -p "Remove redundant dev servers? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -f "dev-server.cjs" ]; then
        rm dev-server.cjs
        echo "✅ Removed dev-server.cjs"
    fi
    if [ -f "dev-server-enhanced.cjs" ]; then
        rm dev-server-enhanced.cjs
        echo "✅ Removed dev-server-enhanced.cjs"
    fi
    echo ""
    echo "⚠️  Note: simple-server.js was kept (may still be useful for static serving)"
else
    echo "ℹ️  Skipped dev server removal"
fi

# 8. Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Cleanup complete!"
echo ""
echo "📋 Summary of changes:"
echo "  • Removed backup files"
echo "  • Updated .gitignore"
echo "  • Removed unused dependencies"
echo "  • Cleaned deprecated npm scripts"
echo ""
echo "📝 Next steps:"
echo "  1. Review changes: git status"
echo "  2. Commit deleted files: git add -u"
echo "  3. Add new files: git add <files>"
echo "  4. Run tests: npm run test:all"
echo "  5. Verify build: npm run build"
echo ""
echo "📖 See OBSOLETE_CODE_AUDIT.md for full audit report"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
