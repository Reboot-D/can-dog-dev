#!/usr/bin/env node

/**
 * Execute Checklist - Story Definition of Done Validator
 * 
 * This script validates that a story meets all Definition of Done criteria
 * before it can be marked as complete.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ChecklistExecutor {
    constructor(storyPath) {
        this.storyPath = storyPath;
        this.storyContent = '';
        this.results = {
            passed: 0,
            failed: 0,
            errors: []
        };
    }

    async execute() {
        console.log('🔍 Executing Definition of Done Checklist...\n');
        
        try {
            await this.loadStory();
            await this.validateStoryStructure();
            await this.validateTaskCompletion();
            await this.validateCodeQuality();
            await this.validateTesting();
            await this.validateLocalization();
            await this.validateDocumentation();
            await this.validateReviewProcess();
            
            this.generateReport();
            
        } catch (error) {
            console.error('❌ Critical error during checklist execution:', error.message);
            process.exit(1);
        }
    }

    async loadStory() {
        try {
            if (!fs.existsSync(this.storyPath)) {
                throw new Error(`Story file not found: ${this.storyPath}`);
            }
            
            this.storyContent = fs.readFileSync(this.storyPath, 'utf8');
            console.log(`📖 Loaded story: ${path.basename(this.storyPath)}`);
            
        } catch (error) {
            this.addError('Story Loading', error.message);
        }
    }

    async validateStoryStructure() {
        console.log('📋 Validating story structure...');
        
        const requiredSections = [
            'Status',
            'Story', 
            'Acceptance Criteria',
            'Tasks / Subtasks',
            'Dev Agent Record'
        ];

        for (const section of requiredSections) {
            if (this.storyContent.includes(`## ${section}`)) {
                this.addPass('Story Structure', `${section} section present`);
            } else {
                this.addError('Story Structure', `Missing required section: ${section}`);
            }
        }

        // Check if status is appropriate for DoD validation
        const statusMatch = this.storyContent.match(/## Status\s*\n([^\n]+)/);
        if (statusMatch) {
            const status = statusMatch[1].trim();
            const validStatuses = ['Ready for Review', 'Approved', 'Done'];
            
            if (validStatuses.includes(status)) {
                this.addPass('Story Status', `Status "${status}" is valid for DoD check`);
            } else {
                this.addError('Story Status', `Status "${status}" not ready for DoD. Must be one of: ${validStatuses.join(', ')}`);
            }
        }
    }

    async validateTaskCompletion() {
        console.log('✅ Validating task completion...');
        
        // Check for completed tasks marked with [x]
        const completedTasks = (this.storyContent.match(/- \[x\]/g) || []).length;
        const incompleteTasks = (this.storyContent.match(/- \[ \]/g) || []).length;
        
        if (incompleteTasks === 0 && completedTasks > 0) {
            this.addPass('Task Completion', `All ${completedTasks} tasks completed`);
        } else {
            this.addError('Task Completion', `${incompleteTasks} incomplete tasks found`);
        }

        // Check for DoD checklist in story
        if (this.storyContent.includes('Definition of Done Checklist') || 
            this.storyContent.includes('DoD Checklist')) {
            this.addPass('DoD Checklist', 'DoD checklist present in story');
        } else {
            this.addError('DoD Checklist', 'DoD checklist missing from story');
        }
    }

    async validateCodeQuality() {
        console.log('🔧 Validating code quality...');
        
        try {
            // Check if we're in the web app directory
            const webDir = path.join(process.cwd(), 'apps', 'web');
            if (!fs.existsSync(webDir)) {
                this.addError('Code Quality', 'Web app directory not found');
                return;
            }

            // Run TypeScript compiler check
            try {
                execSync('pnpm tsc --noEmit', { 
                    cwd: webDir, 
                    stdio: 'pipe' 
                });
                this.addPass('Code Quality', 'TypeScript compilation successful');
            } catch (error) {
                this.addError('Code Quality', 'TypeScript compilation failed');
            }

            // Run ESLint check
            try {
                execSync('pnpm lint', { 
                    cwd: webDir, 
                    stdio: 'pipe' 
                });
                this.addPass('Code Quality', 'ESLint validation passed');
            } catch (error) {
                this.addError('Code Quality', 'ESLint validation failed');
            }

        } catch (error) {
            this.addError('Code Quality', `Code quality check failed: ${error.message}`);
        }
    }

    async validateTesting() {
        console.log('🧪 Validating testing requirements...');
        
        try {
            const webDir = path.join(process.cwd(), 'apps', 'web');
            
            // Check for test files
            const testDirs = [
                path.join(webDir, 'src', '__tests__'),
                path.join(webDir, 'src', 'components'),
                path.join(webDir, 'src', 'lib'),
                path.join(webDir, 'e2e')
            ];

            let testFilesFound = 0;
            for (const dir of testDirs) {
                if (fs.existsSync(dir)) {
                    const files = this.findFilesRecursively(dir, /\.(test|spec)\.(ts|tsx|js)$/);
                    testFilesFound += files.length;
                }
            }

            if (testFilesFound > 0) {
                this.addPass('Testing', `Found ${testFilesFound} test files`);
            } else {
                this.addError('Testing', 'No test files found');
            }

            // Run tests
            try {
                execSync('pnpm test', { 
                    cwd: webDir, 
                    stdio: 'pipe' 
                });
                this.addPass('Testing', 'All tests passed');
            } catch (error) {
                this.addError('Testing', 'Some tests failed');
            }

        } catch (error) {
            this.addError('Testing', `Testing validation failed: ${error.message}`);
        }
    }

    async validateLocalization() {
        console.log('🌐 Validating localization...');
        
        try {
            const messagesPath = path.join(process.cwd(), 'apps', 'web', 'src', 'messages', 'zh-CN.json');
            
            if (fs.existsSync(messagesPath)) {
                const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));
                const messageCount = Object.keys(messages).length;
                this.addPass('Localization', `Chinese messages file exists with ${messageCount} translations`);
            } else {
                this.addError('Localization', 'Chinese messages file not found');
            }

        } catch (error) {
            this.addError('Localization', `Localization check failed: ${error.message}`);
        }
    }

    async validateDocumentation() {
        console.log('📚 Validating documentation...');
        
        // Check for Dev Agent Record completion
        if (this.storyContent.includes('### Agent Model Used') &&
            this.storyContent.includes('### Completion Notes')) {
            this.addPass('Documentation', 'Dev Agent Record section completed');
        } else {
            this.addError('Documentation', 'Dev Agent Record section incomplete');
        }

        // Check for file list
        if (this.storyContent.includes('### File List') || 
            this.storyContent.includes('**New Files Created:**')) {
            this.addPass('Documentation', 'File list documented');
        } else {
            this.addError('Documentation', 'File list missing from documentation');
        }

        // Check for change log
        if (this.storyContent.includes('## Change Log')) {
            this.addPass('Documentation', 'Change log present');
        } else {
            this.addError('Documentation', 'Change log missing');
        }
    }

    async validateReviewProcess() {
        console.log('👥 Validating review process...');
        
        // Check for QA section
        if (this.storyContent.includes('## QA Results') ||
            this.storyContent.includes('### QA Review')) {
            this.addPass('Review Process', 'QA review section present');
        } else {
            this.addError('Review Process', 'QA review section missing');
        }

        // Check for approval status
        const statusMatch = this.storyContent.match(/## Status\s*\n([^\n]+)/);
        if (statusMatch && statusMatch[1].trim() === 'Approved') {
            this.addPass('Review Process', 'Story has been approved');
        } else if (statusMatch && statusMatch[1].trim() === 'Done') {
            this.addPass('Review Process', 'Story is marked as Done');
        } else {
            this.addError('Review Process', 'Story not yet approved or completed');
        }
    }

    findFilesRecursively(dir, pattern) {
        let results = [];
        try {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);
                
                if (stat.isDirectory()) {
                    results = results.concat(this.findFilesRecursively(filePath, pattern));
                } else if (pattern.test(file)) {
                    results.push(filePath);
                }
            }
        } catch (error) {
            // Directory might not exist, ignore
        }
        return results;
    }

    addPass(category, message) {
        this.results.passed++;
        console.log(`  ✅ ${category}: ${message}`);
    }

    addError(category, message) {
        this.results.failed++;
        this.results.errors.push({ category, message });
        console.log(`  ❌ ${category}: ${message}`);
    }

    generateReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 DEFINITION OF DONE CHECKLIST REPORT');
        console.log('='.repeat(60));
        
        console.log(`✅ Passed: ${this.results.passed}`);
        console.log(`❌ Failed: ${this.results.failed}`);
        console.log(`📈 Success Rate: ${Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100)}%`);
        
        if (this.results.failed > 0) {
            console.log('\n🚨 ISSUES TO RESOLVE:');
            for (const error of this.results.errors) {
                console.log(`   • ${error.category}: ${error.message}`);
            }
            
            console.log('\n❌ STORY NOT READY FOR DONE STATUS');
            console.log('Please resolve all issues before marking as complete.\n');
            process.exit(1);
        } else {
            console.log('\n🎉 ALL CHECKS PASSED!');
            console.log('✅ Story meets Definition of Done criteria');
            console.log('Ready to mark as DONE and move to production.\n');
            process.exit(0);
        }
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('Usage: node execute-checklist.js <story-file-path>');
        console.log('Example: node execute-checklist.js docs/stories/1.1.project-initialization-supabase-setup.md');
        process.exit(1);
    }

    const storyPath = path.resolve(args[0]);
    const executor = new ChecklistExecutor(storyPath);
    await executor.execute();
}

if (require.main === module) {
    main().catch(error => {
        console.error('Unexpected error:', error);
        process.exit(1);
    });
}

module.exports = ChecklistExecutor;