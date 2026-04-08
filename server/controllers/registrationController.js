import RegistrationNumber from '../models/RegistrationNumber.js';

const normalizeNumber = (value) => (value || '').toString().trim().toUpperCase();

// @desc    List registration numbers (search + status filter)
// @route   GET /api/admin/registrations
// @access  Private (Admin)
export const listRegistrationNumbers = async (req, res) => {
    try {
        const search = (req.query.search || '').trim();
        const status = (req.query.status || '').trim();
        const limit = parseInt(req.query.limit, 10);

        const query = {};
        if (search) {
            query.number = { $regex: search, $options: 'i' };
        }
        if (status && ['valid', 'used', 'revoked'].includes(status)) {
            query.status = status;
        }

        let cursor = RegistrationNumber.find(query)
            .sort({ createdAt: -1 })
            .populate('addedBy', 'name email')
            .populate('usedBy', 'name email role');
        if (Number.isFinite(limit) && limit > 0) {
            cursor = cursor.limit(limit);
        }
        const items = await cursor;

        res.json(items);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Add registration numbers (single or bulk)
// @route   POST /api/admin/registrations
// @access  Private (Admin)
export const addRegistrationNumbers = async (req, res) => {
    try {
        const { numbers } = req.body;
        const list = Array.isArray(numbers) ? numbers : [numbers];
        const normalized = list
            .map(normalizeNumber)
            .filter((value) => value.length > 0);

        if (!normalized.length) {
            return res.status(400).json({ message: 'At least one registration number is required.' });
        }

        const unique = Array.from(new Set(normalized));
        const existing = await RegistrationNumber.find({ number: { $in: unique } }).select('number');
        const existingSet = new Set(existing.map((item) => item.number));

        const toInsert = unique
            .filter((num) => !existingSet.has(num))
            .map((num) => ({
                number: num,
                status: 'valid',
                addedBy: req.user.id
            }));

        if (toInsert.length > 0) {
            await RegistrationNumber.insertMany(toInsert);
        }

        res.json({
            inserted: toInsert.length,
            skipped: existingSet.size,
            skippedNumbers: Array.from(existingSet)
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update registration number status
// @route   PATCH /api/admin/registrations/:id
// @access  Private (Admin)
export const updateRegistrationStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['valid', 'revoked'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value.' });
        }

        const record = await RegistrationNumber.findById(req.params.id);
        if (!record) {
            return res.status(404).json({ message: 'Registration number not found.' });
        }

        if (record.status === 'used' && status === 'valid') {
            return res.status(400).json({ message: 'Used registration numbers cannot be revalidated.' });
        }

        record.status = status;
        await record.save();
        res.json(record);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
