import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

export const sendSMS = async (phone, message) => {
  if (!phone || !message) {
    console.warn("SMS skipped: Missing phone or message");
    return;
  }

  try {
    const sendSMSFunction = httpsCallable(functions, 'sendSMS');
    
    const result = await sendSMSFunction({ phone, message });
    console.log("✅ SMS Sent Successfully:", result.data);
    return result.data;
  } catch (error) {
    console.error("❌ SMS Function Error:", error);
    // Don't block the transfer if SMS fails
  }
};