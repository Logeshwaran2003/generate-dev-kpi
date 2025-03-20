const { model } = require('../config/ai');

/**
 * Fetch analytics data from Gemini AI
 * @param {Object} taskContent - Formatted task content
 * @returns {Promise<Object>} - Analytics data
 */
async function fetchAnalyticsFromGemini(taskContent) {
    try {
        const prompt = `
        Based on the following task data, analyze the development process and generate analytics.
        Focus on cycle time, defect patterns, and development efficiency.
        Please provide:
        1. A summary of insights (max 3 bullet points)
        2. Data for a chart showing key metrics
        3. Return the response as a JSON object with these properties:
           - labels: Array of strings for chart labels
           - values: Array of numbers for chart values
           - summary: String with bullet points of insights
        
        Task Data:
        ${JSON.stringify(taskContent, null, 2)}`;

        const result = await model.generateContent(prompt);
        const responseText = await result.response.text();
        
        // Find JSON in the response
        const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                          responseText.match(/{[\s\S]*}/);
        
        let analyticsData;
        if (jsonMatch) {
            try {
                analyticsData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
            } catch (e) {
                console.error("Error parsing JSON from Gemini response:", e);
                // Fallback data if parsing fails
                analyticsData = createFallbackAnalytics(taskContent);
            }
        } else {
            // Fallback if no JSON found
            analyticsData = createFallbackAnalytics(taskContent);
        }

        return analyticsData;
    } catch (error) {
        console.error("Error fetching analytics from Gemini:", error);
        
        // Return fallback data if API call fails
        return createFallbackAnalytics(taskContent);
    }
}

/**
 * Create fallback analytics data
 * @param {Object} taskContent - Task content
 * @returns {Object} - Fallback analytics data
 */
function createFallbackAnalytics(taskContent) {
    return {
        labels: ["Updates", "Defects", "Cycle Time (days)"],
        values: [
            taskContent.updates.length,
            taskContent.defects.length,
            typeof taskContent.cycleTime === 'number' ? taskContent.cycleTime : 0
        ],
        summary: "• Analysis based on available task data\n• Unable to parse detailed insights\n• Basic metrics shown in chart"
    };
}

module.exports = {
    fetchAnalyticsFromGemini
};