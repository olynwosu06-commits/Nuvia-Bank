const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();

// Resolve Account Name using Paystack
exports.resolveAccount = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in');
  }

  const { accountNumber, bankCode } = data;

  if (!accountNumber || !bankCode) {
    throw new functions.https.HttpsError('invalid-argument', 'Account number and bank code are required');
  }

  try {
    const response = await axios.get(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        headers: {
          Authorization: `Bearer ${functions.config().paystack.secret_key}`
        }
      }
    );

    if (response.data.status) {
      return {
        success: true,
        accountName: response.data.data.account_name,
        accountNumber: accountNumber,
        bankCode: bankCode
      };
    } else {
      throw new functions.https.HttpsError('not-found', 'Could not resolve account');
    }
  } catch (error) {
    console.error("Paystack resolve error:", error.response?.data || error.message);
    throw new functions.https.HttpsError('failed-precondition', 
      error.response?.data?.message || 'Failed to verify account number');
  }
});