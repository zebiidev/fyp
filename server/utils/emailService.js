import nodemailer from 'nodemailer';

// Create transporter conditionally or lazily
const getTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER?.trim(),
            pass: process.env.EMAIL_PASS?.trim()
        }
    });
};

const getFrontendUrl = () => {
    const url = process.env.CLIENT_URL?.trim();
    return url ? url.replace(/\/+$/, '') : 'http://localhost:5173';
};

const getFromAddress = () => {
    // Gmail typically requires the "from" to match the authenticated account.
    const fromEnv = process.env.EMAIL_FROM?.trim();
    return fromEnv || process.env.EMAIL_USER?.trim();
};

export const sendApprovalEmail = async (userEmail, userName) => {
    console.log(`[email] approval: preparing to send to ${userEmail}`);
    const mailOptions = {
        from: `"Campus Ride Admin" <${getFromAddress()}>`,
        to: userEmail,
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
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            const transporter = getTransporter();
            await transporter.sendMail(mailOptions);
            console.log(`[email] approval: sent to ${userEmail}`);
        } else {
            console.log('[email] approval: skipped (EMAIL_USER or EMAIL_PASS not set).');
        }
    } catch (error) {
        console.error('[email] approval: failed to send:', error);
        throw error;
    }
};

export const sendRejectionEmail = async (userEmail, userName, reason) => {
    console.log(`[email] rejection: preparing to send to ${userEmail}`);
    const mailOptions = {
        from: `"Campus Ride Admin" <${getFromAddress()}>`,
        to: userEmail,
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
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            const transporter = getTransporter();
            await transporter.sendMail(mailOptions);
            console.log(`[email] rejection: sent to ${userEmail}`);
        } else {
            console.log('[email] rejection: skipped (EMAIL_USER or EMAIL_PASS not set).');
        }
    } catch (error) {
        console.error('[email] rejection: failed to send:', error);
        throw error;
    }
}

