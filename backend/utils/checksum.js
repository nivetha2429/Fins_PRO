const crypto = require('crypto');
const fs = require('fs');

/**
 * Calculates the SHA-256 checksum of a file.
 * Returns UPPERCASE HEX format (required by Samsung Knox).
 * 
 * @param {string} filePath - Absolute path to the file
 * @returns {string} - UPPERCASE HEX encoded SHA-256 hash (no colons)
 */
function getApkChecksum(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found at ${filePath}`);
    }

    const fileBuffer = fs.readFileSync(filePath);
    const hashBuffer = crypto.createHash('sha256').update(fileBuffer).digest();

    // Convert to UPPERCASE HEX (Samsung Knox Requirement)
    // Format: 7BDCA0439E834B991F7AC734E71D95520E8989F06413DC3CFB93C1AAB067126E
    return hashBuffer.toString('hex').toUpperCase();
}

module.exports = { getApkChecksum };
