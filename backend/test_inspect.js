const { queryAll, queryGet } = require('./database');

async function inspectDB() {
  const tables = await queryAll("SELECT name FROM sqlite_master WHERE type='table'");
  console.log("Tables:", tables.map(t => t.name));

  for (const t of tables) {
    const count = await queryGet(`SELECT COUNT(*) as cnt FROM "${t.name}"`);
    console.log(`Table ${t.name}: ${count.cnt} rows`);
  }
}

inspectDB();
