import { findSession } from '../../services/session';
import { encrypt, decrypt } from '../../services/AES';
//import CryptoJS from 'crypto-js';

export async function GET(req) {
    try {

        // Get the cookies from the request
        const cookieStore = req.cookies

        // Find the session
        const session = cookieStore.get(encrypt('_ps'));
        if (!session) throw new Error("The session is not present")

        // Decrypt the value to find the session id
        const sessionId = decrypt(session.value)

        // Find the user session
        const user = await findSession(sessionId)

        return new Response(JSON.stringify({user}), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
    });
    }
}