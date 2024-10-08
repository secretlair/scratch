import { query } from '../controllers/mysql'

export async function findSession(sessionId) {
    // Assert required parameters
    if (!sessionId) throw new Error('sessionId is required')

    // Query the database to find the session
    const sql = `SELECT ua.oid, ua.firstName
                FROM fts.loginsession ls INNER JOIN fts.useraccount ua on ls.userID = ua.oid
                where ls.sessionID = ?`
    const result = await query(sql, [sessionId])

    // Return the first (and should be only) result, or null if not found
    return result.length > 0 ? result[0] : null
}
