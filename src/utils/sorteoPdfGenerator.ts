import { jsPDF } from 'jspdf';
import { Sorteo, SorteoTicket } from '../types/sorteo';
import { formatTicketCodeDisplay } from './sorteoSecurity';

/**
 * Convierte un elemento SVG en una imagen PNG DataURL nítida mediante canvas offscreen.
 * No analiza hojas de estilo ni propiedades CSS modernas (oklch), evitando cualquier error.
 */
export async function svgToPngDataUrl(svgElement: SVGElement, size = 180): Promise<string> {
  return new Promise((resolve) => {
    try {
      const xml = new XMLSerializer().serializeToString(svgElement);
      const svgBase64 = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, size, size);
          ctx.drawImage(img, 0, 0, size, size);
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve('');
        }
      };
      img.onerror = () => resolve('');
      img.src = svgBase64;
    } catch {
      resolve('');
    }
  });
}

export interface GeneratePdfOptions {
  tickets: SorteoTicket[];
  sorteoMap: Record<string, Sorteo>;
  schoolName?: string;
  density?: 'ultra' | 'micro' | 'compact' | 'standard' | 'large';
  columns?: '4' | '3';
}

/**
 * Generador nativo vectorial de boletos en PDF A4.
 * Genera exactamente 24 boletos por hoja en formato 'ultra' (4 columnas × 6 filas),
 * garantizando cero desperdicio de papel y códigos QR ultra nítidos.
 */
