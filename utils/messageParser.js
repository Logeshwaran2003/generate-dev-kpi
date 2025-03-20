/**
 * Extract task name from a message
 * @param {string} message - The message to parse
 * @returns {string|null} - The extracted task name or null if not found
 */
function extractTaskName(message) {
    const lines = message.split('\n');
    const devBuildIndex = lines.findIndex(line => line.toLowerCase().trim() === 'dev build');
    return devBuildIndex >= 0 && devBuildIndex + 1 < lines.length ? 
        lines[devBuildIndex + 1].split(' - ')[0].trim() : null;
}

/**
 * Extract defect IDs from a message
 * @param {string} message - The message to parse
 * @returns {string[]} - Array of extracted defect IDs
 */
function extractDefectIDs(message) {
    // Look specifically for defects in the format (D1234) or after the phrase "defects" or "Defects"
    const defectsSection = message.match(/(?:defects|Defects).*?(?:\(([^)]+)\)|:[\s]*(.+?)(?:\.|$))/i);
    
    if (defectsSection) {
        // Get the content within parentheses or after colon
        const defectContent = defectsSection[1] || defectsSection[2];
        
        // Extract individual defect IDs
        const defectMatches = defectContent.match(/\b[Dd][-\s]?\d+\b/g);
        
        if (defectMatches) {
            // Normalize defect IDs to the format "D1234"
            return [...new Set(defectMatches.map(d => {
                const num = d.match(/\d+/)[0];
                return `D${num}`;
            }))];
        }
    }
    
    // If no defects section found, fallback to searching for defect IDs in general
    // but only in specific contexts to avoid false positives
    const individualDefects = message.match(/(?:defect|Defect|issue|Issue|bug|Bug)[\s:]*\b([Dd][-\s]?\d+)\b/g);
    
    if (individualDefects) {
        return [...new Set(individualDefects.map(d => {
            const num = d.match(/\d+/)[0];
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