import { Award } from '../types/award';
import { ResultRow, Survey } from '../types/domain';
import { getStoredLanguage } from '../i18n/translations';

type CertificateWinner = {
  result: ResultRow;
  position: number;
  award?: Award;
};

type CertificateInput = {
  survey: Survey;
  winners: CertificateWinner[];
};

const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;

const PDF_COLORS = {
  white: '1 1 1',
  brand50: '0.93 0.95 1',
  brand700: '0.26 0.22 0.79',
  ink: '0.07 0.09 0.15',
  muted: '0.42 0.45 0.55',
  gold: '0.84 0.65 0.12',
  goldLight: '0.98 0.95 0.82',
  silver: '0.63 0.65 0.68',
  silverLight: '0.91 0.92 0.94',
  bronze: '0.71 0.43 0.18',
  bronzeLight: '0.97 0.91 0.82',
};

type PositionTheme = {
  label: string;
  medal: string;
  medalLight: string;
  panelBg: string;
  heading: string;
};

const POSITION_THEMES: Record<number, PositionTheme> = {
  1: {
    label: 'GOLD',
    medal: PDF_COLORS.gold,
    medalLight: PDF_COLORS.goldLight,
    panelBg: PDF_COLORS.brand700,
    heading: PDF_COLORS.brand700,
  },
  2: {
    label: 'SILVER',
    medal: PDF_COLORS.silver,
    medalLight: PDF_COLORS.silverLight,
    panelBg: '0.24 0.29 0.42',
    heading: '0.24 0.29 0.42',
  },
  3: {
    label: 'BRONZE',
    medal: PDF_COLORS.bronze,
    medalLight: PDF_COLORS.bronzeLight,
    panelBg: PDF_COLORS.brand700,
    heading: '0.50 0.26 0.10',
  },
};

const awardTypeLabel: Record<string, { en: string; es: string }> = {
  cash: { en: 'Cash award', es: 'Premio economico' },
  trophy: { en: 'Trophy', es: 'Trofeo' },
  recognition: { en: 'Recognition', es: 'Reconocimiento' },
  sponsor: { en: 'Sponsor award', es: 'Premio de patrocinador' },
  other: { en: 'Award', es: 'Premio' }
};

function safeText(text: string) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function pdfLiteral(text: string) {
  const escaped = safeText(text)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
  return `(${escaped})`;
}

