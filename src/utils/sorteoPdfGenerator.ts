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
 * Generador nativo vectorial de boletos en PDF A4 con soporte para múltiples páginas.
 * Garantiza que la primera página y todas las siguientes mantengan la misma alineación,
 * guías de corte en esquinas para tijeras/guillotina y numeración de hojas.
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

  const is4Col = density === 'ultra' && columns === '4';
  const is3Col = density === 'ultra' && columns === '3';

  // Configuración de cuadrícula según densidad seleccionada
  let cols = 4;
  let rows = 6;
  let ticketWidth = 48;
  let ticketHeight = 44.5;
  let marginX = 6;
  const marginY = 6;
  const spacingX = 1.5;
  const spacingY = 1.5;

  if (density === 'ultra') {
    if (is3Col) {
      cols = 3;
      rows = 6;
      ticketWidth = 64;
      ticketHeight = 44.5;
      marginX = 7;
    } else {
      cols = 4;
      rows = 6;
      ticketWidth = 48;
      ticketHeight = 44.5;
      marginX = 6;
    }
  } else if (density === 'micro') {
    cols = 2;
    rows = 6;
    ticketWidth = 96;
    ticketHeight = 44.5;
    marginX = 7.5;
  } else if (density === 'compact') {
    cols = 2;
    rows = 4;
    ticketWidth = 96;
    ticketHeight = 66;
    marginX = 7.5;
  } else if (density === 'standard') {
    cols = 2;
    rows = 2;
    ticketWidth = 96;
    ticketHeight = 132;
    marginX = 7.5;
  } else {
    // large
    cols = 1;
    rows = 2;
    ticketWidth = 194;
    ticketHeight = 132;
    marginX = 8;
  }

  const itemsPerPage = cols * rows;
  const totalSheets = Math.ceil(tickets.length / itemsPerPage);

  // Recolectar y cachear códigos QR por ticketCode para optimizar memoria y tiempo
  const qrCacheByCode = new Map<string, string>();
  const allSvgs = Array.from(document.querySelectorAll('.printable-tickets-wrapper svg'));

  // Indexar SVGs del DOM
  for (let i = 0; i < tickets.length; i++) {
    const tkt = tickets[i];
    if (qrCacheByCode.has(tkt.ticketCode)) continue;

    // Buscar por ID específico
    const ticketEl = document.getElementById(`print-ticket-${tkt.id}`) || document.getElementById(`print-ticket-${i}`);
    let svgEl = ticketEl?.querySelector('svg');

    // Fallback: buscar por coincidencia en la lista de SVGs
    if (!svgEl && allSvgs.length > 0) {
      svgEl = allSvgs[i % allSvgs.length] as SVGSVGElement;
    }

    if (svgEl) {
      const pngUrl = await svgToPngDataUrl(svgEl as unknown as SVGElement, 180);
      if (pngUrl) {
        qrCacheByCode.set(tkt.ticketCode, pngUrl);
      }
    }
  }

  // Dibujar boletos en cada hoja y páginas subsiguientes
  for (let i = 0; i < tickets.length; i++) {
    const tkt = tickets[i];
    const raffle = sorteoMap[tkt.sorteoId];
    const slot = i % itemsPerPage;

    // Salto de página para hojas subsiguientes
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

    // Borde de corte punteado perimetral
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

    // Línea de acento institucional superior
    doc.setFillColor(37, 99, 235);
    doc.rect(x, y, ticketWidth, 1.2, 'F');

    const formattedCode = formatTicketCodeDisplay(tkt.ticketCode);
    const qrPng = qrCacheByCode.get(tkt.ticketCode);

    // Renderizado según formato y altura
    if (density === 'standard' || density === 'large') {
      // Formato grande con talón perforado de control
      const stubWidth = 36;

      // Línea de perforación entre talón y boleto
      doc.setDrawColor(148, 163, 184);
      doc.setLineDashPattern([1, 1], 0);
      doc.line(x + stubWidth, y, x + stubWidth, y + ticketHeight);
      doc.setLineDashPattern([], 0);

      // TALÓN DE CONTROL (Lado Izquierdo)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.text('TALÓN DE CONTROL', x + 2, y + 6);
      doc.setFontSize(5.5);
      doc.setTextColor(2, 132, 199);
      doc.text('Ánfora Oficial', x + 2, y + 10);

      doc.setFont('courier', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`N° ${formattedCode}`, x + 2, y + 16);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.setTextColor(71, 85, 105);
      doc.text('Nombre:', x + 2, y + 24);
      doc.text(tkt.participantName || '_______________________', x + 2, y + 29);
      doc.text('Cédula:', x + 2, y + 36);
      doc.text('_______________________', x + 2, y + 41);
      doc.text('Teléfono:', x + 2, y + 48);
      doc.text(tkt.participantPhone || '_______________________', x + 2, y + 53);
      doc.text('Firma:', x + 2, y + 63);
      doc.text('_______________________', x + 2, y + 73);

      // CUERPO PRINCIPAL DEL BOLETO (Lado Derecho)
      const bodyX = x + stubWidth + 4;
      const bodyW = ticketWidth - stubWidth - 6;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(schoolName, bodyX, y + 7);

      doc.setFontSize(6.5);
      doc.setTextColor(2, 132, 199);
      doc.text('BOLETO OFICIAL DE SORTEO INSTITUCIONAL', bodyX, y + 12);

      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      const titleSplits = doc.splitTextToSize(raffle?.title || 'Sorteo Institucional', bodyW - 32);
      doc.text(titleSplits, bodyX, y + 19);

      if (raffle?.drawDate) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(71, 85, 105);
        doc.text(`Fecha del sorteo: ${raffle.drawDate}`, bodyX, y + 28);
      }

      if (raffle?.prizes && raffle.prizes.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(180, 83, 9);
        doc.text(`Premios: ${raffle.prizes.slice(0, 3).join(' • ')}`, bodyX, y + 34);
      }

      // Código de 9 dígitos
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(bodyX, y + 42, 42, 12, 1.5, 1.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5);
      doc.setTextColor(100, 116, 139);
      doc.text('CÓDIGO DE SEGURIDAD', bodyX + 3, y + 46);
      doc.setFont('courier', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(formattedCode, bodyX + 3, y + 51);

      // QR Grande
      const bigQrSize = 28;
      const bigQrX = x + ticketWidth - bigQrSize - 4;
      const bigQrY = y + 16;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(bigQrX, bigQrY, bigQrSize, bigQrSize, 1.5, 1.5, 'FD');
      if (qrPng) {
        doc.addImage(qrPng, 'PNG', bigQrX + 1, bigQrY + 1, bigQrSize - 2, bigQrSize - 2);
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(4.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Escanea para verificar', bigQrX + (bigQrSize / 2), bigQrY + bigQrSize + 4, { align: 'center' });
      doc.text('en la web oficial', bigQrX + (bigQrSize / 2), bigQrY + bigQrSize + 7, { align: 'center' });

    } else if (density === 'compact') {
      // Formato compacto (66mm de alto)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(schoolName.substring(0, 32), x + 2, y + 5);

      doc.setFontSize(5.5);
      doc.setTextColor(2, 132, 199);
      doc.text('BOLETO OFICIAL DE SORTEO', x + 2, y + 8.5);

      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      const splitTitle = doc.splitTextToSize(raffle?.title || 'Sorteo Institucional', 60);
      doc.text(splitTitle[0], x + 2, y + 13.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.setTextColor(71, 85, 105);
      if (raffle?.drawDate) doc.text(`Fecha: ${raffle.drawDate}`, x + 2, y + 18);
      if (raffle?.prizes?.[0]) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(180, 83, 9);
        doc.text(`Premio: ${raffle.prizes[0].substring(0, 32)}`, x + 2, y + 22);
      }

      // Datos participante
      if (tkt.participantName?.trim()) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(30, 41, 59);
        doc.text(`Part: ${tkt.participantName.substring(0, 30)}`, x + 2, y + 28);
        if (tkt.participantPhone?.trim()) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(5.5);
          doc.text(`Tel: ${tkt.participantPhone}`, x + 2, y + 33);
        }
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5);
        doc.setTextColor(148, 163, 184);
        doc.text('Nombre: ____________________________', x + 2, y + 28);
        doc.text('Telf: _______________________________', x + 2, y + 33);
      }

      // Código de 9 dígitos
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(x + 2, y + 42, 36, 10, 1, 1, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(4.5);
      doc.setTextColor(100, 116, 139);
      doc.text('CÓDIGO OFICIAL 9 DÍGITOS', x + 3, y + 46);
      doc.setFont('courier', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(formattedCode, x + 3, y + 50.5);

      // QR Mediano
      const qrSize = 24;
      const qrX = x + ticketWidth - qrSize - 3;
      const qrY = y + 14;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(qrX, qrY, qrSize, qrSize, 1, 1, 'FD');
      if (qrPng) {
        doc.addImage(qrPng, 'PNG', qrX + 0.8, qrY + 0.8, qrSize - 1.6, qrSize - 1.6);
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(3.8);
      doc.setTextColor(100, 116, 139);
      doc.text('Escanea para verificar', qrX + (qrSize / 2), qrY + qrSize + 3, { align: 'center' });

    } else {
      // Formato ultra y micro (44.5mm de alto: 24, 18 o 12 por hoja)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(is4Col ? 7 : 8);
      doc.setTextColor(15, 23, 42);
      doc.text(schoolName.substring(0, is4Col ? 24 : 34), x + 2, y + 4.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(is4Col ? 4.8 : 5.5);
      doc.setTextColor(2, 132, 199);
      doc.text('BOLETO OFICIAL DE SORTEO', x + 2, y + 7.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(is4Col ? 6.5 : 7.5);
      doc.setTextColor(15, 23, 42);
      const titleText = raffle?.title || 'Sorteo Institucional';
      const splitTitle = doc.splitTextToSize(titleText, is4Col ? 25 : 36);
      doc.text(splitTitle[0], x + 2, y + 11.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(is4Col ? 4.8 : 5.5);
      doc.setTextColor(71, 85, 105);
      if (raffle?.drawDate) {
        doc.text(`Fecha: ${raffle.drawDate}`, x + 2, y + 15);
      }
      if (raffle?.prizes && raffle.prizes[0]) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(180, 83, 9);
        doc.text(`Premio: ${raffle.prizes[0].substring(0, is4Col ? 18 : 28)}`, x + 2, y + 18);
      }

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

      // Recuadro del Código de 9 Dígitos
      const codeBoxW = is4Col ? 24.5 : 28;
      const codeBoxH = 7.5;
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(x + 2, y + 26.5, codeBoxW, codeBoxH, 1, 1, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(3.8);
      doc.setTextColor(100, 116, 139);
      doc.text('CÓDIGO OFICIAL 9 DÍGITOS', x + 3, y + 29.5);

      doc.setFont('courier', 'bold');
      doc.setFontSize(is4Col ? 7 : 8);
      doc.setTextColor(15, 23, 42);
      doc.text(formattedCode, x + 3, y + 32.5);

      // Código QR
      const qrSize = is4Col ? 18 : 22;
      const qrX = x + ticketWidth - qrSize - 2;
      const qrY = y + 8.5;

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(qrX, qrY, qrSize, qrSize, 1, 1, 'FD');

      if (qrPng) {
        doc.addImage(qrPng, 'PNG', qrX + 0.8, qrY + 0.8, qrSize - 1.6, qrSize - 1.6);
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(3.6);
      doc.setTextColor(100, 116, 139);
      doc.text('Escanea para verificar', qrX + (qrSize / 2), qrY + qrSize + 3, { align: 'center' });
      doc.text('en la web oficial', qrX + (qrSize / 2), qrY + qrSize + 5, { align: 'center' });
    }
  }

  // Numeración de páginas en el pie de cada hoja (página 1 y todas las siguientes)
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Hoja ${p} de ${totalPages} • ${schoolName} • Planilla Oficial de Boletos (${density.toUpperCase()})`,
      105,
      293,
      { align: 'center' }
    );
  }

  // Guardar archivo PDF con nombre descriptivo
  const pdfName = `boletos_sorteo_${tickets.length}_tickets_${totalPages}_hojas.pdf`;
  doc.save(pdfName);
}
