const db = require('./backend/src/models');

async function showResponses() {
    try {
        const responses = await db.Response.findAll({ limit: 10 });
        for (const r of responses) {
            const task = await db.Task.findByPk(r.taskId);
            console.log(`Response ID: ${r.id} | Score: ${r.score} | TaskTitle: ${task ? task.title : 'null'} | lsrwComponent: ${task ? task.lsrwComponent : 'null'} | type: ${task ? task.type : 'null'}`);
        }
    } catch (e) {
        console.error(e);
    }
}
showResponses();