export async function generateSorteoTicketsPdf({
  tickets,
  sorteoMap,
  schoolName = 'U.E. Virgen del Cisne',
  density = 'ultra',
  columns = '4'
}: GeneratePdfOptions): Promise<void> {
  if (!tickets || tickets.length === 0) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  // Dimensiones de hoja A4: 210mm x 297mm
  const is4Col = density === 'ultra' && columns === '4';
  const is3Col = density === 'ultra' && columns === '3';

  // Configuración de cuadrícula según densidad
  const cols = is4Col ? 4 : is3Col ? 3 : density === 'micro' || density === 'compact' || density === 'standard' ? 2 : 1;
  const rows = is4Col || is3Col || density === 'micro' ? 6 : density === 'compact' ? 4 : density === 'standard' ? 2 : 2;
  const itemsPerPage = cols * rows; // En ultra 4-col = 24 boletos por hoja

  // Geometría en milímetros
  const marginX = is4Col ? 6 : is3Col ? 7 : 8;
  const marginY = 6;
  const spacingX = 1.5;
  const spacingY = 1.5;

  const ticketWidth = is4Col ? 48 : is3Col ? 64 : 95;
  const ticketHeight = rows === 6 ? 44.5 : rows === 4 ? 66 : 132;

  // Recolectar imágenes QR de los elementos montados en el DOM
  const qrImageMap = new Map<string, string>();
  for (let i = 0; i < tickets.length; i++) {
    const tkt = tickets[i];
    const ticketEl = document.getElementById(`print-ticket-${tkt.id}`) || document.getElementById(`print-ticket-${i}`);
    if (ticketEl) {
      const svg = ticketEl.querySelector('svg');
      if (svg) {
        const pngUrl = await svgToPngDataUrl(svg as unknown as SVGElement, 180);
        if (pngUrl) {
          qrImageMap.set(tkt.id || String(i), pngUrl);
        }
      }
    }
  }

  // Dibujar boletos
  for (let i = 0; i < tickets.length; i++) {
    const tkt = tickets[i];
    const raffle = sorteoMap[tkt.sorteoId];
    const pageIndex = Math.floor(i / itemsPerPage);
    const slot = i % itemsPerPage;

    if (i > 0 && slot === 0) {
      doc.addPage();
    }

    const col = slot % cols;
    const row = Math.floor(slot / cols);
    const x = marginX + col * (ticketWidth + spacingX);
    const y = marginY + row * (ticketHeight + spacingY);

    // Fondo blanco
    doc.setFillColor(255, 255, 255);
    doc.rect(x, y, ticketWidth, ticketHeight, 'F');

    // Borde de corte punteado profesional
    doc.setDrawColor(180, 190, 205);
    doc.setLineDashPattern([1.5, 1.5], 0);
    doc.roundedRect(x, y, ticketWidth, ticketHeight, 1.5, 1.5, 'S');
    doc.setLineDashPattern([], 0);

    // Pequeñas líneas guía en las 4 esquinas para corte preciso con tijeras o guillotina
    const cropLen = 3.5;
    doc.setDrawColor(15, 23, 42); // Gris oscuro / negro sólido
    doc.setLineWidth(0.35);

    // Esquina superior izquierda
    doc.line(x, y, x + cropLen, y);
    doc.line(x, y, x, y + cropLen);

    // Esquina superior derecha
    doc.line(x + ticketWidth, y, x + ticketWidth - cropLen, y);
    doc.line(x + ticketWidth, y, x + ticketWidth, y + cropLen);

    // Esquina inferior izquierda
    doc.line(x, y + ticketHeight, x + cropLen, y + ticketHeight);
    doc.line(x, y + ticketHeight, x, y + ticketHeight - cropLen);

    // Esquina inferior derecha
    doc.line(x + ticketWidth, y + ticketHeight, x + ticketWidth - cropLen, y + ticketHeight);
    doc.line(x + ticketWidth, y + ticketHeight, x + ticketWidth, y + ticketHeight - cropLen);

    // Línea separadora decorativa superior
    doc.setFillColor(37, 99, 235); // azul institucional
    doc.rect(x, y, ticketWidth, 1.2, 'F');

    // Identidad institucional
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(is4Col ? 7 : 8);
    doc.setTextColor(15, 23, 42);
    doc.text(schoolName.substring(0, is4Col ? 24 : 32), x + 2, y + 4.5);

    // Subtítulo oficial
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(is4Col ? 4.8 : 5.5);
    doc.setTextColor(2, 132, 199);
    doc.text('BOLETO OFICIAL DE SORTEO', x + 2, y + 7.5);

    // Título del Sorteo
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(is4Col ? 6.5 : 7.5);
    doc.setTextColor(15, 23, 42);
    const titleText = raffle?.title || 'Sorteo Institucional';
    const splitTitle = doc.splitTextToSize(titleText, is4Col ? 25 : 35);
    doc.text(splitTitle[0], x + 2, y + 11.5);

    // Fecha del sorteo y primer premio
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(is4Col ? 4.8 : 5.5);
    doc.setTextColor(71, 85, 105);
    if (raffle?.drawDate) {
      doc.text(`Fecha: ${raffle.drawDate}`, x + 2, y + 15);
    }
    if (raffle?.prizes && raffle.prizes[0]) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(180, 83, 9);
      doc.text(`Premio: ${raffle.prizes[0].substring(0, is4Col ? 18 : 26)}`, x + 2, y + 18);
    }

    // Participante o líneas en blanco para entrega física
    if (tkt.participantName?.trim()) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(is4Col ? 5.2 : 6);
      doc.setTextColor(30, 41, 59);
      doc.text(`Part: ${tkt.participantName.substring(0, is4Col ? 20 : 28)}`, x + 2, y + 21.5);
      if (tkt.participantPhone?.trim()) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(4.5);
        doc.text(`Tel: ${tkt.participantPhone}`, x + 2, y + 24.5);
      }
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(is4Col ? 4.5 : 5);
      doc.setTextColor(148, 163, 184);
      doc.text('Nombre: ____________________', x + 2, y + 21.5);
      doc.text('Telf: _______________________', x + 2, y + 24.5);
    }

    // Recuadro del Código de 9 Dígitos (Monospace destacado)
    const codeBoxW = is4Col ? 24.5 : 28;
    const codeBoxH = 7.5;
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(x + 2, y + 26.5, codeBoxW, codeBoxH, 1, 1, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(3.8);
    doc.setTextColor(100, 116, 139);
    doc.text('CÓDIGO OFICIAL 9 DÍGITOS', x + 3, y + 29.5);

    const formatted = formatTicketCodeDisplay(tkt.ticketCode);
    doc.setFont('courier', 'bold');
    doc.setFontSize(is4Col ? 7 : 8);
    doc.setTextColor(15, 23, 42);
    doc.text(formatted, x + 3, y + 32.5);

    // Código QR (Lado derecho del boleto)
    const qrSize = is4Col ? 18 : 22;
    const qrX = x + ticketWidth - qrSize - 2;
    const qrY = y + 8.5;

    // Caja blanca para el QR
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(qrX, qrY, qrSize, qrSize, 1, 1, 'FD');

    const qrPng = qrImageMap.get(tkt.id || String(i));
    if (qrPng) {
      doc.addImage(qrPng, 'PNG', qrX + 0.8, qrY + 0.8, qrSize - 1.6, qrSize - 1.6);
    }

    // Leyenda debajo del QR
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(3.6);
    doc.setTextColor(100, 116, 139);
    doc.text('Escanea para verificar', qrX + (qrSize / 2), qrY + qrSize + 3, { align: 'center' });
    doc.text('en la web oficial', qrX + (qrSize / 2), qrY + qrSize + 5, { align: 'center' });
  }

  // Guardar archivo PDF
  const totalSheets = Math.ceil(tickets.length / itemsPerPage);
  const pdfName = `boletos_sorteo_${tickets.length}_tickets_${totalSheets}_hojas.pdf`;
  doc.save(pdfName);
}
