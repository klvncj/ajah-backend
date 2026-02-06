const mongoose = require("mongoose");

/**
 * Executes a function within a MongoDB ACID transaction.
 * @param {Function} callback - Async function that is passed the session.
 * @param {Object} options - Transaction options.
 */
async function withTransaction(callback, options = {}) {
    const session = await mongoose.startSession();
    session.startTransaction(options);

    try {
        const result = await callback(session);
        await session.commitTransaction();
        return result;
    } catch (error) {
        await session.abortTransaction();
        console.error("Transaction aborted due to error:", error);
        throw error;
    } finally {
        session.endSession();
    }
}

module.exports = { withTransaction };
