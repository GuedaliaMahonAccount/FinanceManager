import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import User from '../models/User.js';
import Project from '../models/Project.js';
import Transaction from '../models/Transaction.js';
import Label from '../models/Label.js';
import Settings from '../models/Settings.js';
import Subscription from '../models/Subscription.js';
import connectDB from '../config/db.js';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const migrate = async () => {
    try {
        await connectDB();

        const name = "Guedalia Sebbah";
        const email = "guedalia.sebbah@gmail.com";
        const password = "guedalia050504";

        let user = await User.findOne({ email });

        if (!user) {
            console.log('User not found, creating...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            user = await User.create({
                name,
                email,
                password: hashedPassword
            });
            console.log('User created:', user._id);
        } else {
            console.log('User found:', user._id);
        }

        console.log('Updating Projects...');
        await Project.updateMany({ user: { $exists: false } }, { $set: { user: user._id } });

        console.log('Updating Transactions...');
        await Transaction.updateMany({ user: { $exists: false } }, { $set: { user: user._id } });

        console.log('Updating Labels...');
        await Label.updateMany({ user: { $exists: false } }, { $set: { user: user._id } });

        console.log('Updating Settings...');
        await Settings.updateMany({ user: { $exists: false } }, { $set: { user: user._id } });

        console.log('Updating Subscriptions...');
        await Subscription.updateMany({ user: { $exists: false } }, { $set: { user: user._id } });

        console.log('Migration complete!');
        process.exit(0);

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrate();
