import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invoiceId } = await req.json();

    if (!invoiceId) {
      return Response.json({ error: 'Invoice ID required' }, { status: 400 });
    }

    // Fetch invoice
    const invoice = await base44.asServiceRole.entities.Invoice.get(invoiceId);
    
    if (!invoice) {
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Verify access
    if (invoice.instructorId !== user.id && invoice.pupilId !== user.id) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get instructor business info
    const instructors = await base44.asServiceRole.entities.Instructor.filter({ created_by: invoice.instructorEmail || '' });
    const instructorProfile = instructors.length > 0 ? instructors[0] : null;

    // Build letterhead
    const businessName = instructorProfile?.businessName || invoice.instructorName || 'Driving School';
    const businessAddress = instructorProfile?.businessAddress || '';
    const businessCity = instructorProfile?.businessCity || '';
    const businessPostcode = instructorProfile?.businessPostcode || '';
    const businessPhone = instructorProfile?.usePersonalPhoneForBusiness 
      ? invoice.instructorPhone 
      : (instructorProfile?.businessPhone || invoice.instructorPhone || '');
    const businessEmail = instructorProfile?.usePersonalEmailForBusiness
      ? invoice.instructorEmail
      : (instructorProfile?.businessEmail || invoice.instructorEmail || '');
    const businessReg = instructorProfile?.businessRegistration || '';
    const logoUrl = instructorProfile?.businessLogoUrl || '';

    // Generate HTML invoice
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
    .logo { max-width: 800px; max-height: 320px; }
    .business-info { text-align: right; font-size: 12px; line-height: 1.6; }
    .business-name { font-size: 16px; font-weight: bold; color: #071739; }
    .invoice-title { font-size: 32px; font-weight: bold; color: #071739; margin-bottom: 20px; }
    .invoice-details { background: #f5f5f5; padding: 15px; margin-bottom: 30px; }
    .bill-to { margin-bottom: 30px; }
    .bill-to h3 { color: #071739; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background: #071739; color: white; padding: 12px; text-align: left; }
    td { padding: 12px; border-bottom: 1px solid #ddd; }
    .total-row { font-weight: bold; font-size: 16px; background: #f9f9f9; }
    .payment-info { background: #f5f5f5; padding: 15px; margin-bottom: 20px; }
    .footer { text-align: center; color: #888; font-size: 12px; margin-top: 40px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      ${logoUrl ? `<img src="${logoUrl}" class="logo" alt="Logo">` : ''}
    </div>
    <div class="business-info">
      <div class="business-name">${businessName}</div>
      ${businessAddress ? `<div>${businessAddress}</div>` : ''}
      ${businessCity || businessPostcode ? `<div>${businessCity} ${businessPostcode}</div>` : ''}
      ${businessPhone ? `<div>Tel: ${businessPhone}</div>` : ''}
      ${businessEmail ? `<div>${businessEmail}</div>` : ''}
      ${businessReg ? `<div>Reg: ${businessReg}</div>` : ''}
    </div>
  </div>

  <div class="invoice-title">INVOICE</div>

  <div class="invoice-details">
    <strong>Invoice Number:</strong> ${invoice.invoiceNumber}<br>
    <strong>Date:</strong> ${new Date(invoice.paymentDate).toLocaleDateString('en-GB')}<br>
    <strong>Status:</strong> ${invoice.status}
  </div>

  <div class="bill-to">
    <h3>Bill To:</h3>
    <div>${invoice.pupilName}</div>
    ${invoice.pupilEmail ? `<div>${invoice.pupilEmail}</div>` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Hours</th>
        <th>Rate</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${invoice.description || 'Driving lessons'}</td>
        <td>${invoice.hours}</td>
        <td>£${(invoice.amount / invoice.hours).toFixed(2)}</td>
        <td>£${invoice.amount.toFixed(2)}</td>
      </tr>
      <tr class="total-row">
        <td colspan="3" style="text-align: right;">Total:</td>
        <td>£${invoice.amount.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  <div class="payment-info">
    <strong>Payment Details:</strong><br>
    Method: ${invoice.paymentMethod}<br>
    Date Paid: ${new Date(invoice.paymentDate).toLocaleDateString('en-GB')}
  </div>

  ${invoice.notes ? `
  <div style="margin-bottom: 20px;">
    <strong>Notes:</strong><br>
    ${invoice.notes}
  </div>
  ` : ''}

  <div class="footer">
    Thank you for your business!
  </div>
</body>
</html>
    `;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
      }
    });

  } catch (error) {
    console.error('Invoice generation error:', error);
    return Response.json({ 
      error: error.message
    }, { status: 500 });
  }
});