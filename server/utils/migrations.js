const { dbRun, dbAll } = require('./db');

/**
 * Run database migrations
 */
async function runMigrations(db) {
  try {
    console.log('Running database migrations...');

    // Phase 1: Core feature columns
    await addColumnIfNotExists(db, 'users', 'role', "TEXT DEFAULT 'user'");
    await addColumnIfNotExists(db, 'users', 'totalRepairs', 'INTEGER DEFAULT 0');
    await addColumnIfNotExists(db, 'users', 'totalWaterSaved', 'REAL DEFAULT 0');
    await addColumnIfNotExists(db, 'users', 'totalCO2Reduced', 'REAL DEFAULT 0');
    await addColumnIfNotExists(db, 'users', 'totalWasteReduced', 'REAL DEFAULT 0');
    await addColumnIfNotExists(db, 'users', 'totalPoints', 'INTEGER DEFAULT 0');
    await addColumnIfNotExists(db, 'users', 'earnedBadges', "TEXT DEFAULT '[]'");
    await addColumnIfNotExists(db, 'users', 'trustScore', 'INTEGER DEFAULT 50');
    await addColumnIfNotExists(db, 'users', 'totalCO2Saved', 'REAL DEFAULT 0');
    await addColumnIfNotExists(db, 'users', 'totalWaterSaved', 'REAL DEFAULT 0');
    await addColumnIfNotExists(db, 'users', 'wardrobeHealthScore', 'REAL DEFAULT 100');

    await addColumnIfNotExists(db, 'bookings', 'wasteSaved', 'REAL');
    await addColumnIfNotExists(db, 'bookings', 'sustainabilityScore', 'INTEGER');
    await addColumnIfNotExists(db, 'bookings', 'rewardPoints', 'INTEGER');
    await addColumnIfNotExists(db, 'bookings', 'completedAt', 'DATETIME');
    await addColumnIfNotExists(db, 'bookings', 'aiPredictionId', 'INTEGER');
    await addColumnIfNotExists(db, 'bookings', 'isEmergency', 'BOOLEAN DEFAULT 0');
    await addColumnIfNotExists(db, 'bookings', 'emergencyCompletedAt', 'DATETIME');
    await addColumnIfNotExists(db, 'bookings', 'smartPriceBreakdown', 'TEXT');
    await addColumnIfNotExists(db, 'bookings', 'groupBookingId', 'INTEGER');

    await addColumnIfNotExists(db, 'tailors', 'trustScore', 'INTEGER DEFAULT 50');
    await addColumnIfNotExists(db, 'tailors', 'videoPortfolio', 'TEXT');
    await addColumnIfNotExists(db, 'tailors', 'yearsExperience', 'INTEGER');
    await addColumnIfNotExists(db, 'tailors', 'topRatedBadge', 'BOOLEAN DEFAULT 0');

    await addColumnIfNotExists(db, 'reviews', 'helpfulCount', 'INTEGER DEFAULT 0');
    await addColumnIfNotExists(db, 'reviews', 'topReview', 'BOOLEAN DEFAULT 0');
    await addColumnIfNotExists(db, 'reviews', 'fraudFlags', 'TEXT');

    await addColumnIfNotExists(db, 'deliveryPartners', 'trustScore', 'INTEGER DEFAULT 50');
    await addColumnIfNotExists(db, 'deliveryPartners', 'completedDeliveries', 'INTEGER DEFAULT 0');
    await addColumnIfNotExists(db, 'deliveryPartners', 'onTimePercentage', 'REAL DEFAULT 100.0');

    await addColumnIfNotExists(db, 'shipments', 'assignmentScore', 'REAL');
    await addColumnIfNotExists(db, 'shipments', 'isEmergency', 'BOOLEAN DEFAULT 0');

    // Phase 1: Create new tables
    await createTableIfNotExists(db, 'ai_predictions', `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bookingId INTEGER,
      imageUrl TEXT NOT NULL,
      damageTypes TEXT NOT NULL,
      severity TEXT NOT NULL,
      garmentType TEXT NOT NULL,
      confidence REAL NOT NULL,
      recommendations TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(bookingId) REFERENCES bookings(id)
    `);

    await createTableIfNotExists(db, 'trust_scores', `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      score INTEGER DEFAULT 50,
      completedBookings INTEGER DEFAULT 0,
      cancelledBookings INTEGER DEFAULT 0,
      flaggedActivities INTEGER DEFAULT 0,
      lastCalculated DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id)
    `);

    await createTableIfNotExists(db, 'fraud_flags', `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      tailorId INTEGER,
      reviewId INTEGER,
      flagType TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      reviewedBy INTEGER,
      reviewedAt DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(tailorId) REFERENCES tailors(id),
      FOREIGN KEY(reviewId) REFERENCES reviews(id)
    `);

    await createTableIfNotExists(db, 'escrow_payments', `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bookingId INTEGER NOT NULL UNIQUE,
      stripePaymentIntentId TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'INR',
      status TEXT DEFAULT 'pending',
      authorizedAt DATETIME,
      capturedAt DATETIME,
      refundedAt DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(bookingId) REFERENCES bookings(id)
    `);

    await createTableIfNotExists(db, 'disputes', `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bookingId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      tailorId INTEGER NOT NULL,
      reason TEXT NOT NULL,
      description TEXT NOT NULL,
      evidence TEXT,
      status TEXT DEFAULT 'submitted',
      tailorResponse TEXT,
      tailorRespondedAt DATETIME,
      adminDecision TEXT,
      adminNotes TEXT,
      resolvedBy INTEGER,
      resolvedAt DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(bookingId) REFERENCES bookings(id),
      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(tailorId) REFERENCES tailors(id)
    `);

    await createTableIfNotExists(db, 'sustainability_badges', `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      badgeType TEXT NOT NULL,
      awardedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id)
    `);

    await createTableIfNotExists(db, 'community_stories', `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      bookingId INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      beforeImage TEXT NOT NULL,
      afterImage TEXT NOT NULL,
      likes INTEGER DEFAULT 0,
      featured BOOLEAN DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(bookingId) REFERENCES bookings(id)
    `);

    await createTableIfNotExists(db, 'story_likes', `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      storyId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(storyId, userId),
      FOREIGN KEY(storyId) REFERENCES community_stories(id),
      FOREIGN KEY(userId) REFERENCES users(id)
    `);

    await createTableIfNotExists(db, 'tailor_skills', `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tailorId INTEGER NOT NULL,
      skillType TEXT NOT NULL,
      videoUrl TEXT,
      certificateUrl TEXT,
      verified BOOLEAN DEFAULT 0,
      verifiedBy INTEGER,
      verifiedAt DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(tailorId) REFERENCES tailors(id)
    `);

    await createTableIfNotExists(db, 'maintenance_alerts', `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      predictionId INTEGER NOT NULL,
      issueType TEXT NOT NULL,
      probability REAL NOT NULL,
      estimatedMonths INTEGER,
      recommendation TEXT,
      dismissed BOOLEAN DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(predictionId) REFERENCES ai_predictions(id)
    `);

    await createTableIfNotExists(db, 'group_bookings', `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      tailorId INTEGER NOT NULL,
      garmentCount INTEGER NOT NULL,
      totalPrice REAL NOT NULL,
      discountPercentage REAL NOT NULL,
      discountAmount REAL NOT NULL,
      sharedAddress TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(tailorId) REFERENCES tailors(id)
    `);

    await createTableIfNotExists(db, 'group_booking_items', `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      groupBookingId INTEGER NOT NULL,
      bookingId INTEGER NOT NULL,
      FOREIGN KEY(groupBookingId) REFERENCES group_bookings(id),
      FOREIGN KEY(bookingId) REFERENCES bookings(id)
    `);

    await createTableIfNotExists(db, 'abuse_reports', `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reporterId INTEGER NOT NULL,
      reportedUserId INTEGER NOT NULL,
      reason TEXT NOT NULL,
      description TEXT NOT NULL,
      evidence TEXT,
      status TEXT DEFAULT 'pending',
      reviewedBy INTEGER,
      reviewedAt DATETIME,
      action TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(reporterId) REFERENCES users(id),
      FOREIGN KEY(reportedUserId) REFERENCES users(id)
    `);

    await createTableIfNotExists(db, 'ai_conversations', `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      prompt TEXT NOT NULL,
      response TEXT NOT NULL,
      provider TEXT NOT NULL,
      sentiment TEXT,
      intent TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id)
    `);

    // Create indexes for performance
    await createIndexIfNotExists(db, 'idx_ai_predictions_booking', 'ai_predictions', 'bookingId');
    await createIndexIfNotExists(db, 'idx_trust_scores_user', 'trust_scores', 'userId');
    await createIndexIfNotExists(db, 'idx_fraud_flags_user', 'fraud_flags', 'userId');
    await createIndexIfNotExists(db, 'idx_fraud_flags_status', 'fraud_flags', 'status');
    await createIndexIfNotExists(db, 'idx_escrow_payments_booking', 'escrow_payments', 'bookingId');
    await createIndexIfNotExists(db, 'idx_escrow_payments_status', 'escrow_payments', 'status');
    await createIndexIfNotExists(db, 'idx_disputes_booking', 'disputes', 'bookingId');
    await createIndexIfNotExists(db, 'idx_disputes_status', 'disputes', 'status');
    await createIndexIfNotExists(db, 'idx_community_stories_user', 'community_stories', 'userId');
    await createIndexIfNotExists(db, 'idx_community_stories_featured', 'community_stories', 'featured');
    await createIndexIfNotExists(db, 'idx_story_likes_story', 'story_likes', 'storyId');
    await createIndexIfNotExists(db, 'idx_maintenance_alerts_user', 'maintenance_alerts', 'userId');
    await createIndexIfNotExists(db, 'idx_maintenance_alerts_dismissed', 'maintenance_alerts', 'dismissed');
    await createIndexIfNotExists(db, 'idx_group_bookings_user', 'group_bookings', 'userId');
    await createIndexIfNotExists(db, 'idx_abuse_reports_status', 'abuse_reports', 'status');
    await createIndexIfNotExists(db, 'idx_ai_conversations_user', 'ai_conversations', 'userId');

    console.log('✓ All migrations completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
  }
}

/**
 * Add a column to a table if it doesn't exist
 */
function addColumnIfNotExists(db, tableName, columnName, columnType) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${tableName})`, (err, cols) => {
      if (err) {
        console.error(`Error checking ${tableName} columns:`, err);
        return reject(err);
      }

      const columnExists = cols && cols.some(col => col.name === columnName);

      if (!columnExists) {
        const sql = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}`;
        db.run(sql, (err) => {
          if (err) {
            console.error(`Error adding ${columnName} to ${tableName}:`, err);
            return reject(err);
          }
          console.log(`✓ Added column ${columnName} to ${tableName}`);
          resolve();
        });
      } else {
        resolve();
      }
    });
  });
}

module.exports = { runMigrations };

/**
 * Create a table if it doesn't exist
 */
function createTableIfNotExists(db, tableName, schema) {
  return new Promise((resolve, reject) => {
    const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (${schema})`;
    db.run(sql, (err) => {
      if (err) {
        console.error(`Error creating ${tableName}:`, err);
        return reject(err);
      }
      console.log(`✓ Table ${tableName} ready`);
      resolve();
    });
  });
}

/**
 * Create an index if it doesn't exist
 */
function createIndexIfNotExists(db, indexName, tableName, columnName) {
  return new Promise((resolve, reject) => {
    const sql = `CREATE INDEX IF NOT EXISTS ${indexName} ON ${tableName}(${columnName})`;
    db.run(sql, (err) => {
      if (err) {
        console.error(`Error creating index ${indexName}:`, err);
        return reject(err);
      }
      console.log(`✓ Index ${indexName} ready`);
      resolve();
    });
  });
}
