const crypto = require('crypto');

// Generate a 6-digit OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Generate OTP expiry time (10 minutes from now)
const generateOTPExpiry = () => {
  return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
};

// Verify OTP
const verifyOTP = (userOTP, storedOTP, expiryTime) => {
  console.log('OTP Verification Debug:');
  console.log('- User OTP:', userOTP, 'Type:', typeof userOTP, 'Length:', userOTP?.length);
  console.log('- Stored OTP:', storedOTP, 'Type:', typeof storedOTP, 'Length:', storedOTP?.length);
  console.log('- Expiry Time:', expiryTime, 'Type:', typeof expiryTime);
  console.log('- Current Time:', new Date());

  if (!storedOTP || !expiryTime) {
    console.log('❌ OTP verification failed: OTP not found or expired');
    return { valid: false, message: 'OTP not found or expired' };
  }

  if (new Date() > new Date(expiryTime)) {
    console.log('❌ OTP verification failed: OTP has expired');
    return { valid: false, message: 'OTP has expired' };
  }

  // Trim whitespace and ensure both are strings for comparison
  const cleanUserOTP = String(userOTP).trim();
  const cleanStoredOTP = String(storedOTP).trim();

  console.log('- Clean User OTP:', cleanUserOTP);
  console.log('- Clean Stored OTP:', cleanStoredOTP);
  console.log('- OTPs match:', cleanUserOTP === cleanStoredOTP);

  if (cleanUserOTP !== cleanStoredOTP) {
    console.log('❌ OTP verification failed: Invalid OTP');
    return { valid: false, message: 'Invalid OTP. Please check and try again.' };
  }

  console.log('✅ OTP verification successful');
  return { valid: true, message: 'OTP verified successfully' };
};

// Clear OTP after successful verification
const clearOTP = async (user) => {
  user.otp = undefined;
  user.otpExpires = undefined;
  user.otpVerified = true;
  await user.save();
};

module.exports = {
  generateOTP,
  generateOTPExpiry,
  verifyOTP,
  clearOTP
};