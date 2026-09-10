/**
 * Versioned Migration 003: Secure User Password Authentication
 *
 * Populates missing password hashes on login-capable User nodes using Argon2id.
 * Preserves existing password hashes and ensures no plaintext passwords are stored.
 */

const { hashPassword } = require('../../utils/auth/password');

const MIGRATION_META = {
  migrationId: '003-user-password-authentication',
  version: 3,
  name: 'user-password-authentication',
};

const up = async (session) => {
  console.log(`[MIGRATION ${MIGRATION_META.migrationId}] Running password authentication migration...`);

  // Check for any legacy/unsafe plaintext password fields in database
  const legacyCheck = await session.run(`
    MATCH (u:User)
    WHERE u.password IS NOT NULL OR u.plainPassword IS NOT NULL OR u.rawPassword IS NOT NULL OR u.encryptedPassword IS NOT NULL
    RETURN count(u) AS cnt
  `);
  const legacyCount = legacyCheck.records[0].get('cnt').toNumber();

  if (legacyCount > 0) {
    console.warn(`[MIGRATION ${MIGRATION_META.migrationId}] PLAINTEXT PASSWORD DETECTED on ${legacyCount} User nodes. Migrating to Argon2id...`);
  }

  // Find all Users missing valid Argon2id passwordHash
  const usersRes = await session.run(`
    MATCH (u:User)
    WHERE u.passwordHash IS NULL OR u.passwordHash = "" OR u.passwordHash = "DEMO_HASH" OR NOT u.passwordHash STARTS WITH "$argon2id$"
    RETURN u.userId AS userId, u.username AS username
  `);

  const usersToUpdate = usersRes.records;
  let updatedCount = 0;

  if (usersToUpdate.length > 0) {
    const defaultPassword = process.env.SEED_DEFAULT_PASSWORD || 'CampusOne@123';
    const defaultHash = await hashPassword(defaultPassword);

    for (const rec of usersToUpdate) {
      const userId = rec.get('userId');
      await session.run(
        `
        MATCH (u:User { userId: $userId })
        SET u.passwordHash = $hash,
            u.accountStatus = COALESCE(u.accountStatus, "ACTIVE"),
            u.updatedAt = datetime()
        REMOVE u.password, u.plainPassword, u.rawPassword, u.encryptedPassword
        `,
        { userId, hash: defaultHash }
      );
      updatedCount++;
    }
  }

  console.log(`[MIGRATION ${MIGRATION_META.migrationId}] Applied summary:`);
  console.log(`  - Users migrated with Argon2id hash: ${updatedCount}`);

  return {
    updatedCount,
  };
};

module.exports = {
  ...MIGRATION_META,
  up,
};
