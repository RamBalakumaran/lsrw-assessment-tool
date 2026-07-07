const db = require('./backend/src/models');

async function checkCreators() {
    try {
        const tasks = await db.Task.findAll();
        for (const t of tasks) {
            const creator = await db.User.findByPk(t.creatorId);
            console.log(`Task Title: ${t.title} | Creator Name: ${creator ? `${creator.firstName} ${creator.lastName}` : 'UNKNOWN'} | Creator Role: ${creator ? creator.role : 'UNKNOWN'}`);
        }
    } catch (e) {
        console.error(e);
    }
}
checkCreators();
