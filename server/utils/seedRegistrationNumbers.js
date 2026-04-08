import RegistrationNumber from '../models/RegistrationNumber.js';

export const seedRegistrationNumbers = async (adminId = null) => {
    const samples = [
        'FA19-BCS-001',
        'FA19-BCS-014',
        'SP20-BCS-004',
        'SP20-BCS-112',
        'FA21-SE-023',
        'FA21-SE-041',
        'SP22-IT-007',
        'SP22-IT-089'
    ];

    const existing = await RegistrationNumber.find({ number: { $in: samples } }).select('number');
    const existingSet = new Set(existing.map((item) => item.number));

    const toInsert = samples
        .filter((num) => !existingSet.has(num))
        .map((num) => ({
            number: num,
            status: 'valid',
            addedBy: adminId
        }));

    if (toInsert.length > 0) {
        await RegistrationNumber.insertMany(toInsert);
    }

    return { inserted: toInsert.length, skipped: existingSet.size };
};
