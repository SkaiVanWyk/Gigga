# Gigga Paid Registration System Guide

## Overview
This document explains the paid registration system for Gigga, where users must pay a registration fee before their account is activated. The system supports both paid plans and free trials.

## System Architecture

### 1. Database Schema

#### Profiles Table Enhancements
- `account_status` - Account status: pending, active, suspended, cancelled
- `registration_payment_id` - Reference to payment record
- `registration_amount` - Amount paid for registration
- `registration_payment_date` - When payment was made
- `registration_payment_method` - Payment method used
- `registration_fee_paid` - Boolean flag for payment completion
- `trial_start_date` - Trial period start date
- `trial_end_date` - Trial period end date

#### Registration Payments Table
- Tracks all registration payments
- Links to both auth.users and profiles
- Supports multiple payment gateways
- Stores payment status and gateway responses

#### Pricing Table
- Configurable pricing plans for students and businesses
- Supports free trial, basic, and premium plans
- Flexible feature lists per plan
- Active/inactive plan management

### 2. Registration Flow

#### Step 1: Account Creation
- User enters email and password
- System validates email uniqueness
- User proceeds to profile details

#### Step 2: Profile Information
- Students: Personal details, education, skills
- Businesses: Company details, industry, description
- System validates required fields
- User proceeds to plan selection

#### Step 3: Plan Selection & Payment
- User selects from available plans:
  - Free Trial (7 days, no payment)
  - Basic (30 days, paid)
  - Premium (90 days, paid)
- If paid plan: User selects payment method
- System initiates payment gateway redirect
- Account activated only after successful payment

### 3. Payment Integration

#### Supported Payment Methods
- PayFast (Credit/Debit Card, EFT)
- Ozow (Instant EFT)
- Future: Yoco, SnapScan

#### Payment Flow
1. User selects plan and payment method
2. System creates pending payment record
3. User redirected to payment gateway
4. Gateway processes payment
5. Webhook callback updates payment status
6. Database trigger activates account
7. User receives confirmation

### 4. Account Activation

#### Automatic Activation
- Database trigger monitors payment status
- When payment_status = 'completed':
  - Sets account_status = 'active'
  - Updates registration payment details
  - Sets trial dates if applicable
  - Sends notification to user

#### Trial Activation
- Free trial accounts activated immediately
- Trial period: 7 days
- Trial end date calculated automatically
- User notified before trial expiration

## Pricing Structure

### Student Plans
- **Free Trial**: R0.00 - 7 days
  - Apply for up to 5 jobs
  - Basic profile features
  - 7 days full access

- **Basic**: R99.00 - 30 days
  - Unlimited job applications
  - Full profile features
  - Priority support
  - 30 days access

- **Premium**: R249.00 - 90 days
  - Unlimited job applications
  - Premium profile features
  - Priority job matching
  - Dedicated support
  - 90 days access

### Business Plans
- **Free Trial**: R0.00 - 7 days
  - Post up to 3 jobs
  - Basic applicant management
  - 7 days full access

- **Basic**: R199.00 - 30 days
  - Unlimited job postings
  - Full applicant management
  - Advanced search filters
  - 30 days access

- **Premium**: R499.00 - 90 days
  - Unlimited job postings
  - Premium applicant management
  - AI-powered matching
  - Dedicated account manager
  - 90 days access

## Security Considerations

### 1. Payment Security
- All payment processing handled by trusted gateways
- No payment details stored in database
- Encrypted communication with payment providers
- Webhook signature verification

### 2. Account Security
- Account status checked before allowing access
- Pending accounts cannot access platform features
- Trial accounts have limited functionality
- Automatic account suspension on payment failure

### 3. Data Protection
- POPIA compliance for South African users
- Secure storage of payment references only
- Regular database backups
- Audit trail for all payment transactions

## Implementation Steps

### Phase 1: Database Setup
1. Run `paid-registration-schema.sql` in Supabase SQL Editor
2. Verify table creation and column additions
3. Test RLS policies
4. Verify pricing data insertion

### Phase 2: Frontend Integration
1. Update registration HTML files to include pricing plans
2. Add payment selection UI
3. Integrate new registration JavaScript files
4. Add payment gateway redirect logic
5. Test registration flow end-to-end

### Phase 3: Payment Gateway Setup
1. Sign up for PayFast and Ozow accounts
2. Configure webhook endpoints
3. Implement payment callback handling
4. Test payment processing in sandbox
5. Go live with production credentials

### Phase 4: Testing
1. Test free trial registration
2. Test paid registration with each gateway
3. Test payment failure scenarios
4. Test account activation triggers
5. Test trial expiration logic

## User Experience

### Registration Process
1. User lands on registration page
2. Sees clear pricing options with features
3. Selects plan (free trial highlighted)
4. Completes account and profile details
5. If paid: Selects payment method and completes payment
6. Account activated immediately after payment
7. Redirected to login with success message

### Payment Experience
1. Clear payment method selection
2. Payment amount and plan summary displayed
3. Redirect to trusted payment gateway
4. Seamless return to platform after payment
5. Immediate account activation
6. Confirmation email sent

### Trial Experience
1. No payment required for trial
2. Full platform access for 7 days
3. Clear trial expiration countdown
4. Upgrade prompts before trial ends
5. Smooth transition to paid plans

## Monitoring and Maintenance

### Key Metrics to Track
- Registration conversion rate
- Payment success rate
- Trial to paid conversion rate
- Revenue per user
- Churn rate
- Payment gateway performance

### Regular Maintenance Tasks
- Monitor payment gateway status
- Review failed payment transactions
- Update pricing as needed
- Review trial conversion rates
- Audit account statuses
- Update payment gateway credentials

### Troubleshooting

#### Common Issues
1. **Payment not processing**
   - Check gateway status
   - Verify webhook configuration
   - Review payment logs

2. **Account not activating**
   - Check database trigger status
   - Verify payment status
   - Review RLS policies

3. **Trial not working**
   - Check trial date calculations
   - Verify account status
   - Review trigger logic

## Future Enhancements

### Phase 2 Features
- **Subscription management** - Auto-renewal options
- **Promo codes** - Discount codes for special offers
- **Referral program** - Credits for referring users
- **Multi-user accounts** - Business team accounts
- **Invoice generation** - Automatic invoice creation

### Advanced Features
- **Usage analytics** - Track feature usage
- **Dynamic pricing** - Tiered pricing based on usage
- **Payment plans** - Monthly/annual payment options
- **Enterprise features** - Custom plans for large businesses
- **Integration with accounting software** - QuickBooks, Xero

## Compliance and Legal

### South African Regulations
- **POPIA** - Protection of Personal Information Act compliance
- **Consumer Protection Act** - Fair business practices
- **Electronic Communications Act** - Electronic transaction regulations
- **Tax compliance** - VAT registration and reporting

### Required Documentation
- Terms of Service
- Privacy Policy
- Refund Policy
- Payment Terms
- Data Processing Agreement

## Support Resources

### Payment Gateway Support
- PayFast: support@payfast.co.za | 087 470 0000
- Ozow: support@ozow.com | 087 231 0000

### Technical Support
- Database issues: Check Supabase logs
- Payment issues: Review gateway dashboard
- Account issues: Check account status in database

## Conclusion

The paid registration system provides a solid foundation for monetizing the Gigga platform while offering flexibility through free trials and multiple pricing tiers. The system is designed to be secure, user-friendly, and compliant with South African regulations. Regular monitoring and maintenance will ensure optimal performance and user satisfaction.
