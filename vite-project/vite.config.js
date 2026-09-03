import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import nodemailer from 'nodemailer'

const localApiPlugin = () => ({
  name: 'local-api-plugin',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url.startsWith('/api/auth/send-otp') || 
          req.url.startsWith('/api/auth/verify-otp') || 
          req.url.startsWith('/api/auth/send-mobile-otp') || 
          req.url.startsWith('/api/auth/verify-mobile-otp') || 
          req.url.startsWith('/api/auth/request-reset')) {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
          try {
            const data = body ? JSON.parse(body) : {};
            res.setHeader('Content-Type', 'application/json');

            if (req.url === '/api/auth/send-otp' || req.url === '/api/auth/request-reset') {
              const email = data.email || data.identifier;
              if (email && email.includes('@')) {
                const transporter = nodemailer.createTransport({
                  service: 'gmail',
                  auth: { user: 'muzammilshaik826@gmail.com', pass: 'gfge zbjv zlsx ouhx' }
                });
                const otp = Math.floor(100000 + Math.random() * 900000).toString();
                const mailOptions = {
                  from: 'muzammilshaik826@gmail.com',
                  to: email,
                  subject: req.url.includes('reset') ? 'Password Reset Request' : 'Your Verification Code',
                  html: req.url.includes('reset') 
                    ? `<h1>Password Reset</h1><a href="http://localhost:5173/customer/login">Reset Password</a>`
                    : `<h1>Verification Code</h1><p>Your code is: <strong>${otp}</strong></p>`
                };
                await transporter.sendMail(mailOptions);
              }
              res.end(JSON.stringify({ success: true, message: 'Sent successfully.' }));
            } 
            else if (req.url === '/api/auth/send-mobile-otp') {
              // Simulate SMS success (autofilled in frontend)
              res.end(JSON.stringify({ success: true, message: 'Mobile OTP sent.' }));
            }
            else if (req.url === '/api/auth/verify-otp' || req.url === '/api/auth/verify-mobile-otp') {
              res.end(JSON.stringify({
                success: true,
                user: { id: 'usr_mock', name: 'User', email: data.email, mobile: data.mobile, role: 'customer' }
              }));
            } else {
              res.statusCode = 404;
              res.end(JSON.stringify({ success: false, message: 'Not found' }));
            }
          } catch (e) {
            console.error('Local API Error:', e);
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, message: e.message }));
          }
        });
      } else {
        next();
      }
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), localApiPlugin()],
  server: {
    proxy: {
      '/aws-api': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/aws-api/, '/api')
      },
    },
  },
})
