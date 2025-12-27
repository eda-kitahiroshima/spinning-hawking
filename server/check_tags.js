const db = require('./database');

(async () => {
    try {
        const { rows } = await db.query("SELECT tags FROM apps");
        console.log("Found " + rows.length + " apps.");
        rows.forEach(row => {
            console.log("Tags:", row.tags);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
