console.log('Testing imports...');

try {
  const authController = require('./src/controllers/authController');
  console.log('AuthController methods:', Object.keys(authController));
  
  if (typeof authController.getProfile === 'function') {
    console.log('✅ getProfile is a function');
  } else {
    console.log('❌ getProfile is not a function:', typeof authController.getProfile);
  }
  
  if (typeof authController.updateProfile === 'function') {
    console.log('✅ updateProfile is a function');
  } else {
    console.log('❌ updateProfile is not a function:', typeof authController.updateProfile);
  }
  
} catch (error) {
  console.log('❌ Import failed:', error.message);
}