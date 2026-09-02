# Payment Gateway Integration Guide for Gigga

## Recommended Solution: PayFast + Ozow

### Why This Combination?
- **PayFast**: Covers credit cards, Masterpass, and general payments
- **Ozow**: Handles instant EFT (most popular in SA)
- **Coverage**: 95%+ of South African payment preferences
- **Cost**: Reasonable transaction fees, no monthly costs
- **User Experience**: Both have excellent mobile support

## Implementation Steps

### Phase 1: PayFast Integration

#### 1. Sign Up for PayFast
1. Go to [payfast.co.za](https://payfast.co.za)
2. Create a merchant account
3. Complete verification process
4. Get your Merchant ID and Merchant Key

#### 2. PayFast Integration Options

**Option A: Redirect Method (Easiest)**
- Redirect users to PayFast checkout
- PayFast handles payment processing
- User redirected back to your site after payment

**Option B: Onsite Integration (Better UX)**
- PayFast iframe on your site
- Users stay on Gigga during payment
- More seamless experience

#### 3. PayFast API Integration

```javascript
// Example PayFast integration
async function initiatePayFastPayment(paymentDetails) {
  const payfastData = {
    merchant_id: 'YOUR_MERCHANT_ID',
    merchant_key: 'YOUR_MERCHANT_KEY',
    return_url: 'https://gigga.co.za/payment/success',
    cancel_url: 'https://gigga.co.za/payment/cancel',
    notify_url: 'https://gigga.co.za/payment/notify',
    name_first: paymentDetails.firstName,
    name_last: paymentDetails.lastName,
    email_address: paymentDetails.email,
    m_payment_id: paymentDetails.applicationId,
    amount: paymentDetails.amount,
    item_name: `Job Payment: ${paymentDetails.jobTitle}`,
    item_description: 'Payment for completed work',
    custom_int1: paymentDetails.studentId,
    custom_int2: paymentDetails.businessId,
    custom_int3: paymentDetails.jobId,
    custom_str1: paymentDetails.paymentMethod,
    email_confirmation: 1,
    confirmation_address: 'payments@gigga.co.za'
  };

  // Generate signature
  const signature = generatePayFastSignature(payfastData);
  
  // Redirect to PayFast
  const payfastUrl = `https://www.payfast.co.za/eng/process?${queryString}`;
  window.location.href = payfastUrl;
}
```

### Phase 2: Ozow Integration

#### 1. Sign Up for Ozow
1. Go to [ozow.com](https://ozow.com)
2. Create a merchant account
3. Complete verification
4. Get Site ID and API Key

#### 2. Ozow Integration

```javascript
// Example Ozow integration
async function initiateOzowPayment(paymentDetails) {
  const ozowData = {
    SiteId: 'YOUR_SITE_ID',
    Amount: paymentDetails.amount,
    TransactionReference: generateTransactionId(),
    BankId: paymentDetails.bankId,
    IsTest: true,
    CancelUrl: 'https://gigga.co.za/payment/cancel',
    ErrorUrl: 'https://gigga.co.za/payment/error',
    SuccessUrl: 'https://gigga.co.za/payment/success',
    NotifyUrl: 'https://gigga.co.za/payment/notify',
    CustomerEmail: paymentDetails.email,
    CustomerName: `${paymentDetails.firstName} ${paymentDetails.lastName}`,
    Custom1: paymentDetails.applicationId,
    Custom2: paymentDetails.studentId,
    Custom3: paymentDetails.businessId
  };

  // Generate Ozow signature
  const signature = generateOzowSignature(ozowData);
  
  // Redirect to Ozow
  const ozowUrl = `https://www.ozow.com/postpaymentrequest?${queryString}`;
  window.location.href = ozowUrl;
}
```

## Database Schema Updates

### Add payment gateway tracking

```sql
-- Add payment gateway tracking to payment_history
ALTER TABLE public.payment_history ADD COLUMN IF NOT EXISTS gateway TEXT;
ALTER TABLE public.payment_history ADD COLUMN IF NOT EXISTS gateway_transaction_id TEXT;
ALTER TABLE public.payment_history ADD COLUMN IF NOT EXISTS gateway_response JSONB;
ALTER TABLE public.payment_history ADD COLUMN IF NOT EXISTS gateway_status TEXT;
ALTER TABLE public.payment_history ADD COLUMN IF NOT EXISTS gateway_fee DECIMAL(10,2);
ALTER TABLE public.payment_history ADD COLUMN IF NOT EXISTS gateway_settlement_date TIMESTAMPTZ;

