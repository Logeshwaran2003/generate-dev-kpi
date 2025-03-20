const { GoogleGenerativeAI } = require("@google/generative-ai");

const geminiApiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

module.exports = { model };