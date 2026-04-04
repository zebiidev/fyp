import Complaint from '../models/Complaint.js';

// @desc    Create a new complaint
// @route   POST /api/complaints
// @access  Private
export const createComplaint = async (req, res) => {
    try {
        const { type, subject, description } = req.body;

        const complaint = await Complaint.create({
            user: req.user.id,
            type,
            subject,
            description
        });

        res.status(201).json(complaint);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get all complaints for current user
// @route   GET /api/complaints/my
// @access  Private
export const getMyComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(complaints);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get all complaints (Admin)
// @route   GET /api/complaints
// @access  Private/Admin
export const getAllComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find().populate('user', 'name email').sort({ createdAt: -1 });
        res.json(complaints);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Resolve a complaint (Admin)
// @route   PUT /api/complaints/:id/resolve
// @access  Private/Admin
export const resolveComplaint = async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        complaint.status = 'Resolved';
        await complaint.save();

        res.json({ message: 'Complaint marked as resolved', complaint });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update complaint status/response (Admin)
// @route   PUT /api/complaints/:id
// @access  Private/Admin
export const updateComplaint = async (req, res) => {
    try {
        const { status, adminResponse } = req.body;
        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        if (status) {
            const allowed = ['Pending', 'In Progress', 'Resolved', 'Rejected'];
            if (!allowed.includes(status)) {
                return res.status(400).json({ message: 'Invalid status value.' });
            }
            complaint.status = status;
        }

        if (adminResponse !== undefined) {
            complaint.adminResponse = adminResponse;
        }

        await complaint.save();
        res.json({ message: 'Complaint updated', complaint });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
