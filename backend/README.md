# Chat Finance Backend

A Node.js backend for the Chat-based Finance application with BHIM UPI integration.

## Features

- User authentication and authorization
- Group management and chat functionality
- Expense tracking and split bill management
- **BHIM UPI Payment Integration** for Indian users
- Real-time notifications via Socket.io

## BHIM UPI Integration

This backend includes comprehensive BHIM (Bharat Interface for Money) UPI integration for processing digital payments in India.

### Supported UPI Apps
- PhonePe
- Paytm
- Google Pay
- Amazon Pay
- BHIM
- And other UPI-enabled apps

### API Endpoints

#### Process BHIM UPI Transaction
```
POST /api/payments/bhim-upi
```
Initiates a BHIM UPI payment transaction.

**Request Body:**
```json
{
  "upiId": "merchant@ybl",
  "amount": 100.50,
  "currency": "INR",
  "description": "Split bill payment",
  "recipientId": "user_id",
  "splitBillId": "bill_id",
  "groupId": "group_id"
}
```

#### Create BHIM UPI Payment Intent
```
POST /api/payments/create-bhim-upi-intent
```
Creates a payment intent with UPI string and QR code data.

**Request Body:**
```json
{
  "amount": 50.00,
  "currency": "INR",
  "description": "Payment for services",
  "upiId": "merchant@paytm",
  "recipientId": "user_id",
  "splitBillId": "bill_id"
}
```

#### Generate UPI QR Code
```
POST /api/payments/generate-upi-qr
```
Generates a UPI payment string and QR code data for payments.

**Request Body:**
```json
{
  "amount": 25.00,
  "currency": "INR",
  "description": "Quick payment",
  "upiId": "merchant@ybl"
}
```

#### Verify Payment Status
```
GET /api/payments/bhim-upi/verify/:transactionId
```
Checks the status of a BHIM UPI transaction.

#### Refund BHIM UPI Transaction
```
POST /api/payments/bhim-upi/refund
```
Processes a refund for a BHIM UPI transaction.

**Request Body:**
```json
{
  "transactionId": "BHIM123456789",
  "amount": 50.00,
  "reason": "Customer request"
}
```

### UPI ID Format
UPI IDs follow the format: `username@bankname`
- Examples: `john@ybl`, `merchant@paytm`, `shop@oksbi`

### Environment Variables
Add these to your `.env` file:
```
BHIM_MERCHANT_CODE=BCR2DN6TZ6S6BHXV
BHIM_MERCHANT_NAME=ChatFinance
BHIM_SUPPORTED_APPS=PHONEPE,PAYTM,GPAY,AMAZONPAY,BHIM
UPI_TRANSACTION_TIMEOUT=900000
```

### Testing
Run the BHIM integration test:
```bash
node test-bhim-integration.js
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env`

3. Start the server:
```bash
npm start
```

## Development

- Run in development mode: `npm run dev`
- Run tests: `npm test`
- Lint code: `npm run lint`

## API Documentation

The API uses RESTful endpoints with JSON responses. All payment endpoints require authentication via JWT token.

### Response Format
```json
{
  "status": "success|error",
  "message": "Response message",
  "data": { ... }
}
```