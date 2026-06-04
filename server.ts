import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Configure JSON limit high enough to hold uncompressed Base64 PDF attachment data URL payloads
  app.use(express.json({ limit: '15mb' }));

  // API Route - Proxy to Resend to safely keep API key hidden on the server
  app.post('/api/send-email', async (req, res) => {
    const { to, subject, bodyText, pdfBase64, senderName, senderEmail, studentName, apiKey } = req.body;

    try {
      const activeApiKey = apiKey || process.env.RESEND_API_KEY;

      if (!activeApiKey) {
        return res.status(400).json({
          success: false,
          error: 'Resend API credential has not been configured in the console.',
        });
      }

      const cleanSenderEmail = senderEmail || 'academy@resend.dev';
      const cleanSenderName = senderName || 'Registry Registrar';

      // Resend payload construction
      const payload: any = {
        from: `${cleanSenderName} <onboarding@resend.dev>`, // Fallback testing address on free accounts
        to: [to],
        subject: subject,
        text: bodyText,
        attachments: [
          {
            filename: `Certificate_${studentName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
            content: pdfBase64, // Accepts Raw Base64 string directly in attachments array
          },
        ],
      };

      // Custom domain overrides if configured correctly
      if (cleanSenderEmail && !cleanSenderEmail.includes('@resend.dev') && cleanSenderEmail.includes('@')) {
        payload.from = `${cleanSenderName} <${cleanSenderEmail}>`;
      }

      const providerResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeApiKey}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await providerResponse.json();

      if (providerResponse.ok) {
        return res.json({ success: true, id: data.id });
      } else {
        return res.status(providerResponse.status).json({
          success: false,
          error: data.message || 'The email dispatch API rejected the payload parameters.',
        });
      }

    } catch (err: any) {
      console.error('Express /api/send-email error: ', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Express server endpoint internal processing failure.',
      });
    }
  });

  // Serve static assets or mount Vite dev middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // Express v4 root fallback route
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Certificate issuing full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
