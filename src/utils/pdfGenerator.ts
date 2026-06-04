import { jsPDF } from 'jspdf';
import { Recipient, Template } from '../types';

/**
 * Helper to ensure custom certificate web fonts are loaded in the browser.
 */
export function injectCertificateFonts() {
  const linkId = 'certificate-google-fonts';
  if (!document.getElementById(linkId)) {
    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Alex+Brush&family=Cinzel:wght@500;700&family=Montserrat:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Space+Grotesk:wght@500;700&display=swap';
    document.head.appendChild(link);
  }
}

// Simple design cache to make typing instant
const imageCache: Record<string, HTMLImageElement> = {};

/**
 * Draws a certificate onto a canvas context.
 * Dimensions should be high-res scale, ideally 2000 x 1414 (A4 Landscape ratio ~ 1.414)
 */
export function drawCertificateOnCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  recipient: Recipient,
  template: Template,
  isPreview: boolean = false
) {
  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Identify if there is a custom preset or uploaded background image
  if (template.bgImage) {
    const bgUrl = template.bgImage;
    if (imageCache[bgUrl] && imageCache[bgUrl].complete) {
      // Draw immediately from cache
      ctx.drawImage(imageCache[bgUrl], 0, 0, width, height);
      drawTextAndSignatures(ctx, width, height, recipient, template, isPreview);
    } else {
      const img = new Image();
      img.src = bgUrl;
      imageCache[bgUrl] = img;
      img.onload = () => {
        // Redraw to ensure correct layering
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        drawTextAndSignatures(ctx, width, height, recipient, template, isPreview);
      };
      img.onerror = () => {
        // Fallback vector layers
        drawVectorBordersAndBackground(ctx, width, height, template);
        drawTextAndSignatures(ctx, width, height, recipient, template, isPreview);
      };
    }
  } else {
    // Vector layers
    drawVectorBordersAndBackground(ctx, width, height, template);
    drawTextAndSignatures(ctx, width, height, recipient, template, isPreview);
  }
}

/**
 * Draws core vector geometric designs on Canvas
 */
export function drawVectorBordersAndBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  template: Template
) {
  if (template.hideBorders) {
    // Elegant fully naked canvas background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    return;
  }

  const primary = template.primaryColor || '#1A3C6E';
  const accent = template.accentColor || '#D4A843';

  if (template.layoutType === 'classic') {
    // Ivory / Antique White Background
    ctx.fillStyle = '#FDFBF7';
    ctx.fillRect(0, 0, width, height);

    // Elegant Double Border with corner decorations
    ctx.lineWidth = 14;
    ctx.strokeStyle = primary;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    ctx.lineWidth = 3;
    ctx.strokeStyle = accent;
    ctx.strokeRect(38, 38, width - 76, height - 76);

    // Corner Ornaments
    const drawClassicCorner = (cx: number, cy: number, flipX: number, flipY: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(flipX, flipY);
      ctx.beginPath();
      ctx.moveTo(38, 38);
      ctx.lineTo(80, 38);
      ctx.lineTo(80, 48);
      ctx.lineTo(48, 48);
      ctx.lineTo(48, 80);
      ctx.lineTo(38, 80);
      ctx.closePath();
      ctx.fillStyle = accent;
      ctx.fill();

      // Small accent square in corners
      ctx.fillRect(56, 56, 12, 12);
      ctx.restore();
    };

    drawClassicCorner(0, 0, 1, 1);
    drawClassicCorner(width, 0, -1, 1);
    drawClassicCorner(0, height, 1, -1);
    drawClassicCorner(width, height, -1, -1);

  } else if (template.layoutType === 'modern') {
    // Pure White contemporary grid background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Sleek Left Accent Block
    ctx.fillStyle = primary;
    ctx.fillRect(0, 0, 45, height);

    ctx.fillStyle = accent;
    ctx.fillRect(45, 0, 15, height);

    // Top-right triangle corner badge
    ctx.fillStyle = primary;
    ctx.beginPath();
    ctx.moveTo(width - 150, 0);
    ctx.lineTo(width, 150);
    ctx.lineTo(width, 0);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = accent;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(width - 165, 0);
    ctx.lineTo(width, 165);
    ctx.stroke();

    // Modern slim border around remaining space
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 2;
    ctx.strokeRect(100, 40, width - 140, height - 80);

  } else if (template.layoutType === 'corporate') {
    // Slate-grey professional clean look
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(0, 0, width, height);

    // Top & Bottom Corporate solid header bars
    ctx.fillStyle = primary;
    ctx.fillRect(0, 0, width, 30);
    ctx.fillRect(0, height - 30, width, 30);

    ctx.fillStyle = accent;
    ctx.fillRect(0, 30, width, 8);
    ctx.fillRect(0, height - 38, width, 8);

    // Thin elegant geometric framing
    ctx.strokeStyle = '#D1D5DB';
    ctx.lineWidth = 1;
    ctx.strokeRect(50, 50, width - 100, height - 100);

    // Steel blue watermarking circle background effect
    ctx.save();
    ctx.globalAlpha = 0.02;
    ctx.fillStyle = primary;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 400, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

  } else if (template.layoutType === 'creative') {
    // Creative Playful / Contemporary gradients
    ctx.fillStyle = '#FAFAF9';
    ctx.fillRect(0, 0, width, height);

    // Warm pastel corner paint blobs
    const drawBlob = (cx: number, cy: number, radius: number, color: string) => {
      ctx.save();
      const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius);
      grad.addColorStop(0, color);
      grad.addColorStop(1, 'rgba(250, 250, 249, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    drawBlob(0, 0, 450, primary + '1D'); // 11% opacity hex suffix
    drawBlob(width, height, 500, accent + '22');
    drawBlob(width, 0, 300, accent + '11');
    drawBlob(0, height, 300, primary + '11');

    // Soft dashed floating rounded rectangle border
    ctx.strokeStyle = primary;
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 10]);
    ctx.beginPath();
    ctx.roundRect(40, 40, width - 80, height - 80, 24);
    ctx.stroke();
    ctx.setLineDash([]); // Reset
  }
}

