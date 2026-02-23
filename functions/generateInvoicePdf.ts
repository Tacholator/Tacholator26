import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.2';

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

    // Get invoice
    const invoice = await base44.entities.Invoice.get(invoiceId);
    
    if (!invoice) {
      return Response.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Verify access
    if (user.role !== 'admin' && invoice.instructorId !== user.id && invoice.pupilId !== user.id) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    // Create PDF
    const doc = new jsPDF();
    const logoUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6928de5cfb626066705b29e3/55c61cd0c_2.png';

    // Header - Logo
    doc.addImage(logoUrl, 'PNG', 15, 10, 60, 20);

    // Invoice title and number
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 150, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.invoiceNumber, 150, 27);
    doc.text(`Date: ${new Date(invoice.created_date).toLocaleDateString('en-GB')}`, 150, 33);

    // Yellow divider
    doc.setDrawColor(247, 182, 2);
    doc.setLineWidth(1);
    doc.line(15, 40, 195, 40);

    // From/To section
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('FROM:', 15, 50);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.instructorName || 'Instructor', 15, 56);
    doc.text(invoice.instructorEmail || '', 15, 62);
    if (invoice.instructorPhone) {
      doc.text(invoice.instructorPhone, 15, 68);
    }

    doc.setFont('helvetica', 'bold');
    doc.text('BILLED TO:', 120, 50);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.pupilName || 'Pupil', 120, 56);
    doc.text(invoice.pupilEmail || '', 120, 62);

    // Line items table
    const startY = 85;
    doc.setFillColor(247, 182, 2);
    doc.rect(15, startY, 180, 8, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('Description', 17, startY + 5.5);
    doc.text('Hours', 120, startY + 5.5);
    doc.text('Rate', 145, startY + 5.5);
    doc.text('Amount', 170, startY + 5.5);

    // Line item
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    const itemY = startY + 15;
    doc.text(invoice.description || 'Driving lessons', 17, itemY);
    doc.text(String(invoice.hours || 0), 120, itemY);
    doc.text(`£${((invoice.amount || 0) / (invoice.hours || 1)).toFixed(2)}`, 145, itemY);
    doc.text(`£${(invoice.amount || 0).toFixed(2)}`, 170, itemY);

    // Totals
    const totalY = itemY + 20;
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', 145, totalY);
    doc.setFontSize(14);
    doc.text(`£${(invoice.amount || 0).toFixed(2)}`, 170, totalY);

    // Payment details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const paymentY = totalY + 15;
    doc.text('Payment Details:', 15, paymentY);
    doc.text(`Method: ${invoice.paymentMethod}`, 15, paymentY + 6);
    doc.text(`Status: ${invoice.status}`, 15, paymentY + 12);
    if (invoice.paymentDate) {
      doc.text(`Paid: ${new Date(invoice.paymentDate).toLocaleDateString('en-GB')}`, 15, paymentY + 18);
    }
    if (invoice.manualReference) {
      doc.text(`Reference: ${invoice.manualReference}`, 15, paymentY + 24);
    }

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(128, 128, 128);
    doc.text('Thank you for choosing Mobrage Driving Academy', 105, 280, { align: 'center' });
    doc.text('Please keep this invoice for your records', 105, 285, { align: 'center' });

    // Generate PDF buffer
    const pdfBuffer = doc.output('arraybuffer');

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`
      }
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});