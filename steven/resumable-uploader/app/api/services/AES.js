import crypto from 'crypto'


const secretKey = '6&F3#D0+2b!9?F%Z';
const algorithm = 'aes-128-ecb';

export function encrypt(plainText) {
    const cipher = crypto.createCipheriv(algorithm, secretKey, null);
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

export function decrypt(cipherText) {
    const decipher = crypto.createDecipheriv(algorithm, secretKey, null);
    // First, convert the hex string to a byte array
    const cipherBytes = convertToByteArray(cipherText);
    // Then decrypt the byte array
    let decrypted = decipher.update(cipherBytes);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    // Convert the decrypted buffer to a string
    return decrypted.toString('utf8');
}

export function convertToHexString(buffer) {
    return buffer.toString('hex');
}

export function convertToByteArray(hexString) {
    return Buffer.from(hexString, 'hex');
}
