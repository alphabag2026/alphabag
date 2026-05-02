import { createConnection } from "mysql2/promise";
const conn = await createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute("SHOW COLUMNS FROM `investmentPlans` LIKE 'websiteUrl'");
console.log("websiteUrl column:", rows);
await conn.end();
