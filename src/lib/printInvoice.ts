export interface InvoiceData {
  invoiceNo: string;
  orderDate: string;
  billBookNo?: string;
  customerCode: string;
  customerName: string;
  salesmanName?: string;
  subtotalAmount: number;
  totalAmount: number;
  items: Array<{
    productName: string;
    unitPrice: number;
    saleQty: number;
    returnQty: number;
    lineAmount: number;
  }>;
  paymentMethod?: string;
  receivedAmount?: number;
}

export const printInvoice = (invoiceData: InvoiceData) => {
  const printContent = `
    <html>
      <head>
        <title>Invoice ${invoiceData.invoiceNo}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            line-height: 1.4;
          }
          .header { 
            text-align: center; 
            margin-bottom: 20px; 
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
          }
          .header h1 { 
            margin: 0; 
            font-size: 24px; 
            font-weight: bold;
          }
          .header h2 { 
            margin: 5px 0 0 0; 
            font-size: 18px; 
            color: #666;
          }
          .invoice-details { 
            margin-bottom: 20px; 
            display: flex;
            justify-content: space-between;
          }
          .invoice-details p { 
            margin: 5px 0; 
          }
          .customer-details { 
            margin-bottom: 20px; 
          }
          .customer-details p { 
            margin: 5px 0; 
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px; 
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left; 
          }
          th { 
            background-color: #f2f2f2; 
            font-weight: bold;
          }
          .numeric { 
            text-align: right; 
          }
          .total { 
            text-align: right; 
            font-weight: bold; 
          }
          .payment-info { 
            margin-top: 20px; 
            border-top: 1px solid #ddd;
            padding-top: 10px;
          }
          .payment-info p { 
            margin: 5px 0; 
          }
          @media print {
            body { margin: 10px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ZAMZAM INDUSTRIES</h1>
          <h2>TAX INVOICE</h2>
        </div>
        
        <div class="invoice-details">
          <div>
            <p><strong>Invoice No:</strong> ${invoiceData.invoiceNo}</p>
            <p><strong>Date:</strong> ${invoiceData.orderDate}</p>
            <p><strong>Bill Book No:</strong> ${invoiceData.billBookNo || 'N/A'}</p>
          </div>
          <div>
            <p><strong>Payment Method:</strong> ${invoiceData.paymentMethod || 'N/A'}</p>
            ${invoiceData.receivedAmount ? `<p><strong>Received Amount:</strong> ${invoiceData.receivedAmount}</p>` : ''}
          </div>
        </div>
        
        <div class="customer-details">
          <p><strong>Customer:</strong> ${invoiceData.customerName}</p>
          <p><strong>Customer Code:</strong> ${invoiceData.customerCode}</p>
          <p><strong>Salesman:</strong> ${invoiceData.salesmanName || 'N/A'}</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th class="numeric">Price</th>
              <th class="numeric">Qty</th>
              <th class="numeric">Return Qty</th>
              <th class="numeric">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${invoiceData.items.map((item) => `
              <tr>
                <td>${item.productName}</td>
                <td class="numeric">${Number(item.unitPrice).toFixed(2)}</td>
                <td class="numeric">${item.saleQty}</td>
                <td class="numeric">${item.returnQty}</td>
                <td class="numeric">${Number(item.lineAmount).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4" class="total"><strong>Subtotal:</strong></td>
              <td class="numeric">${Number(invoiceData.subtotalAmount).toFixed(2)}</td>
            </tr>
            <tr>
              <td colspan="4" class="total"><strong>Total:</strong></td>
              <td class="numeric"><strong>${Number(invoiceData.totalAmount).toFixed(2)}</strong></td>
            </tr>
          </tfoot>
        </table>
        
        <div class="payment-info">
          <p><strong>Payment Method:</strong> ${invoiceData.paymentMethod || 'N/A'}</p>
          ${invoiceData.receivedAmount ? `<p><strong>Received Amount:</strong> ${Number(invoiceData.receivedAmount).toFixed(2)}</p>` : ''}
        </div>
      </body>
    </html>
  `;

  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();

    // Wait for content to load before printing
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }
};
