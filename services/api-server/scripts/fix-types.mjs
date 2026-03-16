import fs from 'fs';
import path from 'path';

function replaceInFile(filePath, replacements) {
    if (!fs.existsSync(filePath)) {
        return;
    }
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    for (const [target, replacement] of replacements) {
        if (content.match(target)) {
            content = content.replace(target, replacement);
            changed = true;
        }
    }
    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed types in ${filePath}`);
    }
}

const basePath = 'd:/EduSphere-Classroom/EduSphere-Classroom/Classroom/services/api-server/src';

const modulesList = [
    'admin/admin.routes.ts', 'ai/ai.routes.ts', 'analytics/analytics.routes.ts',
    'assignments/assignments.routes.ts', 'classes/content.routes.ts', 'guilds/guilds.routes.ts',
    'marketplace/marketplace.routes.ts', 'messaging/messaging.routes.ts', 'notifications/notifications.routes.ts',
    'parents/parents.routes.ts', 'portfolio/portfolio.routes.ts', 'users/users.routes.ts', 'wellbeing/wellbeing.routes.ts'
];

for (const p of modulesList) {
    replaceInFile(path.join(basePath, 'modules', p), [
        [/(req\.params\.[a-zA-Z0-9_]+)(?!\s*as)/g, '$1 as string'],
        [/(req\.query\.[a-zA-Z0-9_]+)(?!\s*as)/g, '$1 as string']
    ]);
}
console.log("Types cleanup done.");
