import fs from 'fs';
import path from 'path';

function replaceInFile(filePath, replacements) {
    if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        return;
    }
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    for (const [target, replacement] of replacements) {
        const isMatch = typeof target === 'string' ? content.includes(target) : content.match(target);
        if (isMatch) {
            if (typeof target === 'string') {
                content = content.replaceAll(target, replacement);
            } else {
                content = content.replace(target, replacement);
            }
            changed = true;
        }
    }
    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    }
}

const basePath = 'd:/EduSphere-Classroom/EduSphere-Classroom/Classroom/services/api-server/src';

const modulesList = [
    'admin/admin.routes.ts', 'ai/ai.routes.ts', 'analytics/analytics.routes.ts',
    'assignments/assignments.routes.ts', 'classes/content.routes.ts', 'guilds/guilds.routes.ts',
    'marketplace/marketplace.routes.ts', 'messaging/messaging.routes.ts', 'notifications/notifications.routes.ts',
    'parents/parents.routes.ts', 'portfolio/portfolio.routes.ts', 'users/users.routes.ts', 'wellbeing/wellbeing.routes.ts'
];

// 1. Storage Paths
for (const p of modulesList) {
    replaceInFile(path.join(basePath, 'modules', p), [
        ['"../../../../server/storage"', '"@server/storage"'],
        [/(?:req\.user\.|req\.user\s+as\s+any|\(req\.user\s+as\s+any\)\.)/g, 'req.user!.']
    ]);
}

// 2. Auth, Notifications, Portfolio, Analytics, AI services
replaceInFile(path.join(basePath, 'modules/ai/personalTutor.service.ts'), [
    ['"../storage"', '"@server/storage"'],
    ['"./aiService"', '"./ai.service"'],
    ['(a)', '(a: any)'],
    ['(s)', '(s: any)']
]);
replaceInFile(path.join(basePath, 'modules/analytics/risk.service.ts'), [
    ['"../storage"', '"@server/storage"'],
    ['"../notification-service"', '"../notifications/notifications.service"'],
    ['(a)', '(a: any)'],
    ['(s,', '(s: any,'],
    ['(sum,', '(sum: any,']
]);

replaceInFile(path.join(basePath, 'modules/auth/auth.strategies.ts'), [
    ['"./storage"', '"@server/storage"']
]);
replaceInFile(path.join(basePath, 'modules/notifications/notifications.service.ts'), [
    ['"./storage"', '"@server/storage"'],
    ['"./services/emailService"', '"../../infrastructure/email/emailService"']
]);
replaceInFile(path.join(basePath, 'modules/portfolio/certificate.service.ts'), [
    ['"../storage"', '"@server/storage"']
]);
replaceInFile(path.join(basePath, 'modules/portfolio/portfolio.service.ts'), [
    ['"../storage"', '"@server/storage"'],
    ['(item)', '(item: any)'],
    ['(i)', '(i: any)']
]);
replaceInFile(path.join(basePath, 'modules/wellbeing/wellbeing.service.ts'), [
    ['"../storage"', '"@server/storage"'],
    ['"./aiService"', '"../ai/ai.service"'],
    ['(h)', '(h: any)']
]);

replaceInFile(path.join(basePath, 'websocket/socket.ts'), [
    ['"./storage"', '"@server/storage"'],
    ['"./redis"', '"../core/redis"']
]);

replaceInFile(path.join(basePath, 'infrastructure/ai/documentProcessor.ts'), [
    ['"../storage"', '"@server/storage"'],
    ['"./aiService"', '"../../modules/ai/ai.service"']
]);

replaceInFile(path.join(basePath, 'infrastructure/queue/jobs.ts'), [
    ['"./storage"', '"@server/storage"'],
    ['"./db"', '"../../core/database/db"'],
    ['"./notification-service"', '"../../modules/notifications/notifications.service"']
]);

replaceInFile(path.join(basePath, 'core/middleware/vite.ts'), [
    ['import viteConfig from "../vite.config";', 'import viteConfig from "../../../../../apps/web/vite.config";']
]);

replaceInFile(path.join(basePath, 'modules/ai/ai.routes.ts'), [
    ['(m)', '(m: any)'],
    ['(item)', '(item: any)'],
    [/req\.user\./g, 'req.user!.']
]);
replaceInFile(path.join(basePath, 'modules/wellbeing/wellbeing.routes.ts'), [
    ['(u)', '(u: any)'],
    [/req\.user\./g, 'req.user!.']
]);

console.log("Done updating replacements.");
