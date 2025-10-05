# SecureFinance Backend

## Running the Server

### Option 1: Basic Start (Recommended for development)
```bash
npm start
# or
node server.js
```

### Option 2: Monitored Start (Recommended for production)
```bash
npm run monitor
# or
node monitor.js
```

The monitor will automatically restart the server if it crashes and provides better logging.

## Health Check

Once the server is running, you can check its health at:
- http://localhost:3002/api/health
- http://10.120.178.172:3002/api/health

## Features

- ✅ Automatic server restart on crashes
- ✅ Database connection monitoring and auto-reconnection
- ✅ Email system with connection pooling
- ✅ Comprehensive health monitoring
- ✅ Detailed logging and error handling

## Troubleshooting

### Server keeps stopping:
- Use `npm run monitor` instead of `npm start`
- Check the logs for error messages
- Ensure MongoDB is running
- Check environment variables in `.env` file

### Email not working:
- Check email credentials in `.env` file
- Verify Gmail app password is correct
- Check server logs for email transporter errors

### Database connection issues:
- Server will continue running in offline mode
- Check MongoDB connection string
- Server will retry connection every 30 seconds