-- Add payment gateway configuration
CREATE TABLE IF NOT EXISTS public.payment_gateways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  merchant_id TEXT,
  api_key_encrypted TEXT,
  sandbox_mode BOOLEAN DEFAULT true,
  fee_percentage DECIMAL(5,2),
  fee_fixed DECIMAL(10,2),
  settlement_days INTEGER,
  supported_methods TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;

-- Only admins can manage gateways
CREATE POLICY "Admins can manage payment gateways"
  ON public.payment_gateways FOR ALL
  USING (auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  ));
```

## Frontend Implementation

### Update Payment Modal

```javascript
// Enhanced payment modal with gateway selection
function showPaymentModal(applicationId, jobId, jobTitle) {
  const modalHTML = `
    <div id="paymentModal" class="modal hidden">
      <div class="modal-content">
        <div class="modal-header">
          <h3>💰 Payment Details</h3>
          <button id="paymentModalClose" class="modal-close">×</button>
        </div>
        <form id="paymentForm">
          <div class="form-group">
            <label for="paymentAmount">Payment Amount (ZAR)</label>
            <input type="number" id="paymentAmount" name="amount" required min="0" step="0.01" placeholder="0.00">
          </div>
          <div class="form-group">
            <label for="paymentGateway">Payment Method</label>
            <select id="paymentGateway" name="gateway" required>
              <option value="">Select payment method</option>
              <option value="payfast_card">💳 Credit/Debit Card (PayFast)</option>
              <option value="payfast_eft">🏦 Instant EFT (PayFast)</option>
              <option value="ozow">⚡ Instant EFT (Ozow)</option>
              <option value="manual">📋 Manual Payment</option>
            </select>
          </div>
          <div id="bankSelection" class="form-group hidden">
            <label for="bankSelect">Select Bank</label>
            <select id="bankSelect" name="bank">
              <option value="ABSA">ABSA</option>
              <option value="FNB">FNB</option>
              <option value="NEDBANK">Nedbank</option>
              <option value="STANDARD">Standard Bank</option>
              <option value="CAPITEC">Capitec</option>
            </select>
          </div>
          <div class="form-group">
            <label for="paymentNotes">Notes (optional)</label>
            <textarea id="paymentNotes" name="notes" rows="3" placeholder="Any additional payment details..."></textarea>
          </div>
          <div class="payment-info">
            <p>💡 <strong>Tip:</strong> Instant EFT is the fastest and most secure method for South African payments.</p>
          </div>
          <div class="modal-actions">
            <button type="button" id="cancelPayment" class="btn-outline">Cancel</button>
            <button type="submit" class="btn-primary">Proceed to Payment</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  // Add gateway change handler
  document.getElementById('paymentGateway').addEventListener('change', (e) => {
    const bankSelection = document.getElementById('bankSelection');
    if (e.target.value === 'ozow') {
      bankSelection.classList.remove('hidden');
    } else {
      bankSelection.classList.add('hidden');
    }
  });
}
```

## Backend API Endpoints

### Create payment processing endpoints

```javascript
// payment.js (Edge function or backend)
import { supabase } from './supabase.js';

export async function createPaymentIntent(req, res) {
  const { applicationId, amount, gateway, paymentMethod } = req.body;
  
  // Get application details
  const { data: application } = await supabase
    .from('applications')
    .select('*, jobs(*), profiles(*)')
    .eq('id', applicationId)
    .single();
  
  // Create payment record
  const { data: payment } = await supabase
    .from('payment_history')
    .insert({
      application_id: applicationId,
      job_id: application.job_id,
      student_id: application.student_id,
      business_id: application.jobs.business_id,
      amount: amount,
      payment_method: paymentMethod,
      payment_status: 'pending',
      gateway: gateway
    })
    .select()
    .single();
  
  // Initiate gateway payment
  if (gateway === 'payfast_card' || gateway === 'payfast_eft') {
    return initiatePayFastPayment(payment, application);
  } else if (gateway === 'ozow') {
    return initiateOzowPayment(payment, application);
  } else {
    // Manual payment
    return { success: true, paymentId: payment.id };
  }
}

export async function handlePaymentCallback(req, res) {
  const { gateway, transactionId, status } = req.body;
  
  // Update payment status
  await supabase
    .from('payment_history')
    .update({
      payment_status: status,
      gateway_transaction_id: transactionId,
      gateway_response: req.body,
      payment_date: new Date().toISOString()
    })
    .eq('gateway_transaction_id', transactionId);
  
  // Update application status if payment successful
  if (status === 'completed' || status === 'paid') {
    const { data: payment } = await supabase
      .from('payment_history')
      .select('application_id')
      .eq('gateway_transaction_id', transactionId)
      .single();
    
    await supabase
      .from('applications')
      .update({ status: 'accepted', payment_status: 'paid' })
      .eq('id', payment.application_id);
  }
  
  res.json({ success: true });
}
```

## Security Considerations

### 1. API Key Security
- Never expose API keys in frontend code
- Use environment variables
- Encrypt sensitive data in database
- Use Supabase Edge Functions for payment processing

### 2. Webhook Verification
- Verify webhook signatures
- Validate payment amounts
- Check for duplicate notifications
- Log all webhook events

### 3. Fraud Prevention
- Implement rate limiting
- Monitor for suspicious patterns
- Require 2FA for large amounts
- Keep audit trails

## Testing Strategy

### 1. Sandbox Testing
- Use PayFast sandbox environment
- Test with small amounts (R1.00)
- Test success and failure scenarios
- Test webhook callbacks

### 2. User Testing
- Test on mobile devices
- Test different payment methods
- Test error handling
- Test notification delivery

## Cost Analysis

### PayFast
- Transaction fee: 2.9% + R2.00
- No monthly fees
- Settlement: 2-3 business days

### Ozow
- Transaction fee: 1.5% + R5.00
- No monthly fees
- Settlement: Instant

### Example Cost Calculation
For a R500 payment:
- PayFast: R500 × 2.9% + R2 = R16.50
- Ozow: R500 × 1.5% + R5 = R12.50

## Implementation Timeline

### Week 1: Setup
- Sign up for PayFast and Ozow accounts
- Complete verification processes
- Get API credentials
- Set up sandbox environments

### Week 2: Integration
- Implement PayFast integration
- Implement Ozow integration
- Update database schema
- Create backend endpoints

### Week 3: Testing
- Test all payment flows
- Test webhook handling
- Test error scenarios
- Security audit

### Week 4: Launch
- Deploy to production
- Monitor transactions
- Handle user feedback
- Optimize based on data

## Future Enhancements

### Phase 2 Features
- **Yoco integration** for card payments
- **SnapScan** for mobile QR payments
- **Recurring payments** for ongoing work
- **Escrow system** for security
- **Split payments** for multiple parties

### Advanced Features
- **Payment scheduling** (pay later)
- **Payment reminders** (automated)
- **Invoice generation** (PDF)
- **Tax reporting** (for businesses)
- **Analytics dashboard** (payment insights)

## Support Resources

### PayFast
- Documentation: [docs.payfast.co.za](https://docs.payfast.co.za)
- Support: support@payfast.co.za
- Phone: 087 470 0000

### Ozow
- Documentation: [docs.ozow.com](https://docs.ozow.com)
- Support: support@ozow.com
- Phone: 087 231 0000

## Conclusion

The PayFast + Ozow combination provides the best coverage for South African users while maintaining reasonable costs and excellent user experience. Start with the redirect method for easier integration, then consider onsite integration for better UX as the platform grows.
