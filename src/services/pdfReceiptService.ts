import { jsPDF } from 'jspdf';
import { CONTACT_INFO } from '@/constants/contact';
import logoImg from '@/assert/logo.png';

interface OrderData {
  id: string;
  created_at: string;
  payment_id: string | null;
  product_name: string;
  product_image: string | null;
  selected_size: string | null;
  selected_color: string | null;
  quantity: number;
  price: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  city: string;
  pincode: string;
  total_amount: number;
  discount?: number;
}

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return `Rs. ${amount.toFixed(2)}`;
};

// Helper function to format date
const formatReceiptDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

// Helper function to format order ID (display first 8 characters)
const formatOrderId = (orderId: string): string => {
  return orderId.substring(0, 8).toUpperCase();
};

// Helper function to load image as base64
const loadImageAsBase64 = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(new Error('Failed to get canvas context'));
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
};

// Render header with logo and company info
const renderHeader = async (doc: jsPDF, y: number): Promise<number> => {
  try {
    // Load and add logo
    const logoBase64 = await loadImageAsBase64(logoImg);
    doc.addImage(logoBase64, 'PNG', 20, y, 30, 30);
  } catch (error) {
    console.error('Failed to load logo:', error);
    // Continue without logo
  }

  // Company name in gold
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(218, 170, 45); // Gold
  doc.text(CONTACT_INFO.company.name, 55, y + 10);

  // Company details in black
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(44, 44, 44);
  doc.text(CONTACT_INFO.address.line1 + ', ' + CONTACT_INFO.address.line2, 55, y + 17);
  doc.text(CONTACT_INFO.address.line3 + ', ' + CONTACT_INFO.address.city + ' - ' + CONTACT_INFO.address.pincode, 55, y + 21);
  doc.text(CONTACT_INFO.address.state + ', ' + CONTACT_INFO.address.country, 55, y + 25);

  // GSTIN
  doc.setFont('helvetica', 'bold');
  doc.text('GSTIN: ', 55, y + 29);
  doc.setFont('helvetica', 'normal');
  doc.text(CONTACT_INFO.company.gstin, 70, y + 29);

  // Email
  doc.setTextColor(218, 170, 45); // Gold
  doc.text(CONTACT_INFO.email.primary, 55, y + 33);

  // Pink line separator
  doc.setDrawColor(240, 131, 186); // Pink
  doc.setLineWidth(0.5);
  doc.line(20, y + 38, 190, y + 38);

  return y + 42;
};

// Render title
const renderTitle = (doc: jsPDF, y: number): number => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(240, 131, 186); // Pink
  const title = 'PAYMENT RECEIPT';
  const pageWidth = doc.internal.pageSize.getWidth();
  const textWidth = doc.getTextWidth(title);
  doc.text(title, (pageWidth - textWidth) / 2, y);

  return y + 8;
};

// Render order information
const renderOrderInfo = (doc: jsPDF, order: OrderData, y: number): number => {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(44, 44, 44);

  doc.setFont('helvetica', 'bold');
  doc.text('Order ID:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(formatOrderId(order.id), 50, y);

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(formatReceiptDate(order.created_at), 50, y);

  if (order.payment_id) {
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Payment ID:', 20, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(order.payment_id, 50, y);
    doc.setFontSize(10);
  }

  // Line separator
  y += 6;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(20, y, 190, y);

  return y + 5;
};

// Render bill to section
const renderBillTo = (doc: jsPDF, order: OrderData, y: number): number => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(44, 44, 44);
  doc.text('BILL TO:', 20, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  y += 5;
  doc.text(order.customer_name, 20, y);

  y += 5;
  // Split long address if needed
  const addressLine = order.delivery_address + ', ' + order.city + ' - ' + order.pincode;
  const maxWidth = 170;
  const addressLines = doc.splitTextToSize(addressLine, maxWidth);
  doc.text(addressLines, 20, y);
  y += addressLines.length * 5;

  y += 2;
  doc.text('Phone: ' + order.customer_phone, 20, y);

  y += 5;
  doc.text('Email: ' + order.customer_email, 20, y);

  // Line separator
  y += 6;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(20, y, 190, y);

  return y + 5;
};

// Render product details
const renderProductDetails = (doc: jsPDF, order: OrderData, y: number): number => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(44, 44, 44);
  doc.text('PRODUCT DETAILS', 20, y);

  y += 5;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(20, y, 190, y);

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  // Product name (split if too long)
  const productLines = doc.splitTextToSize(order.product_name, 130);
  doc.text(productLines, 20, y);
  y += productLines.length * 5;

  // Size and Color
  if (order.selected_size || order.selected_color) {
    const details = [];
    if (order.selected_size) details.push('Size: ' + order.selected_size);
    if (order.selected_color) details.push('Color: ' + order.selected_color);
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(details.join('  |  '), 20, y);
    doc.setTextColor(44, 44, 44);
    doc.setFontSize(10);
    y += 5;
  }

  // Quantity and unit price
  const quantityText = 'Quantity: ' + order.quantity.toString();
  const priceText = 'Price: ' + formatCurrency(order.price);
  doc.text(quantityText, 20, y);
  doc.text(priceText, 90, y);

  return y + 5;
};

// Render totals section
const renderTotals = (doc: jsPDF, order: OrderData, y: number): number => {
  y += 2;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(20, y, 190, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(44, 44, 44);

  // Subtotal
  const subtotal = order.price * order.quantity;
  doc.text('Subtotal:', 130, y);
  doc.text(formatCurrency(subtotal), 180, y, { align: 'right' });
  y += 5;

  // Discount (if applicable)
  if (order.discount && order.discount > 0) {
    doc.text('Discount:', 130, y);
    doc.text('-' + formatCurrency(order.discount), 180, y, { align: 'right' });
    y += 5;
  }

  // Line before total
  doc.setDrawColor(240, 131, 186); // Pink
  doc.setLineWidth(0.5);
  doc.line(130, y, 190, y);
  y += 6;

  // Total (highlighted)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(240, 131, 186); // Pink
  doc.text('TOTAL PAID:', 130, y);
  doc.text(formatCurrency(order.total_amount), 190, y, { align: 'right' });

  return y + 8;
};

// Render footer
const renderFooter = (doc: jsPDF, y: number): number => {
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(20, y, 190, y);
  y += 5;

  // Thank you message
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(218, 170, 45); // Gold
  const thankYou = 'Thank you for shopping with us!';
  const pageWidth = doc.internal.pageSize.getWidth();
  const textWidth = doc.getTextWidth(thankYou);
  doc.text(thankYou, (pageWidth - textWidth) / 2, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(44, 44, 44);
  const contact = 'Questions? Contact us at ' + CONTACT_INFO.phone.display + ' or ' + CONTACT_INFO.email.primary;
  const contactWidth = doc.getTextWidth(contact);
  doc.text(contact, (pageWidth - contactWidth) / 2, y);

  return y;
};

// Main function to generate receipt
export const generateReceipt = async (orderData: OrderData): Promise<void> => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    let y = 20;

    // Render all sections
    y = await renderHeader(doc, y);
    y = renderTitle(doc, y);
    y = renderOrderInfo(doc, orderData, y);
    y = renderBillTo(doc, orderData, y);
    y = renderProductDetails(doc, orderData, y);
    y = renderTotals(doc, orderData, y);
    renderFooter(doc, y);

    // Generate filename
    const filename = 'Mahamitra_Receipt_' + formatOrderId(orderData.id) + '.pdf';

    // Download PDF
    doc.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate receipt PDF');
  }
};
