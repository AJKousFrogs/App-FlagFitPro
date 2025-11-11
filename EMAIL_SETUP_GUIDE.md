# 📧 Email Service Setup Guide

## 🚀 **Email Service is Now Working!**

The email functionality has been implemented and is ready to use. Here's how to set it up:

---

## ⚡ **Quick Setup (Gmail)**

1. **Create Gmail App Password**:
   - Go to [Google Account Settings](https://myaccount.google.com/)
   - Security → 2-Step Verification → App Passwords
   - Generate app password for "Mail"

2. **Create `.env` file** (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

3. **Add your Gmail credentials** to `.env`:
   ```env
   GMAIL_EMAIL=your.email@gmail.com
   GMAIL_APP_PASSWORD=your_16_character_app_password
   FROM_EMAIL=noreply@flagfitpro.com
   APP_URL=http://localhost:4000
   ```

4. **Restart your dev server**:
   ```bash
   npm run dev:hot
   ```

---

## 📧 **Available Email Services**

### **1. Gmail SMTP (Recommended for Development)**
```env
GMAIL_EMAIL=your.email@gmail.com
GMAIL_APP_PASSWORD=abcd_efgh_ijkl_mnop  # 16-character app password
```

### **2. SendGrid (Recommended for Production)**
```env
SENDGRID_API_KEY=SG.your_api_key_here
SENDGRID_FROM_EMAIL=noreply@flagfitpro.com
```

### **3. Generic SMTP**
```env
SMTP_HOST=mail.your-domain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your.email@your-domain.com
SMTP_PASS=your_password
```

---

## 🔧 **Features Implemented**

### **✅ Password Reset**
- **Email Templates**: Beautiful HTML + plain text
- **Security**: 1-hour expiration, single-use tokens
- **User Experience**: Real-time validation + feedback

### **✅ Welcome Emails**
- **Professional Design**: Branded templates
- **Feature Highlights**: Shows app capabilities
- **Call to Action**: Direct link to dashboard

### **✅ Email Verification**
- **Token Generation**: Cryptographically secure
- **Validation**: Server-side verification
- **Error Handling**: Graceful fallbacks

---

## 🧪 **Testing Email Functionality**

### **Test Password Reset**
1. Go to: http://localhost:4000/reset-password.html
2. Enter your email address
3. Check your inbox for reset email
4. Click link to set new password

### **Check Email Service Status**
The reset password page automatically detects if email service is configured:
- ✅ **Green box**: Email service active
- ⚠️ **Blue box**: Demo mode (no email configured)

### **Debug Email Issues**
Check browser console for email service status:
```javascript
// In browser console
console.log('Email service status:', window.emailServiceActive);
```

---

## 🎨 **Email Templates Preview**

### **Password Reset Email**
- 📱 **Mobile Responsive**: Works on all devices
- 🎨 **Professional Design**: FlagFit Pro branding
- 🔒 **Security Notice**: Clear expiration and usage info
- 🔗 **One-Click Action**: Large, prominent reset button

### **Welcome Email**
- 🏈 **App Features**: Performance tracking, training programs
- 🚀 **Get Started**: Direct dashboard link
- 📊 **Value Proposition**: Clear benefits explanation

---

## 🔧 **Configuration Options**

### **Environment Variables**
```env
# Required for any email service
FROM_EMAIL=noreply@flagfitpro.com
APP_URL=http://localhost:4000

# Gmail Configuration
GMAIL_EMAIL=your.email@gmail.com
GMAIL_APP_PASSWORD=your_app_password

# SendGrid Configuration  
SENDGRID_API_KEY=your_api_key
SENDGRID_FROM_EMAIL=noreply@flagfitpro.com

# Generic SMTP
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your.email@domain.com
SMTP_PASS=your_password
```

---

## 🚨 **Troubleshooting**

### **Email Not Sending**
1. **Check Environment Variables**: Ensure `.env` file exists with correct credentials
2. **Gmail Issues**: Use app password, not regular password
3. **Network Issues**: Check firewall/proxy settings
4. **Rate Limits**: Gmail has daily sending limits

### **Reset Link Not Working**
1. **Token Expiration**: Links expire after 1 hour
2. **Already Used**: Tokens are single-use only
3. **Invalid Format**: Check URL format in email

### **Email in Spam**
1. **Add to Contacts**: Add sender to email contacts
2. **Check Spam Folder**: Reset emails might be filtered
3. **Domain Authentication**: Configure SPF/DKIM for production

---

## 📈 **Production Deployment**

### **Recommended Setup**
1. **Use SendGrid**: More reliable for production
2. **Configure Domain**: Set up custom sending domain
3. **Monitor Delivery**: Track email analytics
4. **Rate Limiting**: Implement sending limits

### **Security Best Practices**
- ✅ **Environment Variables**: Never commit credentials
- ✅ **Token Expiration**: 1-hour maximum
- ✅ **Single Use Tokens**: Prevent replay attacks
- ✅ **Rate Limiting**: Prevent abuse

---

## 🎯 **Next Steps**

1. **Set up your preferred email service** (Gmail recommended for testing)
2. **Test password reset flow** 
3. **Customize email templates** if needed
4. **Configure production email service** for deployment

---

**📧 Email service is production-ready!** 
Configure your credentials and start sending professional emails immediately.