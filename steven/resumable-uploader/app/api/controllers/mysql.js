import mysql from 'mysql2/promise'
import fs from 'fs'


// Create connection
const _connectionPool = mysql.createPool({
    host: 'leapfile-db-dev.ceus5ioudas9.us-east-1.rds.amazonaws.com',
    user: 'write',
    password: 'luKYrV29rIUsvwwsqT',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
        ca: fs.readFileSync('app/api/controllers/global-bundle.pem'),
        rejectUnauthorized: true
    }
})

export async function query(sql, params) {

    // Assert required parameters
    if (!sql) throw new Error('/controllers/mysql.js: sql is required')

    // Select the database
    await _connectionPool.query(`USE ??`, [_config.database])

    // Execute the query
    const [rows, fields] = await _connectionPool.query(sql, params)
    return rows
}

let _config = {
    database: 'fts'
}
