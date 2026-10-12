import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import { Sorteo, SorteoTicket } from '../types/sorteo';
import { formatTicketCodeDisplay, normalizeTicketCode } from './sorteoSecurity';
import { getSorteoQrUrl } from './domainConfig';

/**
 * Convierte un elemento SVG en una imagen PNG DataURL nítida mediante canvas offscreen.
 * Mantenido para retrocompatibilidad con inventoryPdfGenerator.
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
  publicDomain?: string;
  containerElement?: HTMLElement | null;
}

/**
 * Generador oficial de boletos en PDF A4 con soporte para múltiples páginas.
 * Captura directamente los elementos del DOM renderizados mediante html2canvas
 * para garantizar que el PDF sea 100% IDÉNTICO a lo que se ve en la pantalla.
 */
export async function generateSorteoTicketsPdf({
  tickets,
  sorteoMap,
  schoolName = 'U.E. Virgen del Cisne',
  density = 'standard',
  columns = '4',
  publicDomain,
  containerElement
}: GeneratePdfOptions): Promise<void> {
  if (!tickets || tickets.length === 0) return;

  // CAPTURA 100% FIEL DE LA PANTALLA: Si se proporciona el contenedor con los boletos renderizados
  if (containerElement) {
    const ticketNodes = Array.from(containerElement.querySelectorAll<HTMLElement>('.print-ticket-item'));
    if (ticketNodes.length > 0) {
      try {
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
          compress: true
        });

        // Configuración de cuadrícula idéntica a la vista en pantalla
        let cols = 1;
        let rows = 4;
        let ticketW = 194;
        let ticketH = 65;
        let marginX = 8;
        let marginY = 8;
        let gapX = 0;
        let gapY = 3.5;

        if (density === 'standard') {
          cols = 1;
          rows = 4;
          ticketW = 194;
          ticketH = 65;
          marginX = 8;
          marginY = 8;
          gapX = 0;
          gapY = 3.5;
        } else if (density === 'compact') {
          cols = 2;
          rows = 4;
          ticketW = 96;
          ticketH = 66;
          marginX = 7;
          marginY = 7;
          gapX = 4;
          gapY = 3;
        } else if (density === 'micro') {
          cols = 2;
          rows = 6;
          ticketW = 96;
          ticketH = 44.5;
          marginX = 7;
          marginY = 7;
          gapX = 4;
          gapY = 2;
        } else if (density === 'ultra') {
          if (columns === '3') {
            cols = 3;
            rows = 6;
            ticketW = 63;
            ticketH = 44.5;
            marginX = 7;
            marginY = 7;
            gapX = 3;
            gapY = 2;
          } else {
            cols = 4;
            rows = 6;
            ticketW = 46.5;
            ticketH = 44.5;
            marginX = 7;
            marginY = 7;
            gapX = 2.5;
            gapY = 2;
          }
        }

        const itemsPerPage = cols * rows;

        for (let i = 0; i < ticketNodes.length; i++) {
          const node = ticketNodes[i];
          const slot = i % itemsPerPage;
          if (i > 0 && slot === 0) {
            doc.addPage();
          }

          const col = slot % cols;
          const row = Math.floor(slot / cols);
          const x = marginX + col * (ticketW + gapX);
          const y = marginY + row * (ticketH + gapY);

          const canvas = await html2canvas(node, {
            scale: 2.5,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
          });
          const imgData = canvas.toDataURL('image/png');
          doc.addImage(imgData, 'PNG', x, y, ticketW, ticketH, undefined, 'FAST');
        }

        doc.save(`boletos_sorteo_${Date.now()}.pdf`);
        return;
      } catch (err) {
        console.warn('Error en captura html2canvas, usando generador vectorial nativo:', err);
      }
    }
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const is4Col = density === 'ultra' && columns === '4';
  const is3Col = density === 'ultra' && columns === '3';

  // Configuración de cuadrícula según densidad seleccionada
  let cols = 2;
  let rows = 6;
  let ticketWidth = 96;
  let ticketHeight = 44.5;
  let marginX = 7.5;
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

  // Generar códigos QR directamente de alta resolución sin depender del DOM
  const qrCacheByCode = new Map<string, string>();
  await Promise.all(
    tickets.map(async (tkt) => {
      const cleanCode = normalizeTicketCode(tkt.ticketCode);
      if (!qrCacheByCode.has(cleanCode)) {
        try {
          const qrUrl = getSorteoQrUrl(cleanCode, publicDomain);
          const dataUrl = await QRCode.toDataURL(qrUrl, {
            margin: 1,
            width: 200,
            errorCorrectionLevel: 'M',
            color: { dark: '#0f172a', light: '#ffffff' }
          });
          qrCacheByCode.set(cleanCode, dataUrl);
          qrCacheByCode.set(tkt.ticketCode, dataUrl);
        } catch {
          // fallback
        }
      }
    })
  );

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
      // Formato compacto (66mm de alto × 96mm de ancho: 8 boletos por hoja en 2 columnas)
      const stubWidth = 34;

      // Línea de perforación entre talón y boleto
      doc.setDrawColor(148, 163, 184);
      doc.setLineDashPattern([1, 1], 0);
      doc.line(x + stubWidth, y, x + stubWidth, y + ticketHeight);
      doc.setLineDashPattern([], 0);

      // TALÓN DE CONTROL (Lado Izquierdo)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(15, 23, 42);
      doc.text('TALÓN DE CONTROL', x + 2, y + 5);
      doc.setFontSize(5);
      doc.setTextColor(2, 132, 199);
      doc.text('Ánfora Oficial', x + 2, y + 8.5);

      doc.setFont('courier', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.text(`N° ${formattedCode}`, x + 2, y + 14);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5);
      doc.setTextColor(71, 85, 105);
      doc.text('Nombre:', x + 2, y + 20);
      doc.text(tkt.participantName?.substring(0, 20) || '____________________', x + 2, y + 24);
      doc.text('Teléfono:', x + 2, y + 30);
      doc.text(tkt.participantPhone?.substring(0, 20) || '____________________', x + 2, y + 34);
      doc.text('Cédula:', x + 2, y + 40);
      doc.text('____________________', x + 2, y + 44);
      doc.text('Firma:', x + 2, y + 51);
      doc.text('____________________', x + 2, y + 58);

      // Marca de corte ✂
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(148, 163, 184);
      doc.text('✂', x + stubWidth - 1, y + 33);

      // BOLETO DEL COMPRADOR (Lado Derecho)
      const bodyX = x + stubWidth + 3;
      const bodyW = ticketWidth - stubWidth - 5;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(schoolName.substring(0, 28), bodyX, y + 5.5);

      doc.setFontSize(5.5);
      doc.setTextColor(2, 132, 199);
      doc.text('BOLETO OFICIAL DE SORTEO', bodyX, y + 9);

      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      const splitTitle = doc.splitTextToSize(raffle?.title || 'Sorteo Institucional', bodyW - 25);
      doc.text(splitTitle[0], bodyX, y + 14.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.2);
      doc.setTextColor(71, 85, 105);
      if (raffle?.drawDate) doc.text(`Fecha: ${raffle.drawDate}`, bodyX, y + 19.5);
      if (raffle?.prizes?.[0]) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(180, 83, 9);
        doc.text(`Premio: ${raffle.prizes[0].substring(0, 26)}`, bodyX, y + 23.5);
      }

      // Código de 9 dígitos
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(bodyX, y + 38, 30, 9.5, 1, 1, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(4.2);
      doc.setTextColor(100, 116, 139);
      doc.text('CÓDIGO 9 DÍGITOS', bodyX + 2, y + 41.5);
      doc.setFont('courier', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(formattedCode, bodyX + 2, y + 45.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(4);
      doc.setTextColor(5, 150, 105);
      doc.text('✓ Boleto del Comprador', bodyX, y + 52);
      doc.setTextColor(100, 116, 139);
      doc.text('Conserve para reclamar premio', bodyX, y + 56);

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

    } else if (density === 'micro') {
      // Formato micro (44.5mm de alto × 96mm de ancho: 12 boletos por hoja en 2 columnas)
      const stubWidth = 32;

      // Línea de perforación entre talón y boleto
      doc.setDrawColor(148, 163, 184);
      doc.setLineDashPattern([1, 1], 0);
      doc.line(x + stubWidth, y, x + stubWidth, y + ticketHeight);
      doc.setLineDashPattern([], 0);

      // TALÓN DE CONTROL (Lado Izquierdo)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(15, 23, 42);
      doc.text('TALÓN DE CONTROL', x + 2, y + 4.5);
      doc.setFontSize(4.8);
      doc.setTextColor(2, 132, 199);
      doc.text('Ánfora Oficial', x + 2, y + 7.5);

      doc.setFont('courier', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`N° ${formattedCode}`, x + 2, y + 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(4.8);
      doc.setTextColor(71, 85, 105);
      doc.text('Nombre:', x + 2, y + 17);
      doc.text(tkt.participantName?.substring(0, 18) || '__________________', x + 2, y + 21);
      doc.text('Teléf:', x + 2, y + 26);
      doc.text(tkt.participantPhone?.substring(0, 18) || '__________________', x + 2, y + 30);
      doc.text('Cédula: __________________', x + 2, y + 35);
      doc.text('Firma:  __________________', x + 2, y + 40);

      // Marca de corte ✂
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.setTextColor(148, 163, 184);
      doc.text('✂', x + stubWidth - 0.8, y + 22);

      // BOLETO DEL COMPRADOR (Lado Derecho)
      const bodyX = x + stubWidth + 3;
      const bodyW = ticketWidth - stubWidth - 5;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(schoolName.substring(0, 26), bodyX, y + 4.5);

      doc.setFontSize(5);
      doc.setTextColor(2, 132, 199);
      doc.text('BOLETO OFICIAL DE SORTEO', bodyX, y + 7.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      const splitTitle = doc.splitTextToSize(raffle?.title || 'Sorteo Institucional', bodyW - 24);
      doc.text(splitTitle[0], bodyX, y + 11.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(4.8);
      doc.setTextColor(71, 85, 105);
      if (raffle?.drawDate) doc.text(`Fecha: ${raffle.drawDate}`, bodyX, y + 15.5);
      if (raffle?.prizes?.[0]) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(180, 83, 9);
        doc.text(`Premio: ${raffle.prizes[0].substring(0, 22)}`, bodyX, y + 19);
      }

      // Código de 9 dígitos
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(bodyX, y + 24, 28, 8, 1, 1, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(4);
      doc.setTextColor(100, 116, 139);
      doc.text('CÓDIGO OFICIAL 9 DÍGITOS', bodyX + 2, y + 27);
      doc.setFont('courier', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(formattedCode, bodyX + 2, y + 30.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(3.8);
      doc.setTextColor(5, 150, 105);
      doc.text('✓ Comprador • Guardar para reclamar', bodyX, y + 35);

      // QR Mediano
      const qrSize = 21;
      const qrX = x + ticketWidth - qrSize - 3;
      const qrY = y + 8;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(qrX, qrY, qrSize, qrSize, 1, 1, 'FD');
      if (qrPng) {
        doc.addImage(qrPng, 'PNG', qrX + 0.8, qrY + 0.8, qrSize - 1.6, qrSize - 1.6);
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(3.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Escanea con celular', qrX + (qrSize / 2), qrY + qrSize + 2.5, { align: 'center' });

    } else {
      // Formato ultra (44.5mm de alto: 24 boletos en 4 columnas o 18 en 3 columnas)
      const stubWidth = is4Col ? 17 : 22;

      // Línea de perforación entre talón y boleto
      doc.setDrawColor(148, 163, 184);
      doc.setLineDashPattern([0.8, 0.8], 0);
      doc.line(x + stubWidth, y, x + stubWidth, y + ticketHeight);
      doc.setLineDashPattern([], 0);

      // TALÓN DE CONTROL (Lado Izquierdo)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(is4Col ? 5 : 6);
      doc.setTextColor(15, 23, 42);
      doc.text('TALÓN', x + 1.5, y + 4);
      doc.setFontSize(is4Col ? 4 : 4.8);
      doc.setTextColor(2, 132, 199);
      doc.text('Ánfora', x + 1.5, y + 6.8);

      doc.setFont('courier', 'bold');
      doc.setFontSize(is4Col ? 5.5 : 6.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`#${formattedCode.slice(-5)}`, x + 1.5, y + 10.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(is4Col ? 4 : 4.5);
      doc.setTextColor(71, 85, 105);
      doc.text('Nom:', x + 1.5, y + 15);
      doc.text(tkt.participantName?.substring(0, is4Col ? 9 : 12) || '______', x + 1.5, y + 18.5);
      doc.text('Tel:', x + 1.5, y + 23);
      doc.text(tkt.participantPhone?.substring(0, is4Col ? 9 : 12) || '______', x + 1.5, y + 26.5);

      // Marca de corte ✂
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(4.5);
      doc.setTextColor(148, 163, 184);
      doc.text('✂', x + stubWidth - 0.7, y + 22);

      // BOLETO DEL COMPRADOR (Lado Derecho)
      const bodyX = x + stubWidth + 2;
      const bodyW = ticketWidth - stubWidth - 3;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(is4Col ? 6 : 7);
      doc.setTextColor(15, 23, 42);
      doc.text(schoolName.substring(0, is4Col ? 15 : 22), bodyX, y + 4);

      doc.setFontSize(is4Col ? 4.2 : 4.8);
      doc.setTextColor(2, 132, 199);
      doc.text('BOLETO OFICIAL', bodyX, y + 7);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(is4Col ? 5.5 : 6.5);
      doc.setTextColor(15, 23, 42);
      const splitTitle = doc.splitTextToSize(raffle?.title || 'Sorteo', is4Col ? 15 : 22);
      doc.text(splitTitle[0], bodyX, y + 10.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(is4Col ? 4 : 4.5);
      doc.setTextColor(71, 85, 105);
      if (raffle?.drawDate) {
        doc.text(`Fec: ${raffle.drawDate.substring(0, 10)}`, bodyX, y + 14);
      }

      // Código de 9 Dígitos
      const codeBoxW = is4Col ? 17 : 22;
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(bodyX, y + 26, codeBoxW, 7, 0.8, 0.8, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(3.5);
      doc.setTextColor(100, 116, 139);
      doc.text('9 DÍGITOS', bodyX + 1.5, y + 28.5);

      doc.setFont('courier', 'bold');
      doc.setFontSize(is4Col ? 5.8 : 6.8);
      doc.setTextColor(15, 23, 42);
      doc.text(formattedCode, bodyX + 1.5, y + 31.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(3.5);
      doc.setTextColor(5, 150, 105);
      doc.text('✓ Comprador', bodyX, y + 36.5);

      // QR Code
      const qrSize = is4Col ? 16 : 19;
      const qrX = x + ticketWidth - qrSize - 1.5;
      const qrY = y + 7.5;

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(qrX, qrY, qrSize, qrSize, 0.8, 0.8, 'FD');

      if (qrPng) {
        doc.addImage(qrPng, 'PNG', qrX + 0.6, qrY + 0.6, qrSize - 1.2, qrSize - 1.2);
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(3.2);
      doc.setTextColor(100, 116, 139);
      doc.text('QR Verificación', qrX + (qrSize / 2), qrY + qrSize + 2.5, { align: 'center' });
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
