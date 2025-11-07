const validator = require("validator");

// ----------------------
// 📋 VALIDATION REGEX
// ----------------------
const nameRegex = /^[a-zA-Z\s]{2,50}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const swiftCodeRegex = /^[A-Z0-9]{8,11}$/;
const amountRegex = /^\d+(\.\d{1,2})?$/;
const statusRegex = /^(pending|approved|rejected)$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
const roleRegex = /^(customer|employee|admin)$/;

// ----------------------
// 🧼 SANITIZATION HELPER
// ----------------------
/**
 * Sanitize input to prevent XSS attacks
 */
const sanitizeInput = (input) => {
  if (typeof input === "string") {
    return validator.escape(input.trim());
  }
  return input;
};

// ----------------------
// ✅ USER VALIDATION
// ----------------------
/**
 * Validate user input for registration/update
 * Used in: POST /api/auth/register, PUT /api/auth/update/:id
 */
const validateUserInput = (req, res, next) => {
  console.log('🔍 Validation Middleware - Raw input:', {
    name: req.body.name,
    email: req.body.email,
    password: req.body.password ? '***PROVIDED***' : 'MISSING',
    role: req.body.role
  });

  let { name, email, password, role } = req.body;

  // Sanitize inputs
  if (name) {
    const originalName = name;
    name = sanitizeInput(name);
    console.log('🧼 Name sanitized:', originalName, '->', name);
  }
  
  if (email) {
    const originalEmail = email;
    email = sanitizeInput(email);
    console.log('🧼 Email sanitized:', originalEmail, '->', email);
  }
  
  if (password) {
    password = password.trim(); // Don't escape passwords
    console.log('🧼 Password trimmed (length):', password.length);
  }

  // Validate name
  if (name && !nameRegex.test(name)) {
    console.log('❌ Name validation failed:', name);
    return res.status(400).json({ 
      message: "Invalid name format (2-50 letters and spaces only)" 
    });
  }

  // Validate email
  if (email && !emailRegex.test(email)) {
    console.log('❌ Email validation failed:', email);
    return res.status(400).json({ 
      message: "Invalid email format" 
    });
  }

  // Validate password
  if (password && !passwordRegex.test(password)) {
    console.log('❌ Password validation failed');
    console.log('Password requirements:');
    console.log('  - Length >= 8:', password.length >= 8);
    console.log('  - Has lowercase:', /[a-z]/.test(password));
    console.log('  - Has uppercase:', /[A-Z]/.test(password));
    console.log('  - Has digit:', /\d/.test(password));
    console.log('  - Has special char:', /[@$!%*?&]/.test(password));
    
    return res.status(400).json({
      message: "Password must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&)",
    });
  }

  // Validate role
  if (role && !roleRegex.test(role)) {
    console.log('❌ Role validation failed:', role);
    return res.status(400).json({ 
      message: "Invalid role. Must be 'customer', 'employee', or 'admin'" 
    });
  }

  // Update sanitized values
  req.body.name = name;
  req.body.email = email;
  req.body.password = password;

  console.log('✅ Validation passed, proceeding to controller');
  next();
};

// ----------------------
// ✅ TRANSACTION VALIDATION
// ----------------------
/**
 * Validate transaction input for creation
 * Used in: POST /api/transactions
 */
const validateTransactionInput = (req, res, next) => {
  let { swiftCode, amount, recipientName, recipientBank, description, paymentMethod } = req.body;

  // Sanitize inputs
  if (swiftCode) swiftCode = sanitizeInput(swiftCode);
  if (amount) amount = sanitizeInput(amount);
  if (recipientName) recipientName = sanitizeInput(recipientName);
  if (recipientBank) recipientBank = sanitizeInput(recipientBank);
  if (description) description = sanitizeInput(description);
  if (paymentMethod) paymentMethod = sanitizeInput(paymentMethod);

  const errors = [];

  // Validate SWIFT code
  if (!swiftCode || !swiftCodeRegex.test(swiftCode)) {
    errors.push("Invalid SWIFT code format (8-11 uppercase alphanumeric)");
  }

  // Validate amount
  if (!amount || !amountRegex.test(amount)) {
    errors.push("Invalid amount format (positive number with max 2 decimals)");
  } else {
    const amountValue = parseFloat(amount);
    if (amountValue <= 0) {
      errors.push("Amount must be greater than 0");
    }
  }

  // Validate recipient name (optional but if provided must be valid)
  if (recipientName && !nameRegex.test(recipientName)) {
    errors.push("Invalid recipient name format");
  }

  // Validate payment method
  const validPaymentMethods = ["credit_card", "debit_card", "bank_transfer", "paypal"];
  if (paymentMethod && !validPaymentMethods.includes(paymentMethod)) {
    errors.push(`Invalid payment method. Must be one of: ${validPaymentMethods.join(", ")}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      message: "Transaction validation failed", 
      errors 
    });
  }

  // Update sanitized values
  req.body.swiftCode = swiftCode;
  req.body.amount = parseFloat(amount);
  req.body.recipientName = recipientName;
  req.body.recipientBank = recipientBank;
  req.body.description = description;
  req.body.paymentMethod = paymentMethod || "bank_transfer";

  next();
};

// ----------------------
// ✅ STATUS VALIDATION
// ----------------------
/**
 * Validate transaction status update
 * Used in: PATCH /api/employees/transactions/:id/status
 */
const validateStatusInput = (req, res, next) => {
  let { status } = req.body;

  if (!status) {
    return res.status(400).json({ 
      message: "Status is required" 
    });
  }

  status = sanitizeInput(status).toLowerCase();

  if (!statusRegex.test(status)) {
    return res.status(400).json({ 
      message: "Invalid status. Must be 'pending', 'approved', or 'rejected'" 
    });
  }

  req.body.status = status;
  next();
};

// ----------------------
// ✅ LOGIN VALIDATION
// ----------------------
/**
 * Validate login credentials
 * Used in: POST /api/auth/login
 */
const validateLoginInput = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ 
      message: "Email and password are required" 
    });
  }

  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      message: "Invalid email format" 
    });
  }

  next();
};

// ----------------------
// 📦 EXPORT ALL VALIDATORS
// ----------------------
module.exports = {
  validateUserInput,
  validateTransactionInput,
  validateStatusInput,
  validateLoginInput,
  sanitizeInput,
};