# Gigga Payment Process Guide

## Overview
This document explains the complete application acceptance/rejection process with payment tracking for the Gigga platform.

## Current Implementation

### 1. Database Schema Enhancements
The following tables have been enhanced to support payment tracking:

#### Applications Table
- `payment_amount` (DECIMAL) - Amount to be paid
- `payment_status` (TEXT) - Status: unpaid, pending, paid, completed
- `payment_method` (TEXT) - Payment method used
- `payment_date` (TIMESTAMPTZ) - When payment was recorded
- `payment_notes` (TEXT) - Additional payment details

#### Jobs Table
- `filled_at` (TIMESTAMPTZ) - When job was filled
- `filled_by` (UUID) - Reference to the student who filled the job

#### Payment History Table
- Complete audit trail of all payments
- Links applications, jobs, students, and businesses
- Tracks payment status changes
- Stores transaction IDs and notes

#### Notifications Table
- Automatic notifications for application status changes
- Students get notified when accepted/rejected
- Businesses get notified when students withdraw

### 2. Application Acceptance Flow

#### For Businesses:
1. **View Applicants** - Click "View Applicants" on a job card
2. **Review Applications** - See student profiles, CVs, skills, and bios
3. **Accept with Payment** - Click "Accept" to open payment modal
4. **Enter Payment Details**:
   - Payment amount (ZAR)
   - Payment method (Cash, Bank Transfer, EFT, Other)
   - Optional notes
5. **Confirm Acceptance** - System:
   - Updates application status to "accepted"
   - Records payment details
   - Creates payment history entry
   - Sends notification to student
   - Marks job as "filled"
   - Updates job with filled timestamp and student reference

#### For Students:
1. **Apply for Jobs** - Submit applications through job listings
2. **Receive Notifications** - Get notified when application status changes
3. **View Status** - Check application status in profile
4. **Contact Business** - Arrange payment details based on acceptance

### 3. Application Rejection Flow

#### For Businesses:
1. **Click "Reject"** - Direct rejection without payment
2. **System Updates**:
   - Application status changes to "rejected"
   - Student receives notification
   - Job remains open for other applicants

#### For Students:
1. **Receive Notification** - Get notified of rejection
2. **Continue Searching** - Apply for other available jobs

## Payment Recommendations

### Best Practices for South African Context

#### 1. Payment Methods
**Recommended:**
- **EFT (Electronic Funds Transfer)** - Most common and secure
- **Bank Transfer** - Direct bank-to-bank transfers
- **Cash** - For small, in-person payments
- **Payment Gateways** - Consider integrating:
  - PayFast (popular in SA)
  - Yoco (card payments)
  - Peach Payments

**Avoid:**
- Unsecured cash payments for large amounts
- Personal checks (not commonly used in SA)

#### 2. Payment Timing
**Before Work:**
- Deposit or partial payment before starting
- Clear agreement on payment schedule
- Written confirmation of payment terms

**After Work:**
- Final payment upon completion
- Proof of work completion
- Both parties confirm satisfaction

#### 3. Payment Amount Guidelines
**Hourly Rates (ZAR):**
- Basic tasks: R50 - R100/hour
- Skilled work: R100 - R200/hour
- Professional services: R200 - R400/hour

**Fixed Rates:**
- Small tasks: R200 - R500
- Medium projects: R500 - R2,000
- Large projects: R2,000 - R10,000+

#### 4. Security Measures
**For Businesses:**
- Verify student identity before payment
- Keep records of all transactions
- Use traceable payment methods
- Get written agreement for large amounts

**For Students:**
- Confirm payment terms before starting work
- Request deposit for large projects
- Keep communication records
- Know your rights as a worker

#### 5. Dispute Resolution
**Prevention:**
- Clear written agreements
- Detailed job descriptions
- Defined deliverables and timelines
- Regular communication

**Resolution Process:**
1. Direct communication between parties
2. Platform mediation (if available)
3. Legal recourse as last resort

## Technical Implementation Details

### Database Triggers
The system uses automated triggers for:

1. **Application Status Changes** - Automatically notifies students
2. **Job Status Updates** - Marks jobs as filled when accepted
3. **Payment Recording** - Creates audit trail

### RLS Policies
- Businesses can only update their own job applications
- Students can only view their own payment history
- Payment history is accessible to both parties involved

### API Endpoints
The following operations are supported:

- `POST /applications/{id}/accept` - Accept with payment
- `POST /applications/{id}/reject` - Reject application
- `GET /payment-history` - View payment records
- `PUT /payment-history/{id}` - Update payment status

## Future Enhancements

### Recommended Features:
1. **Escrow System** - Hold payments in escrow until work completion
2. **Milestone Payments** - Break large projects into payment milestones
3. **Rating System** - Rate payment reliability and work quality
4. **Dispute Resolution** - Built-in dispute handling system
5. **Payment Reminders** - Automated payment due date reminders
6. **Invoice Generation** - Automatic invoice creation
7. **Tax Compliance** - Generate tax documents for both parties

### Integration Opportunities:
1. **Payment Gateways** - Integrate PayFast, Yoco, or Peach Payments
2. **Bank Verification** - Verify bank account details
3. **ID Verification** - Verify student identity for security
4. **Background Checks** - Optional background check service

## Security Considerations

### Data Protection:
- Encrypt sensitive payment information
- Secure payment history records
- Comply with POPIA (Protection of Personal Information Act)

### Fraud Prevention:
- Monitor for suspicious payment patterns
- Implement rate limiting on payment updates
- Require authentication for payment changes
- Log all payment-related activities

## Compliance

### Legal Requirements:
- **POPIA Compliance** - Protect personal information
- **Labor Laws** - Ensure fair compensation practices
- **Tax Regulations** - Consider tax implications for both parties
- **Consumer Protection** - Fair business practices

### Recommended Actions:
1. Consult with legal counsel about payment terms
2. Create clear terms of service for payments
3. Implement proper record-keeping
4. Consider insurance for large transactions

## Support and Maintenance

### Monitoring:
- Track payment completion rates
- Monitor dispute frequency
- Analyze payment method preferences
- Review notification delivery rates

### Maintenance:
- Regular database backups
- Update payment method options as needed
- Review and update RLS policies
- Monitor trigger performance

## Conclusion

The current implementation provides a solid foundation for payment tracking in the Gigga platform. The recommended enhancements focus on security, user experience, and compliance with South African regulations. The system is designed to be flexible and can be extended with additional payment features as the platform grows.

For questions or support, refer to the technical documentation or contact the development team.
