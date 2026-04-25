import SosAlert from '../models/SosAlert.js';
import User from '../models/User.js';
import Ride from '../models/Ride.js';
import { createNotification } from './notificationController.js';
import { sendSms } from '../services/smsService.js';
import { reverseGeocodeNominatim } from '../utils/reverseGeocode.js';

const buildMapsLink = (location) => {
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
        return '';
    }
    return `https://maps.google.com/?q=${location.lat},${location.lng}`;
};

const formatTime = (date = new Date()) => {
    return date.toLocaleTimeString('en-GB', {
        timeZone: 'Asia/Karachi',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
};

export const createSosAlert = async (req, res) => {
    try {
        const { message, location, rideId } = req.body;
        const user = await User.findById(req.user.id).select('name phoneNumber role');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const sosAlert = await SosAlert.create({
            user: user._id,
            role: user.role,
            message: message || '',
            location: location || undefined,
            ride: rideId || undefined
        });

        let rideSummary = '';
        if (rideId) {
            const ride = await Ride.findById(rideId).select('pickupLocation dropoffLocation status');
            if (ride) {
                rideSummary = `${ride.pickupLocation} -> ${ride.dropoffLocation} (${ride.status})`;
            }
        }

        const mapLink = buildMapsLink(location);
        // Human-readable location helps admins more than raw lat/lng.
        // We keep the maps link too, because it's the most precise.
        const placeName = location ? await reverseGeocodeNominatim(location) : null;
        const coords =
            location && typeof location.lat === 'number' && typeof location.lng === 'number'
                ? `${location.lat}, ${location.lng}`
                : null;
        const smsLines = [
            'SOS ALERT',
            `${user.role?.toUpperCase() || 'USER'}: ${user.name || 'Unknown'}`,
            user.phoneNumber ? `Phone: ${user.phoneNumber}` : 'Phone: N/A',
            rideSummary ? `Ride: ${rideSummary}` : '',
            placeName ? `Place: ${placeName}` : '',
            coords ? `Coords: ${coords}` : '',
            mapLink ? `Loc: ${mapLink}` : 'Loc: N/A',
            `Time: ${formatTime(new Date())}`
        ].filter(Boolean);
        const smsBody = smsLines.join('\n');

        const io = req.app.get('io');
        const admins = await User.find({ role: 'admin' }).select('_id');
        await Promise.all(
            admins.map((admin) =>
                createNotification(io, {
                    recipient: admin._id,
                    type: 'sos_alert',
                    title: 'SOS Alert Triggered',
                    message: `${user.name || 'A user'} triggered SOS.${rideSummary ? ` Ride: ${rideSummary}.` : ''}`,
                    link: '/admin/dashboard',
                    sender: user._id
                }).catch((err) => {
                    console.error('Failed to notify admin about SOS:', err.message);
                })
            )
        );

        const adminPhone = process.env.SOS_ADMIN_PHONE;
        const smsResult = await sendSms({ to: adminPhone, body: smsBody });

        res.status(201).json({
            message: 'SOS alert created',
            sosAlert,
            sms: smsResult
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
