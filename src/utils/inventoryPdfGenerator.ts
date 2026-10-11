import { jsPDF } from 'jspdf';
import { svgToPngDataUrl } from './sorteoPdfGenerator';

export interface InventoryAssetToPrint {
  id: string;
  assetCode: string;
  name: string;
  location: string;
  category?: string;
}

export interface GenerateInventoryPdfOptions {
  assets: InventoryAssetToPrint[];
  schoolName?: string;
  format?: 'standard' | 'compact' | 'badge';
}

/**
 * Generador nativo vectorial de etiquetas de inventario y HelpDesk en PDF A4.
 * Genera cuadrícula precisa para hojas adhesivas o cartulina con soporte
 * para múltiples páginas ("y siguientes"), guías de corte en las esquinas y numeración.
 */
export async function generateInventoryQrPdf({
  assets,
  schoolName = 'U.E. VIRGEN DEL CISNE',
  format = 'standard'
}: GenerateInventoryPdfOptions): Promise<void> {
  if (!assets || assets.length === 0) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  // Configuración de cuadrícula según formato
  let cols = 3;
  let rows = 4;
  let labelWidth = 63;
  let labelHeight = 65;
  let marginX = 7;
  const marginY = 8;
  const spacingX = 2;
  const spacingY = 2;

  if (format === 'compact') {
    // 4 columnas x 6 filas = 24 etiquetas por hoja
    cols = 4;
    rows = 6;
    labelWidth = 47.5;
    labelHeight = 44.5;
    marginX = 6;
  } else if (format === 'badge') {
    // 2 columnas x 3 filas = 6 fichas grandes por hoja
    cols = 2;
    rows = 3;
    labelWidth = 96;
    labelHeight = 88;
    marginX = 7.5;
  } else {
    // standard: 3 columnas x 4 filas = 12 etiquetas por hoja
    cols = 3;
    rows = 4;
    labelWidth = 63;
    labelHeight = 65;
    marginX = 7;
  }

  const itemsPerPage = cols * rows;
  const totalSheets = Math.ceil(assets.length / itemsPerPage);

  // Recolectar imágenes QR de los SVGs montados en el DOM
  const qrCache = new Map<string, string>();
  const allSvgs = Array.from(document.querySelectorAll('#inventory-print-modal-container svg'));

  for (let i = 0; i < assets.length; i++) {
    const asset = assets[i];
    if (qrCache.has(asset.assetCode)) continue;

    let svgEl: SVGElement | null = null;
    if (allSvgs[i]) {
      svgEl = allSvgs[i] as unknown as SVGElement;
    }

    if (svgEl) {
      const pngUrl = await svgToPngDataUrl(svgEl, 180);
      if (pngUrl) {
        qrCache.set(asset.assetCode, pngUrl);
      }
    }
  }

  // Dibujar cada etiqueta en la página correspondiente
  for (let i = 0; i < assets.length; i++) {
    const asset = assets[i];
    const slot = i % itemsPerPage;

    // Salto de página para hojas siguientes
    if (i > 0 && slot === 0) {
      doc.addPage();
    }

    const col = slot % cols;
    const row = Math.floor(slot / cols);
    const x = marginX + col * (labelWidth + spacingX);
    const y = marginY + row * (labelHeight + spacingY);

    // Fondo blanco
    doc.setFillColor(255, 255, 255);
    doc.rect(x, y, labelWidth, labelHeight, 'F');

    // Borde punteado de corte
    doc.setDrawColor(180, 190, 205);
    doc.setLineDashPattern([1.5, 1.5], 0);
    doc.roundedRect(x, y, labelWidth, labelHeight, 1.5, 1.5, 'S');
    doc.setLineDashPattern([], 0);

    // Líneas guía en las 4 esquinas para tijeras o guillotina
    const cropLen = 3.5;
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.35);

    // Esquinas
    doc.line(x, y, x + cropLen, y);
    doc.line(x, y, x, y + cropLen);
    doc.line(x + labelWidth, y, x + labelWidth - cropLen, y);
    doc.line(x + labelWidth, y, x + labelWidth, y + cropLen);
    doc.line(x, y + labelHeight, x + cropLen, y + labelHeight);
    doc.line(x, y + labelHeight, x, y + labelHeight - cropLen);
    doc.line(x + labelWidth, y + labelHeight, x + labelWidth - cropLen, y + labelHeight);
    doc.line(x + labelWidth, y + labelHeight, x + labelWidth, y + labelHeight - cropLen);

    // Cabecera de la etiqueta
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(format === 'compact' ? 6 : 7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(schoolName, x + labelWidth / 2, y + 4.5, { align: 'center' });

    doc.setFontSize(format === 'compact' ? 4.5 : 5.5);
    doc.setTextColor(2, 132, 199);
    doc.text('SISTEMA HELPDESK & MANTENIMIENTO', x + labelWidth / 2, y + 8, { align: 'center' });

    // Línea separadora
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(x + 3, y + 9.5, x + labelWidth - 3, y + 9.5);

    // Nombre del activo
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(format === 'compact' ? 6.5 : 8);
    doc.setTextColor(15, 23, 42);
    const nameLines = doc.splitTextToSize(asset.name, labelWidth - 6);
    doc.text(nameLines[0], x + labelWidth / 2, y + 13.5, { align: 'center' });

    // Código QR
    const qrSize = format === 'compact' ? 17 : format === 'badge' ? 32 : 23;
    const qrX = x + (labelWidth - qrSize) / 2;
    const qrY = y + (format === 'compact' ? 15.5 : 16);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(qrX, qrY, qrSize, qrSize, 1, 1, 'FD');

    const qrPng = qrCache.get(asset.assetCode);
    if (qrPng) {
      doc.addImage(qrPng, 'PNG', qrX + 0.8, qrY + 0.8, qrSize - 1.6, qrSize - 1.6);
    }

    // Código del activo en recuadro destacado
    const codeBoxW = format === 'compact' ? 24 : 30;
    const codeBoxH = format === 'compact' ? 5.5 : 6.5;
    const codeBoxX = x + (labelWidth - codeBoxW) / 2;
    const codeBoxY = qrY + qrSize + 2;

    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(codeBoxX, codeBoxY, codeBoxW, codeBoxH, 1, 1, 'FD');

    doc.setFont('courier', 'bold');
    doc.setFontSize(format === 'compact' ? 7 : 8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(asset.assetCode, x + labelWidth / 2, codeBoxY + codeBoxH - 1.8, { align: 'center' });

    // Ubicación
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(format === 'compact' ? 4.5 : 5.5);
    doc.setTextColor(71, 85, 105);
    const locLines = doc.splitTextToSize(asset.location || 'Laboratorio', labelWidth - 4);
    doc.text(locLines[0], x + labelWidth / 2, codeBoxY + codeBoxH + 3.5, { align: 'center' });

    // Pie de la etiqueta
    doc.setFontSize(format === 'compact' ? 3.8 : 4.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Escanear con celular para reportar averías', x + labelWidth / 2, y + labelHeight - 2, { align: 'center' });
  }

  // Numeración de páginas en el pie de cada hoja
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Hoja ${p} de ${totalPages} • ${schoolName} • Etiquetas de Inventario & HelpDesk`,
      105,
      293,
      { align: 'center' }
    );
  }

  // Guardar archivo PDF
  const pdfName = `etiquetas_inventario_${assets.length}_activos_${totalPages}_hojas.pdf`;
  doc.save(pdfName);
}
