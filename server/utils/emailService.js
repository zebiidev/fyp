const getBrevoKey = () => process.env.BREVO_API_KEY?.trim();
const getSenderEmail = () => process.env.BREVO_SENDER_EMAIL?.trim();
const getSenderName = () => process.env.BREVO_SENDER_NAME?.trim() || 'Campus Ride Admin';

const getFrontendUrl = () => {
    const url = process.env.CLIENT_URL?.trim();
    return url ? url.replace(/\/+$/, '') : 'http://localhost:5173';
};

const sendBrevoEmail = async ({ toEmail, toName, subject, html }) => {
    const apiKey = getBrevoKey();
    const senderEmail = getSenderEmail();
    const senderName = getSenderName();

    if (!apiKey || !senderEmail) {
        throw new Error('BREVO_API_KEY or BREVO_SENDER_EMAIL missing');
    }

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'api-key': apiKey
        },
        body: JSON.stringify({
            sender: { name: senderName, email: senderEmail },
            to: [{ email: toEmail, name: toName }],
            subject,
            htmlContent: html
        })
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Brevo API error ${res.status}: ${text}`);
    }
};

export const sendApprovalEmail = async (userEmail, userName) => {
    console.log(`[email] approval: preparing to send to ${userEmail}`);
    const mailOptions = {
        subject: 'Account Approved - Campus Ride App',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4F46E5;">Welcome to Campus Ride!</h2>
                <p>Hello <strong>${userName}</strong>,</p>
                <p>Great news! Your account has been approved by the administration.</p>
                <p>You can now log in and start using the app to find rides or offer them.</p>
                <br/>
                <a href="${getFrontendUrl()}/login" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login Now</a>
                <br/><br/>
                <p>Safe travels,</p>
                <p>The Campus Ride Team</p>
            </div>
        `
    };

    try {
        await sendBrevoEmail({
            toEmail: userEmail,
            toName: userName,
            subject: mailOptions.subject,
            html: mailOptions.html
        });
        console.log(`[email] approval: sent to ${userEmail}`);
    } catch (error) {
        console.error('[email] approval: failed to send:', error);
        throw error;
    }
};

export const sendRejectionEmail = async (userEmail, userName, reason) => {
    console.log(`[email] rejection: preparing to send to ${userEmail}`);
    const mailOptions = {
        subject: 'Account Update - Campus Ride App',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #E11D48;">Account Status Update</h2>
                <p>Hello <strong>${userName}</strong>,</p>
                <p>We regret to inform you that your account registration has been rejected.</p>
                <p><strong>Reason:</strong> ${reason}</p>
                <p>Please contact the administration for more details or try registering again with correct information.</p>
                <br/>
                <p>Regards,</p>
                <p>The Campus Ride Team</p>
            </div>
        `
    };

    try {
        await sendBrevoEmail({
            toEmail: userEmail,
            toName: userName,
            subject: mailOptions.subject,
            html: mailOptions.html
        });
        console.log(`[email] rejection: sent to ${userEmail}`);
    } catch (error) {
        console.error('[email] rejection: failed to send:', error);
        throw error;
    }
};
