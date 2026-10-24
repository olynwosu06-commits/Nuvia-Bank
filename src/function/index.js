const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Termii = require("termii-nodejs");

admin.initializeApp();

const termii = new Termii(process.env.TERMII_API_KEY);

exports.sendSMS = functions.https.onCall(async (data, context) => {
  const { phone, message } = data;

  if (!phone || !message) {
    throw new functions.https.HttpsError('invalid-argument', 'Phone and message are required');
  }

  try {
    const response = await termii.sendSMS({
      to: phone,
      from: "NuviaBank",
      sms: message,
      type: "plain",
      channel: "generic"
    });

    console.log("SMS Sent:", response);
    return { success: true };
  } catch (error) {
    console.error("Termii Error:", error);
    throw new functions.https.HttpsError('internal', 'Failed to send SMS');
  }
});