function slug(text: string) {
  return safeText(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function ordinal(position: number, language: 'en' | 'es') {
  if (language === 'es') {
    if (position === 1) return 'Primer lugar';
    if (position === 2) return 'Segundo lugar';
    if (position === 3) return 'Tercer lugar';
    return `Puesto ${position}`;
  }
  if (position === 1) return '1st Place';
  if (position === 2) return '2nd Place';
  if (position === 3) return '3rd Place';
  return `${position}th Place`;
}

function textLine(text: string, x: number, y: number, size = 14, font = 'F1', color = '0.12 0.13 0.18') {
  return `BT /${font} ${size} Tf ${color} rg ${x.toFixed(2)} ${y.toFixed(2)} Td ${pdfLiteral(text)} Tj ET`;
}

// Adapts width multiplier based on uppercase ratio (uppercase Helvetica chars are ~25% wider than lowercase)
function estimateTextWidth(text: string, size: number) {
  const clean = safeText(text);
  if (!clean.length) return 0;
  const upperCount = (clean.match(/[A-Z]/g) ?? []).length;
  const ratio = upperCount / clean.length;
  return clean.length * size * (0.54 + ratio * 0.14);
}

function fitFontSize(text: string, size: number, maxWidth: number, minSize = 9) {
  let fitted = size;
  while (estimateTextWidth(text, fitted) > maxWidth && fitted > minSize) {
    fitted -= 1;
  }
  return fitted;
}

function centerText(text: string, y: number, size = 14, font = 'F1', color = '0.12 0.13 0.18') {
  const cleanText = safeText(text);
  const x = (PAGE_WIDTH - estimateTextWidth(cleanText, size)) / 2;
  return textLine(cleanText, x, y, size, font, color);
}

function centerFitText(text: string, y: number, size = 14, maxWidth = 680, font = 'F1', color = '0.12 0.13 0.18') {
  const cleanText = safeText(text);
  const fittedSize = fitFontSize(cleanText, size, maxWidth);
  const x = (PAGE_WIDTH - estimateTextWidth(cleanText, fittedSize)) / 2;
  return textLine(cleanText, x, y, fittedSize, font, color);
}

function centerInRegion(text: string, regionX: number, regionW: number, y: number, size: number, font: string, color: string) {
  const cleanText = safeText(text);
  const fittedSize = fitFontSize(cleanText, size, regionW - 8);
  const x = regionX + (regionW - estimateTextWidth(cleanText, fittedSize)) / 2;
  return textLine(cleanText, Math.max(regionX + 4, x), y, fittedSize, font, color);
}

function wrap(text: string, maxChars: number) {
  const words = safeText(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function pageContent({ result, position, award }: CertificateWinner, survey: Survey) {
  const language = getStoredLanguage();
  const isEnglish = language === 'en';
  const theme = POSITION_THEMES[position] ?? POSITION_THEMES[1];
  const competitionName = survey.competicion?.nombre ?? (isEnglish ? 'Competition' : 'Competicion');
  const eventName = survey.competicion?.evento?.nombre ?? (isEnglish ? 'Event' : 'Evento');
  const projectName = result.proyecto?.nombre ?? `${isEnglish ? 'Project' : 'Proyecto'} ${result.proyecto_id}`;
  const teamName = result.proyecto?.equipo?.nombre;
  const score = result.puntaje_manual ?? result.puntaje_calculado ?? 0;
  const generatedDate = new Date().toLocaleDateString(isEnglish ? 'en-US' : 'es-ES', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  // Layout — centered white box on brand50 page
  // White box:  x=36, y=36, w=770, h=523  →  y spans 36–559
  // Header bar: x=36, y=503, w=770, h=56  →  visual top of white box
  // Medal strip (5px): y=498–503
  // Medal badge (centered, 28px): y=462–490
  // Content: y=36–460
  //   Cards: y=84–248   (164px tall)
  //   Divider: y=253–255
  //   Text above divider: y=265–460

  // Position badge — centered horizontally
  const BADGE_W = 150;
  const BADGE_Y = 462;
  const BADGE_H = 28;
  const badgeX = (PAGE_WIDTH - BADGE_W) / 2; // 346

  const SCORE_X = 55;
  const SCORE_W = 230;
  const AWARD_X = 303;
  const AWARD_W = 484;
  const CARD_Y = 84;
  const CARD_H = 164;

  const lines: string[] = [
    // Page background (light brand tint)
    `q ${PDF_COLORS.brand50} rg 0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT} re f Q`,
    // White main area — no stroke border
    `q 1 1 1 rg 36 36 770 523 re f Q`,
    // Header bar (dark brand)
    `q ${theme.panelBg} rg 36 503 770 56 re f Q`,
    // Medal accent strip below header
    `q ${theme.medal} rg 36 498 770 5 re f Q`,
    // Thin medal accent at bottom edge of white area
    `q ${theme.medal} rg 36 36 770 4 re f Q`,
    // Thin medal strips on left and right edges of white area
    `q ${theme.medal} rg 36 40 4 458 re f Q`,
    `q ${theme.medal} rg 802 40 4 458 re f Q`,
    // Score card fill — medal light, no stroke
    `q ${theme.medalLight} rg ${SCORE_X} ${CARD_Y} ${SCORE_W} ${CARD_H} re f Q`,
    // Award card fill — brand50, no stroke
    `q ${PDF_COLORS.brand50} rg ${AWARD_X} ${CARD_Y} ${AWARD_W} ${CARD_H} re f Q`,
    // Position badge — centered, medal color rectangle
    `q ${theme.medal} rg ${badgeX} ${BADGE_Y} ${BADGE_W} ${BADGE_H} re f Q`,

    // === HEADER — left-aligned brand, ordinal centered ===
    textLine('Votify', 52, 540, 18, 'F2', PDF_COLORS.white),
    textLine(
      isEnglish ? 'Official winner certificate' : 'Certificado oficial de ganador',
      52, 517, 11, 'F1', PDF_COLORS.white
    ),
    centerText(ordinal(position, language), 528, 13, 'F2', theme.medal),

    // === POSITION BADGE (centered, below header accent) ===
    centerInRegion(ordinal(position, language), badgeX, BADGE_W, BADGE_Y + 10, 11, 'F2', PDF_COLORS.ink),

    // === CERTIFICATE CONTENT ===
    centerText(isEnglish ? 'CERTIFICATE OF' : 'CERTIFICADO DE', 449, 9, 'F2', theme.medal),
    centerText(isEnglish ? 'ACHIEVEMENT' : 'RECONOCIMIENTO', 422, 22, 'F2', theme.heading),
    centerText(
      isEnglish ? 'This certificate is awarded to' : 'Este certificado se otorga a',
      390, 11, 'F1', PDF_COLORS.muted
    ),
    centerFitText(projectName, 349, 28, 700, 'F2', PDF_COLORS.ink),
  ];

  // Team, competition, survey info
  let nextY = 319;
  if (teamName) {
    lines.push(centerText(`${isEnglish ? 'Team' : 'Equipo'}: ${safeText(teamName)}`, nextY, 10, 'F1', PDF_COLORS.muted));
    nextY -= 22;
  }
  lines.push(
    centerFitText(`${safeText(competitionName)} — ${safeText(eventName)}`, nextY, 12, 660, 'F2', theme.heading),
    centerFitText(
      `${isEnglish ? 'Survey' : 'Encuesta'}: ${safeText(survey.nombre)}`,
      nextY - 20, 10, 660, 'F1', PDF_COLORS.muted
    ),
  );

  // Medal color horizontal divider between text and cards
  lines.push(`q ${theme.medal} rg 52 253 738 2 re f Q`);

  // === SCORE CARD ===
  const cardLabelY = CARD_Y + CARD_H - 18;       // 230
  const scoreValueY = CARD_Y + Math.round(CARD_H * 0.50); // 166
  lines.push(
    textLine(isEnglish ? 'Winning Score' : 'Puntaje Ganador', SCORE_X + 14, cardLabelY, 9, 'F2', theme.heading),
    textLine(score.toFixed(2), SCORE_X + 14, scoreValueY, 34, 'F2', PDF_COLORS.ink),
    textLine(isEnglish ? 'points' : 'puntos', SCORE_X + 14, CARD_Y + 12, 9, 'F1', PDF_COLORS.muted),
  );

  // === AWARD CARD ===
  const awardLabelY = CARD_Y + CARD_H - 18;      // 230
  if (award) {
    const typeLabel = awardTypeLabel[award.tipo]?.[language] ?? (isEnglish ? 'Award' : 'Premio');
    lines.push(
      textLine(isEnglish ? 'Assigned Award' : 'Premio Asignado', AWARD_X + 14, awardLabelY, 9, 'F2', theme.heading),
      textLine(typeLabel, AWARD_X + 14, awardLabelY - 20, 13, 'F2', PDF_COLORS.ink),
    );
    wrap(award.descripcion, 58).slice(0, 2).forEach((line, i) => {
      lines.push(textLine(line, AWARD_X + 14, awardLabelY - 40 - i * 14, 10, 'F1', PDF_COLORS.ink));
    });
    wrap(award.condiciones_entrega ?? '', 68).slice(0, 2).forEach((line, i) => {
      lines.push(textLine(line, AWARD_X + 14, awardLabelY - 74 - i * 12, 9, 'F1', PDF_COLORS.muted));
    });
  } else {
    lines.push(
      textLine(isEnglish ? 'Assigned Award' : 'Premio Asignado', AWARD_X + 14, awardLabelY, 9, 'F2', theme.heading),
      textLine(
        isEnglish ? 'No award configured' : 'Sin premio configurado',
        AWARD_X + 14, awardLabelY - 20, 10, 'F1', PDF_COLORS.muted
      ),
    );
  }

  // === FOOTER ===
  lines.push(
    textLine(
      isEnglish ? 'Issued automatically by Votify' : 'Emitido automaticamente por Votify',
      52, 67, 9, 'F1', PDF_COLORS.muted
    ),
    textLine(generatedDate, 52, 51, 9, 'F1', PDF_COLORS.muted),
    textLine(
      isEnglish ? 'Official ranking certificate' : 'Certificado oficial segun ranking final',
      PAGE_WIDTH - 258, 51, 9, 'F2', theme.heading
    ),
  );

  return lines.join('\n');
}

function buildPdf(content: string) {
  const byteLength = new TextEncoder().encode(content).length;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>`,
    `<< /Length ${byteLength} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(new TextEncoder().encode(pdf).length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = new TextEncoder().encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${offset.toString().padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return pdf;
}

function downloadPdf(pdf: string, filename: string) {
  const blob = new Blob([pdf], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function downloadWinnerCertificatesPdf(input: CertificateInput) {
  const surveySlug = slug(input.survey.nombre) || 'certificado';
  input.winners.slice(0, 3).forEach((winner) => {
    const projectName = winner.result.proyecto?.nombre ?? `proyecto-${winner.result.proyecto_id}`;
    const filename = `${surveySlug}-top-${winner.position}-${slug(projectName) || 'ganador'}.pdf`;
    downloadPdf(buildPdf(pageContent(winner, input.survey)), filename);
  });
}

export function downloadWinnerCertificatePdf(survey: Survey, winner: CertificateWinner) {
  const surveySlug = slug(survey.nombre) || 'certificado';
  const projectName = winner.result.proyecto?.nombre ?? `proyecto-${winner.result.proyecto_id}`;
  const filename = `${surveySlug}-top-${winner.position}-${slug(projectName) || 'ganador'}.pdf`;
  downloadPdf(buildPdf(pageContent(winner, survey)), filename);
}
