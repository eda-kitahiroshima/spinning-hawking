const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./server/apps.db');

db.all("SELECT tags FROM apps", [], (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log("Found " + rows.length + " apps.");
    rows.forEach(row => {
        console.log("Tags:", row.tags);
    });
});
