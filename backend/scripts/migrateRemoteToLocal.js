import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const remoteUri = process.env.MONGO_URI;
const localUri = 'mongodb://127.0.0.1:27017/finance_manager';

if (!remoteUri) {
  console.error("Error: MONGO_URI is not defined in the backend/.env file.");
  process.exit(1);
}

async function runMigration() {
  console.log("Starting database migration process...");
  console.log(`Remote URI: ${remoteUri.replace(/:([^@]+)@/, ':****@')}`); // Hide password in logs
  console.log(`Local URI: ${localUri}`);

  let remoteConnection;
  let localConnection;

  try {
    // 1. Connect to remote MongoDB
    console.log("Connecting to remote database...");
    remoteConnection = mongoose.createConnection(remoteUri);
    await remoteConnection.asPromise();
    console.log("Connected to remote database.");

    // 2. Connect to local MongoDB
    console.log("Connecting to local database...");
    localConnection = mongoose.createConnection(localUri);
    await localConnection.asPromise();
    console.log("Connected to local database.");

    // Get database names
    const remoteDb = remoteConnection.db;
    const localDb = localConnection.db;

    // 3. List all collections on the remote DB
    const collections = await remoteDb.listCollections().toArray();
    console.log(`Found ${collections.length} collections on remote database.`);

    // Ensure backup directory exists
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilePath = path.join(backupDir, `remote_backup_${timestamp}.json`);
    const backupData = {};

    // 4. Backup phase
    console.log("\n--- PHASE 1: Backing up remote data ---");
    for (const colInfo of collections) {
      const colName = colInfo.name;
      // Skip system collections
      if (colName.startsWith('system.')) continue;

      console.log(`Reading collection: ${colName}...`);
      const documents = await remoteDb.collection(colName).find({}).toArray();
      backupData[colName] = documents;
      console.log(`Backed up ${documents.length} documents from ${colName}.`);
    }

    // Write backup file
    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf-8');
    console.log(`\nBackup successfully written to:\n  ${backupFilePath}\n`);

    // 5. Migration phase
    console.log("--- PHASE 2: Migrating data to local database ---");
    for (const colInfo of collections) {
      const colName = colInfo.name;
      if (colName.startsWith('system.')) continue;

      const documents = backupData[colName];
      console.log(`Migrating collection: ${colName} (${documents.length} documents)...`);

      // Drop local collection if it exists to ensure a clean copy
      try {
        await localDb.collection(colName).drop();
        console.log(`  Dropped existing local collection: ${colName}`);
      } catch (dropErr) {
        // Collection might not exist, which is fine
        if (dropErr.codeName !== 'NamespaceNotFound') {
          console.log(`  Note on dropping collection ${colName}: ${dropErr.message}`);
        }
      }

      if (documents.length > 0) {
        // Insert documents into local collection
        const insertResult = await localDb.collection(colName).insertMany(documents);
        console.log(`  Successfully inserted ${insertResult.insertedCount} documents into local collection: ${colName}`);
      } else {
        console.log(`  Collection ${colName} is empty. Creating empty collection locally.`);
        // Just create the collection
        await localDb.createCollection(colName);
      }
    }

    console.log("\nMigration completed successfully without errors!");
    process.exit(0);
  } catch (error) {
    console.error("\nMigration failed with error:", error);
    process.exit(1);
  } finally {
    if (remoteConnection) await remoteConnection.close();
    if (localConnection) await localConnection.close();
  }
}

runMigration();
