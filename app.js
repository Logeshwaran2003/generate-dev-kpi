// File structure:
// - app.js (main entry point)
// - config/
//   - db.js (database connection)
//   - slack.js (slack configuration)
//   - ai.js (AI service configuration)
// - models/
//   - task.js
//   - update.js
//   - defect.js
// - services/
//   - taskService.js
//   - documentService.js
//   - analyticsService.js
//   - chartService.js
// - utils/
//   - messageParser.js
// - handlers/
//   - slackEventHandler.js
//   - filtersHandler.js

// app.js - Main entry point
require('dotenv').config();
const express = require('express');
const slackEvents = require('./config/slack').slackEvents;
const db = require('./config/db');
const slackEventHandler = require('./handlers/slackEventHandler');
const filtersHandler = require('./handlers/filtersHandler');
const port = process.env.PORT || 3002;

const app = express();
const bodyParser = require('body-parser');

// Connect to database
db.connect();

// Mount the Slack events handler
app.use('/slack/events', slackEvents.requestListener());

// Set up Slack event listener
slackEvents.on('message', slackEventHandler.handleMessage);
slackEvents.on('error', console.error);

let botOpened = {};

// Add an event listener for app_home_opened events
slackEvents.on('app_home_opened', async (event) => {
    console.log(`App home opened by user: ${event.user}`);
    if (!botOpened[event.user]){
        await filtersHandler.sendWelcomeMessage(event.channel);
        botOpened[event.user] = true;
    }
});

// Add this after your existing app setup, before any routes
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post('/slack/commands', filtersHandler.handleFiltersCommand);


// Start the express server and the Slack events adapter
app.listen(port, () => {
    console.log(`Express server is running on port ${port}`);
});

slackEvents.start().then(() => {
    console.log("Slack events adapter is running");
});