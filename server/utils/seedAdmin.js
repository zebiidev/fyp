import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected for seeding...');

        const adminEmail = 'admin@gmail.com';
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log('Admin already exists. Updating password and role...');
            const salt = await bcrypt.genSalt(10);
            existingAdmin.password = await bcrypt.hash('123456789', salt);
            existingAdmin.role = 'admin';
            existingAdmin.accountStatus = 'approved';
            await existingAdmin.save();
            console.log('Admin updated successfully.');
        } else {
            console.log('Creating new admin...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('123456789', salt);

            await User.create({
                name: 'System Admin',
                email: adminEmail,
                password: hashedPassword,
                role: 'admin',
                registrationNumber: 'ADMIN-001',
                accountStatus: 'approved'
            });
            console.log('Admin created successfully.');
        }

        process.exit();
    } catch (err) {
        console.error('Error seeding admin:', err.message);
        process.exit(1);
    }
};

seedAdmin();
