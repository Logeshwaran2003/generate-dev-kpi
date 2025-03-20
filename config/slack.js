const { WebClient } = require('@slack/web-api');
const { createEventAdapter } = require('@slack/events-api');

const signingSecret = process.env.SIGNING_SECRET;
const slackToken = process.env.SLACK_BOT_TOKEN;

const slackEvents = createEventAdapter(signingSecret);
const slackClient = new WebClient(slackToken);

module.exports = { slackEvents, slackClient };