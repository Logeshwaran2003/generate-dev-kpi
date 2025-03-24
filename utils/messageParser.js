/**
 * Extract task name from a message
 * @param {string} message - The message to parse
 * @returns {string|null} - The extracted task name or null if not found
 */

function extractTaskName(message) {
    const lines = message.split('\n');
    
    // Find index of any line containing the variations of dev build
    const devBuildIndex = lines.findIndex(line => {
        const trimmedLower = line.toLowerCase().trim();
        return trimmedLower === 'dev build' || 
               trimmedLower === 'dev build:' || 
               trimmedLower === 'development build' || 
               trimmedLower === 'development build:';
    });
    
    // Extract the task name if found
    return devBuildIndex >= 0 && devBuildIndex + 1 < lines.length ? 
        lines[devBuildIndex + 1].split(' - ')[0].trim() : null;
}

/**
 * Extract defect IDs from a message
 * @param {string} message - The message to parse
 * @returns {string[]} - Array of extracted defect IDs
 */

function extractDefectIDs(message) {
    // Extract all defect IDs in the format "D1234" appearing anywhere in the message
    const defectMatches = message.match(/\b[Dd][-\s]?\d+\b/g);
    
    if (defectMatches) {
        // Normalize defect IDs to the format "D1234"
        return [...new Set(defectMatches.map(d => {
            const num = d.match(/\d+/)[0];  // Extract just the number
            return `D${num}`;
        }))];
    }
    
    return [];
}

/**
 * Determine user type based on username and message
 * @param {string} username - The username
 * @param {string} message - The message content
 * @returns {string} - User type (DEV or QA)
 */
function determineUserType(username, message) {
    if (message.includes('(DEV)') || username.includes('DEV')) return 'DEV';
    if (message.includes('(QA)') || username.includes('QA')) return 'QA';
    return 'DEV';
}

module.exports = {
    extractTaskName,
    extractDefectIDs,
    determineUserType
};