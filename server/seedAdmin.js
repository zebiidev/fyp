import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import AdminAuditLog from './models/AdminAuditLog.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://muhammadabuzer256_db_user:sahiwal007@cluster0.xhldekh.mongodb.net';

async function seedAdmin() {
    await mongoose.connect(MONGO_URI);

    const email = 'admin@gmail.com';
    const password = '123456789';

    let admin = await User.findOne({ email });

    if (!admin) {
        const hashedPassword = await bcrypt.hash(password, 10);

        admin = new User({
            email,
            password: hashedPassword,
            role: 'admin',
            name: 'Admin',
            registrationNumber: 'ADMIN001'
        });

        await admin.save();

        await AdminAuditLog.create({
            action: 'Seed admin',
            details: 'Created default admin user',
            actor: admin._id
        });

        console.log('Admin seeded:', email);
    } else {
        console.log('Admin already exists:', email);
    }

    await mongoose.disconnect();
}

seedAdmin().catch((err) => {
    console.error(err);
    process.exit(1);
});