/**
 * Merges student and template data dynamically onto the canvas context
 */
export function drawTextAndSignatures(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  recipient: Recipient,
  template: Template,
  isPreview: boolean = false
) {
  const primary = template.primaryColor || '#1A3C6E';
  const accent = template.accentColor || '#D4A843';

  // Read overrides and text alignment shifts
  const yShift = template.textYShift || 0;
  const xShift = template.textXShift || 0;
  
  // Custom font colors
  const defaultTextColor = template.textColor || '#4B5563';
  const headingColor = template.textColor || '#111827';
  const subtitleColor = template.textColor || primary;

  // Define typographic families
  const isClassic = template.layoutType === 'classic';
  const isModern = template.layoutType === 'modern';
  const isCorp = template.layoutType === 'corporate';

  const titleFont = template.titleFont || (isClassic
    ? "'Cinzel', 'Times New Roman', serif"
    : isModern
    ? "'Space Grotesk', 'Arial Black', sans-serif"
    : isCorp
    ? "'Montserrat', sans-serif"
    : "'Space Grotesk', sans-serif");

  const nameFont = template.nameFont || (isClassic
    ? "'Cinzel', 'Times New Roman', serif"
    : "'Montserrat', sans-serif");

  const courseFont = template.courseFont || "'Montserrat', sans-serif";

  const bodyFont = isClassic
    ? "'Playfair Display', serif"
    : "'Montserrat', sans-serif";

  // Margins left helper
  const xOffset = (isModern && !template.bgImage) ? 120 : 0; // Modern layout pushes right due to left accent block
  const textCenter = width / 2 + xOffset / 2 + xShift;

  // 0. Render Brand Logo if URL provided
  if (template.logoUrl) {
    const logoY = 40 + (template.logoYShift || 0) + yShift;
    const logoSize = template.logoSize || 80;
    const logoX = textCenter - logoSize / 2;

    if (imageCache[template.logoUrl] && imageCache[template.logoUrl].complete) {
      try {
        ctx.drawImage(imageCache[template.logoUrl], logoX, logoY, logoSize, logoSize);
      } catch (e) {
        console.error("Failed to render logo img on canvas", e);
      }
    } else {
      const img = new Image();
      img.src = template.logoUrl;
      imageCache[template.logoUrl] = img;
      img.onload = () => {};
    }
  }

  // 1. Academy Name
  ctx.fillStyle = subtitleColor;
  ctx.font = `600 ${isModern ? '24px' : '28px'} 'Montserrat', sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText((template.academyName || 'ACADEMY NAME').toUpperCase(), textCenter, 140 + yShift);

  // Tiny divider or crest accent below academy name
  if (!template.hideBorders && !template.bgImage) {
    ctx.beginPath();
    ctx.moveTo(textCenter - 60, 165 + yShift);
    ctx.lineTo(textCenter + 60, 165 + yShift);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // 2. Certificate Title (Header)
  ctx.fillStyle = headingColor;
  const titleFSize = template.titleFontSize || (isClassic ? 64 : 56);
  ctx.font = `bold ${titleFSize}px ${titleFont}`;
  ctx.fillText('CERTIFICATE OF COMPLETION', textCenter, 250 + yShift);

  // 3. Presentation Text
  ctx.fillStyle = defaultTextColor;
  ctx.font = `italic 22px ${bodyFont}`;
  ctx.fillText('This is proudly presented and awarded to', textCenter, 310 + yShift);

  // 4. Recipient Name (BIG, Gorgeous, Bold)
  ctx.fillStyle = subtitleColor;
  const nameFSize = template.nameFontSize || (isClassic ? 72 : 60);
  ctx.font = `bold ${nameFSize}px ${nameFont}`;
  ctx.fillText(recipient.name, textCenter, 410 + yShift);

  if (!template.hideBorders && !template.bgImage) {
    ctx.beginPath();
    ctx.moveTo(textCenter - 180, 435 + yShift);
    ctx.lineTo(textCenter + 180, 435 + yShift);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // 5. Successful Completion Context
  ctx.fillStyle = defaultTextColor;
  ctx.font = `18px 'Montserrat', sans-serif`;
  const mainDescText = template.customText || 'for satisfactorily completing and passing the prescribed professional qualifications';
  ctx.fillText(mainDescText, textCenter, 480 + yShift);

  // 6. Course Name
  ctx.fillStyle = headingColor;
  const courseFSize = template.courseFontSize || 32;
  ctx.font = `bold ${courseFSize}px ${courseFont}`;
  ctx.fillText(recipient.course || template.courseName || 'Selected Academy Course', textCenter, 545 + yShift);

  // 7. Academic Verification Code
  ctx.fillStyle = defaultTextColor;
  const metaFSize = template.metaFontSize || 13;
  ctx.font = `500 ${metaFSize}px 'Montserrat', sans-serif`;
  const dateStr = recipient.date || template.issueDate || new Date().toLocaleDateString('en-GB');
  ctx.fillText(`Date: ${dateStr}      |      Verification Unique ID: ${recipient.id}`, textCenter, 610 + yShift);

  // 8. Signatures Block (Bottom section)
  if (!template.hideSignatures) {
    const drawSignatory = (
      name: string,
      title: string,
      sigText: string,
      sigImage: string | undefined,
      xPosition: number,
      yPosition: number
    ) => {
      // Signature Line
      ctx.strokeStyle = template.textColor ? `${template.textColor}AA` : '#9CA3AF';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(xPosition - 150, yPosition);
      ctx.lineTo(xPosition + 150, yPosition);
      ctx.stroke();

      // Hand-signed graphics or cursive fonts
      if (sigImage) {
        if (imageCache[sigImage] && imageCache[sigImage].complete) {
          try {
            ctx.drawImage(imageCache[sigImage], xPosition - 80, yPosition - 65, 160, 60);
          } catch (e) {
            console.error("Failed drawing signature image on canvas", e);
            // fallback
            ctx.fillStyle = template.textColor || '#06173D';
            ctx.font = "italic 44px 'Alex Brush', cursive";
            ctx.fillText(sigText || name, xPosition, yPosition - 15);
          }
        } else {
          const img = new Image();
          img.src = sigImage;
          imageCache[sigImage] = img;
          img.onload = () => {};
          // Text fallback while loading
          ctx.fillStyle = template.textColor || '#06173D';
          ctx.font = "italic 44px 'Alex Brush', cursive";
          ctx.fillText(sigText || name, xPosition, yPosition - 15);
        }
      } else {
        // The signature itself (elegant cursive script)
        ctx.fillStyle = template.textColor || '#06173D';
        ctx.font = "italic 44px 'Alex Brush', cursive";
        ctx.fillText(sigText || name, xPosition, yPosition - 15);
      }

      // Signatory Name
      ctx.fillStyle = headingColor;
      ctx.font = "bold 15px 'Montserrat', sans-serif";
      ctx.fillText(name, xPosition, yPosition + 25);

      // Signatory Title
      ctx.fillStyle = defaultTextColor;
      ctx.font = "500 12px 'Montserrat', sans-serif";
      ctx.fillText(title, xPosition, yPosition + 45);
    };

    // Dual signatures placement
    const sigY = height - 160 + yShift;
    const sigXLeft = textCenter - 260;
    const sigXRight = textCenter + 260;

    drawSignatory(
      template.signatory1Name || 'Instructor',
      template.signatory1Title || 'Course Facilitator',
      template.signature1 || template.signatory1Name || 'Facilitator',
      template.signature1Image,
      sigXLeft,
      sigY
    );

    drawSignatory(
      template.signatory2Name || 'Academy Director',
      template.signatory2Title || 'Director of Studies',
      template.signature2 || template.signatory2Name || 'Director',
      template.signature2Image,
      sigXRight,
      sigY
    );
  }

  // 9. Premium Seal emblem (drawn on classic or corporate apps for gravity / prestige)
  if (!template.hideBorders && (isClassic || isCorp) && !template.bgImage) {
    const sealX = textCenter;
    const sealY = height - 160 + yShift;

    ctx.save();
    // Circular Gold Seal Background
    ctx.translate(sealX, sealY);
    ctx.shadowColor = 'rgba(0,0,0,0.15)';
    ctx.shadowBlur = 10;

    // Gold Ribbons hanging down
    ctx.lineWidth = 0;
    ctx.fillStyle = accent;
    ctx.shadowBlur = 0; // turn off shadow for ribbon overlays

    ctx.beginPath();
    ctx.moveTo(-20, 20);
    ctx.lineTo(-30, 80);
    ctx.lineTo(-5, 65);
    ctx.lineTo(20, 80);
    ctx.lineTo(10, 20);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-5, 20);
    ctx.lineTo(5, 85);
    ctx.lineTo(25, 75);
    ctx.lineTo(35, 85);
    ctx.lineTo(15, 20);
    ctx.closePath();
    ctx.fill();

    // Central circular plate
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(0, 0, 42, 0, Math.PI * 2);
    ctx.fill();

    // Inner gold ring line
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    ctx.stroke();

    // Seal text inside
    ctx.fillStyle = '#FFFFFF';
    ctx.font = "bold 9px 'Montserrat', sans-serif";
    ctx.fillText('OFFICIAL', 0, -6);
    ctx.font = "bold 7px 'Montserrat', sans-serif";
    ctx.fillText('CREDENTIAL', 0, 5);
    ctx.fillText('SEAL', 0, 15);

    ctx.restore();
  }
}

/**
 * Helper to ensure all active template graphics are loaded in active image cache.
 */
export function preloadTemplateImages(template: Template): Promise<void> {
  const urls: string[] = [];
  if (template.bgImage) urls.push(template.bgImage);
  if (template.logoUrl) urls.push(template.logoUrl);
  if (template.signature1Image) urls.push(template.signature1Image);
  if (template.signature2Image) urls.push(template.signature2Image);

  if (urls.length === 0) return Promise.resolve();

  return Promise.all(
    urls.map((url) => {
      return new Promise<void>((resolve) => {
        if (imageCache[url] && imageCache[url].complete) {
          resolve();
          return;
        }
        const img = new Image();
        img.src = url;
        imageCache[url] = img;
        img.onload = () => resolve();
        img.onerror = () => resolve(); // continue even if one fails
      });
    })
  ).then(() => {});
}

/**
 * Renders the off-screen canvas and creates a PDF using jsPDF.
 * Returns a Promise that resolves with the jsPDF instance.
 */
export function generateCertificatePDF(
  recipient: Recipient,
  template: Template
): Promise<jsPDF> {
  return new Promise((resolve) => {
    // 1. Ensure fonts are loaded
    injectCertificateFonts();

    // Use a high resolution scale to prevent blurry PDFs
    const canvasWidth = 2000;
    const canvasHeight = 1414; // A4 Landscape ratio ~ 1.414

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      resolve(pdf);
      return;
    }

    const triggerPdfGeneration = () => {
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      // Create landscape A4 PDF: A4 Landscape is 297mm x 210mm
      const pdf = new jsPDF('l', 'mm', 'a4');
      pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210);
      resolve(pdf);
    };

    // Preload ALL custom uploaded/templated images first for 100% canvas rendering reliability
    preloadTemplateImages(template).then(() => {
      if (template.bgImage) {
        const img = imageCache[template.bgImage] || new Image();
        if (!img.src) img.src = template.bgImage;
        
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
        drawTextAndSignatures(ctx, canvasWidth, canvasHeight, recipient, template, false);
        triggerPdfGeneration();
      } else {
        // Wait a tiny bit for fonts
        setTimeout(() => {
          drawVectorBordersAndBackground(ctx, canvasWidth, canvasHeight, template);
          drawTextAndSignatures(ctx, canvasWidth, canvasHeight, recipient, template, false);
          triggerPdfGeneration();
        }, 80);
      }
    });
  });
}

/**
 * Downloads a certificate as PDF directly.
 */
export async function downloadSingleCertificate(recipient: Recipient, template: Template) {
  const pdfStatus = await generateCertificatePDF(recipient, template);
  const cleanName = recipient.name.replace(/[^a-zA-Z0-9]/g, '_');
  pdfStatus.save(`Certificate_${cleanName}_${recipient.id}.pdf`);
}
