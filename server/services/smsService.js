const buildTwilioClient = async () => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
        return null;
    }

    try {
        const { default: twilio } = await import('twilio');
        return twilio(accountSid, authToken);
    } catch (err) {
        console.warn('Twilio SDK not available. Install "twilio" to enable SMS.', err?.message || err);
        return null;
    }
};

export const sendSms = async ({ to, body }) => {
    const from = process.env.TWILIO_PHONE_NUMBER;
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
    if (!to || (!from && !messagingServiceSid)) {
        return { ok: false, reason: 'Missing SMS from/to or messaging service' };
    }

    const client = await buildTwilioClient();
    if (!client) {
        return { ok: false, reason: 'Twilio client not configured' };
    }

    try {
        const payload = { to, body };
        if (messagingServiceSid) {
            payload.messagingServiceSid = messagingServiceSid;
        } else {
            payload.from = from;
        }
        const message = await client.messages.create(payload);
        return { ok: true, sid: message.sid };
    } catch (err) {
        console.error('Failed to send SMS:', err?.message || err);
        return { ok: false, reason: err?.message || 'SMS send failed' };
    }
};
