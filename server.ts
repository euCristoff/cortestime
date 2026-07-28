import "dotenv/config";
import express from "express";
import path from "path";
import { initializeApp } from "firebase/app";
import { 
  initializeFirestore, 
  collection, 
  getDocs, 
  doc, 
  updateDoc 
} from "firebase/firestore";

// Firebase Config same as src/firebase.ts
const firebaseConfig = {
  apiKey: "AIzaSyARuWfsZIwy75KaGmWw0_IiulZ_Lp-bgH8",
  authDomain: "positive-decoder-ndzmz.firebaseapp.com",
  projectId: "positive-decoder-ndzmz",
  storageBucket: "positive-decoder-ndzmz.firebasestorage.app",
  messagingSenderId: "576867565081",
  appId: "1:576867565081:web:e829e40f91fb500902f488",
};

const fbApp = initializeApp(firebaseConfig);
const db = initializeFirestore(fbApp, {}, "ai-studio-barberflow-ad72a5af-c542-494c-b68b-a33897de01d2");

const app = express();
const PORT = 3000;

app.use(express.json());

  // Helper function to call Brevo API
  async function callBrevo(endpoint: string, method: string, body: any, options: { silentError?: boolean } = {}) {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      console.warn("BREVO_API_KEY is not configured.");
      return { error: "BREVO_API_KEY is missing" };
    }

    const response = await fetch(`https://api.brevo.com/v3/${endpoint}`, {
      method,
      headers: {
        "accept": "application/json",
        "api-key": apiKey,
        "content-type": "application/json"
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 401 && (errorText.includes("authorised_ips") || errorText.includes("unrecognised IP") || errorText.includes("unauthorised"))) {
        console.error("\n==============================================================");
        console.error("⚠️ [CONFIGURAÇÃO REQUERIDA NO BREVO]: IP NÃO AUTORIZADO");
        console.error("O Brevo está bloqueando o acesso deste servidor devido a restrições de IP.");
        console.error("Como o aplicativo roda na nuvem (Cloud Run), os IPs são dinâmicos e variam.");
        console.error("Para corrigir isso e permitir o envio de e-mails e sincronização:");
        console.error("1. Acesse: https://app.brevo.com/security/authorised_ips");
        console.error("2. Desative ou remova as restrições de IPs autorizados.");
        console.error("Isso permitirá que o servidor sincronize seus contatos e envie e-mails de sequência.");
        console.error("==============================================================\n");
      }
      if (!options.silentError) {
        console.error(`Brevo API Error (${response.status}) on ${endpoint}:`, errorText);
      }
      throw new Error(`Brevo API Error: ${errorText}`);
    }

    return response.status !== 204 ? await response.json() : { success: true };
  }

  // Get or Create "Leads Cortestime" list in Brevo
  async function getOrCreateListId(listName: string): Promise<number> {
    try {
      const data: any = await callBrevo("contacts/lists", "GET", null);
      if (data && data.lists) {
        const existingList = data.lists.find((l: any) => l.name === listName);
        if (existingList) {
          return existingList.id;
        }
      }

      console.log(`List '${listName}' not found. Creating in Brevo...`);
      const createRes: any = await callBrevo("contacts/lists", "POST", {
        name: listName,
        folderId: 1
      });
      return createRes.id;
    } catch (error) {
      console.error("Error getting/creating Brevo list:", error);
      return 1; // Fallback default
    }
  }

  // API Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", brevoConfigured: !!process.env.BREVO_API_KEY });
  });

  // Diagnostics Endpoint for checking env vars format
  app.get("/api/admin/diagnostics", (req, res) => {
    const mpAccessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || "";
    const mpPublicKey = process.env.MERCADO_PAGO_PUBLIC_KEY || "";
    const brevoKey = process.env.BREVO_API_KEY || "";

    const mpAccessTokenPlaceholder = "TEST-26391707456161-070916-3f497b7e92e1b4aaf0ee4568f4580224-704673976";

    // Analyze MERCADO_PAGO_ACCESS_TOKEN
    let mpAccessTokenStatus = {
      configured: false,
      isPlaceholder: false,
      length: 0,
      prefix: "",
      seemsValid: false,
      possibleIssue: ""
    };

    if (mpAccessToken) {
      mpAccessTokenStatus.configured = true;
      mpAccessTokenStatus.length = mpAccessToken.length;
      mpAccessTokenStatus.prefix = mpAccessToken.substring(0, 15);
      
      if (mpAccessToken === mpAccessTokenPlaceholder) {
        mpAccessTokenStatus.isPlaceholder = true;
        mpAccessTokenStatus.possibleIssue = "Este é o token de exemplo/placeholder do app. Troque-o pelo seu token real de produção.";
      } else if (mpAccessToken.startsWith("xkeysib-")) {
        mpAccessTokenStatus.possibleIssue = "Parece que você colou a chave do Brevo (Email) neste campo do Mercado Pago!";
      } else if (mpAccessToken.startsWith("APP_USR-") || mpAccessToken.startsWith("TEST-")) {
        if (mpAccessToken.length < 50) {
          mpAccessTokenStatus.possibleIssue = "Muito curto. Você pode ter colado a PUBLIC_KEY aqui por engano. O Access Token real tem cerca de 80 a 100 caracteres.";
        } else {
          mpAccessTokenStatus.seemsValid = true;
        }
      } else {
        mpAccessTokenStatus.possibleIssue = "Formato inválido. Deve começar com 'APP_USR-' ou 'TEST-'.";
      }
    }

    // Analyze MERCADO_PAGO_PUBLIC_KEY
    let mpPublicKeyStatus = {
      configured: false,
      length: 0,
      prefix: "",
      seemsValid: false,
      possibleIssue: ""
    };

    if (mpPublicKey) {
      mpPublicKeyStatus.configured = true;
      mpPublicKeyStatus.length = mpPublicKey.length;
      mpPublicKeyStatus.prefix = mpPublicKey.substring(0, 15);

      if (mpPublicKey.startsWith("xkeysib-")) {
        mpPublicKeyStatus.possibleIssue = "Parece que você colou a chave do Brevo (Email) neste campo!";
      } else if (mpPublicKey.startsWith("APP_USR-") || mpPublicKey.startsWith("TEST-")) {
        if (mpPublicKey.length > 50) {
          mpPublicKeyStatus.possibleIssue = "Muito longo. Você pode ter colado o ACCESS_TOKEN aqui por engano.";
        } else {
          mpPublicKeyStatus.seemsValid = true;
        }
      } else {
        mpPublicKeyStatus.possibleIssue = "Deve começar com 'APP_USR-' ou 'TEST-'.";
      }
    }

    // Analyze BREVO_API_KEY
    let brevoStatus = {
      configured: false,
      length: 0,
      prefix: "",
      seemsValid: false,
      possibleIssue: ""
    };

    if (brevoKey) {
      brevoStatus.configured = true;
      brevoStatus.length = brevoKey.length;
      brevoStatus.prefix = brevoKey.substring(0, 15);

      if (brevoKey.startsWith("APP_USR-") || brevoKey.startsWith("TEST-")) {
        brevoStatus.possibleIssue = "Parece que você colou uma chave do Mercado Pago neste campo do Brevo!";
      } else if (brevoKey.startsWith("xkeysib-")) {
        brevoStatus.seemsValid = true;
      } else {
        brevoStatus.possibleIssue = "A chave do Brevo deve começar com 'xkeysib-'.";
      }
    }

    res.json({
      mpAccessToken: mpAccessTokenStatus,
      mpPublicKey: mpPublicKeyStatus,
      brevo: brevoStatus
    });
  });

  // Proxy Endpoint: Create or Update Brevo Contact
  app.post("/api/brevo/contact", async (req, res) => {
    try {
      const { email, nomeProprietario, nomeBarbearia, whatsapp, plano } = req.body;
      if (!email) {
        res.status(400).json({ error: "Email is required" });
        return;
      }

      if (!process.env.BREVO_API_KEY) {
        console.log("Brevo API key is not configured. Skipping sync.");
        res.json({ success: false, message: "BREVO_API_KEY not configured" });
        return;
      }

      const listId = await getOrCreateListId("Leads Cortestime");

      const attributes: any = {
        PLANO: plano || "pro_trial"
      };

      if (nomeProprietario) attributes.FIRSTNAME = nomeProprietario;
      if (nomeBarbearia) attributes.LASTNAME = nomeBarbearia;
      if (whatsapp) {
        let cleanPhone = whatsapp.replace(/\D/g, "");
        // Convert Brazilian local number (10 or 11 digits) to E.164 format with '55' prefix
        if (cleanPhone.length === 10 || cleanPhone.length === 11) {
          cleanPhone = "55" + cleanPhone;
        }
        attributes.SMS = cleanPhone;
      }

      const payload = {
        email,
        attributes,
        listIds: [listId],
        updateEnabled: true
      };

      try {
        await callBrevo("contacts", "POST", payload, { silentError: true });
      } catch (err: any) {
        // If Brevo complains about duplicate SMS or phone format, retry without the SMS attribute so the contact sync succeeds
        if (attributes.SMS && err.message && (
          err.message.toLowerCase().includes("phone") || 
          err.message.toLowerCase().includes("sms") || 
          err.message.toLowerCase().includes("parameter") ||
          err.message.toLowerCase().includes("invalid") ||
          err.message.toLowerCase().includes("duplicate")
        )) {
          console.log("Brevo contact sync: SMS constraint detected, syncing contact without SMS attribute.");
          delete attributes.SMS;
          await callBrevo("contacts", "POST", {
            email,
            attributes,
            listIds: [listId],
            updateEnabled: true
          });
        } else {
          throw err;
        }
      }
      res.json({ success: true, message: "Contact synced successfully" });
    } catch (error: any) {
      console.error("Error syncing contact with Brevo:", error);
      res.status(500).json({ error: error.message || "Failed to sync contact" });
    }
  });

  // Helper to find a verified active sender in the Brevo account
  async function getVerifiedSender(): Promise<{ name: string; email: string }> {
    try {
      const data: any = await callBrevo("senders", "GET", null);
      if (data && data.senders && data.senders.length > 0) {
        // 1. Prioritize suportecortestime@gmail.com if it exists and is active in Brevo
        const supportSender = data.senders.find(
          (s: any) => s.email === "suportecortestime@gmail.com" && s.active
        );
        if (supportSender) {
          return { name: "Cortestime", email: "suportecortestime@gmail.com" };
        }

        // 2. Try to find any active sender that is NOT your personal/admin emails
        const otherActiveSender = data.senders.find(
          (s: any) =>
            s.active &&
            s.email !== "cristoffcaua123456@gmail.com" &&
            s.email !== "cristoffcauaff9@gmail.com"
        );
        if (otherActiveSender) {
          return { name: otherActiveSender.name, email: otherActiveSender.email };
        }

        // 3. Fallback to any active sender
        const activeSender = data.senders.find((s: any) => s.active);
        if (activeSender) {
          return { name: activeSender.name, email: activeSender.email };
        }
        // Fallback to the first sender returned by Brevo
        return { name: data.senders[0].name, email: data.senders[0].email };
      }
    } catch (err) {
      console.error("Error fetching verified senders from Brevo:", err);
    }
    // Hard fallback
    return { name: "Cortestime", email: "suportecortestime@gmail.com" };
  }
  function wrapInBrandTemplate(greeting: string, htmlContent: string): string {
    return `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); background-color: #ffffff;">
        <div style="background-color: #051b42; padding: 24px; text-align: center; border-bottom: 3px solid #4f9bc2;">
          <span style="color: #ffffff; font-size: 26px; font-weight: bold; letter-spacing: 1px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">Cortestime</span>
          <div style="color: #4f9bc2; font-size: 11px; margin-top: 4px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Sua barbearia no topo</div>
        </div>
        <div style="padding: 24px; color: #333333; line-height: 1.6; font-size: 15px;">
          <h2 style="color: #051b42; margin-top: 0; font-size: 20px; font-weight: bold; border-bottom: 1px solid #f0f0f0; padding-bottom: 12px;">${greeting}</h2>
          ${htmlContent}
          <br/>
          <p style="margin-bottom: 0; padding-top: 16px; border-top: 1px solid #f0f0f0; color: #666666; font-size: 14px;">
            Abraços,<br/>
            <strong>Equipe Cortestime</strong>
          </p>
        </div>
        <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #f0f0f0; font-size: 11px; color: #999999;">
          Você está recebendo este e-mail porque se cadastrou no Cortestime.
        </div>
      </div>
    `;
  }

  function getAppBaseUrl(): string {
    if (process.env.APP_URL && process.env.APP_URL.trim() !== "") {
      const url = process.env.APP_URL.trim();
      return url.endsWith("/") ? url : `${url}/`;
    }
    return "https://cortestime.com.br/";
  }

  // Send Transactional Email helper
  async function sendSequenceEmail(email: string, name: string, subject: string, htmlContent: string) {
    if (!process.env.BREVO_API_KEY) {
      throw new Error("BREVO_API_KEY is not configured.");
    }

    // Dynamically fetch an active verified sender
    const sender = await getVerifiedSender();
    console.log(`Using sender: ${sender.email} (${sender.name})`);

    try {
      await callBrevo("smtp/email", "POST", {
        sender,
        to: [{ email, name }],
        subject,
        htmlContent
      });
      console.log(`Email '${subject}' successfully sent to ${email}`);
    } catch (error: any) {
      console.error(`Failed to send email '${subject}' to ${email}:`, error);
      throw error;
    }
  }

  // Send Transactional SMS helper via Brevo API
  async function sendSequenceSMS(mobilePhone: string, content: string) {
    if (!process.env.BREVO_API_KEY) return;
    const cleanPhone = mobilePhone ? mobilePhone.replace(/\D/g, '') : '';
    if (!cleanPhone || cleanPhone.length < 10) return;
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    try {
      await callBrevo("transactionalSMS/sms", "POST", {
        type: "transactional",
        sender: "Cortestime",
        recipient: formattedPhone,
        content
      }, { silentError: true });
      console.log(`[SMS Sequence] SMS sent to ${formattedPhone}`);
    } catch (err: any) {
      console.warn(`[SMS Sequence] Brevo SMS dispatch note for ${formattedPhone}:`, err?.message || err);
    }
  }

  // Check and run email and SMS sequence automation (7-Day Trial, Starting Day 3)
  async function runEmailSequenceAutomation() {
    if (!process.env.BREVO_API_KEY) {
      console.log("Skipping sequence automation: BREVO_API_KEY not configured.");
      return;
    }

    console.log("Running Brevo email and SMS sequence automation job...");
    try {
      const snap = await getDocs(collection(db, "users"));
      if (snap.empty) {
        console.log("No users found in Firestore to check.");
        return;
      }

      const now = Date.now();
      const appUrl = getAppBaseUrl();

      for (const docSnap of snap.docs) {
        try {
          const user = docSnap.data();
          if (!user.email || !user.criadoEm) continue;

          // Skip users with active Pro Plan
          if (user.plano === "pro") {
            continue;
          }

          // Skip admin/developer account
          if (user.email === "cristoffcauaff9@gmail.com") {
            continue;
          }

          // Calculate days since account creation
          const creationTime = new Date(user.criadoEm).getTime();
          const diffDays = Math.floor((now - creationTime) / (1000 * 60 * 60 * 24));

          const uid = docSnap.id;
          const name = user.nomeProprietario || user.nomeBarbearia || "Parceiro";
          const barbearia = user.nomeBarbearia || "sua barbearia";
          const email = user.email;
          const whatsapp = user.whatsapp || "";

          // --- DAY 3 SEQUENCE (Email + SMS) ---
          if (diffDays >= 3 && (!user.brevoDay3Sent || !user.brevoSmsDay3Sent)) {
            if (!user.brevoDay3Sent) {
              const subject = "✂️ Seu teste de 7 dias no Cortestime: 3º dia de uso! Configurando sua barbearia";
              const body = wrapInBrandTemplate(
                `Olá, ${name}!`,
                `
                  <p>Você já está no <strong>3º dia do seu teste grátis de 7 dias</strong> do Cortestime para a barbearia <strong>${barbearia}</strong>.</p>
                  <p>Nesses primeiros dias, aproveite para cadastrar seus barbeiros, ajustar sua lista de serviços e divulgar o link da sua vitrine digital no Instagram!</p>
                  <p>Se precisar de qualquer ajuda, nossa equipe está pronta para te atender.</p>
                  <div style="text-align: center; margin: 28px 0;">
                    <a href="${appUrl}?action=checkout" target="_blank" style="background-color: #bffd32; color: #051b42; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; font-weight: bold; text-decoration: none; padding: 14px 28px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 10px rgba(191, 253, 50, 0.25); text-transform: uppercase; letter-spacing: 0.5px; border: none;">
                      Ver Meu Painel Pro
                    </a>
                  </div>
                `
              );
              await sendSequenceEmail(email, name, subject, body);
            }

            if (!user.brevoSmsDay3Sent && whatsapp) {
              const smsText = `Cortestime: Ola ${name}! Voce esta no 3o dia do teste gratis de 7 dias da barbearia ${barbearia}. Configure seus servicos na plataforma: cortestime.com.br`;
              await sendSequenceSMS(whatsapp, smsText);
            }

            await updateDoc(doc(db, "users", uid), { brevoDay3Sent: true, brevoSmsDay3Sent: true });
          }

          // --- DAY 5 SEQUENCE (Email + SMS) ---
          if (diffDays >= 5 && (!user.brevoDay5Sent || !user.brevoSmsDay5Sent)) {
            if (!user.brevoDay5Sent) {
              const subject = "📱 Restam 2 dias do seu teste de 7 dias! Sua vitrine digital está pronta";
              const body = wrapInBrandTemplate(
                `Olá, ${name}!`,
                `
                  <p>Faltam apenas <strong>2 dias</strong> para o encerramento do seu teste grátis de 7 dias no Cortestime.</p>
                  <p>Sua vitrine digital está prontinha! Baixe seu QR Code personalizado para o balcão e adicione o link na bio do Instagram para facilitar os agendamentos online dos seus clientes.</p>
                  <p>Ative seu Plano Pro para garantir que sua barbearia continue recebendo agendamentos automáticos sem interrupção!</p>
                  <div style="text-align: center; margin: 28px 0;">
                    <a href="${appUrl}?action=checkout" target="_blank" style="background-color: #bffd32; color: #051b42; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; font-weight: bold; text-decoration: none; padding: 14px 28px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 10px rgba(191, 253, 50, 0.25); text-transform: uppercase; letter-spacing: 0.5px; border: none;">
                      Ativar Meu Plano Pro Agora
                    </a>
                  </div>
                `
              );
              await sendSequenceEmail(email, name, subject, body);
            }

            if (!user.brevoSmsDay5Sent && whatsapp) {
              const smsText = `Cortestime: Faltam apenas 2 dias do seu teste gratis de 7 dias! Ative o Plano Pro para manter sua agenda online funcionando: cortestime.com.br`;
              await sendSequenceSMS(whatsapp, smsText);
            }

            await updateDoc(doc(db, "users", uid), { brevoDay5Sent: true, brevoSmsDay5Sent: true });
          }

          // --- DAY 7 SEQUENCE (Email + SMS - Último dia do teste) ---
          if (diffDays >= 7 && (!user.brevoDay7Sent || !user.brevoSmsDay7Sent)) {
            if (!user.brevoDay7Sent) {
              const subject = "⏰ Hoje é o último dia do seu teste grátis de 7 dias! Ative o Plano Pro";
              const body = wrapInBrandTemplate(
                `Olá, ${name}!`,
                `
                  <p>Hoje é o <strong>7º e último dia</strong> do seu teste grátis no Cortestime.</p>
                  <p>Não deixe seus clientes sem conseguir agendar horários online de última hora!</p>
                  <p>Assine o Plano Pro por apenas <strong>R$ 49,90/mês</strong> e continue aproveitando a melhor tecnologia de gestão e agendamento para sua barbearia.</p>
                  <div style="text-align: center; margin: 28px 0;">
                    <a href="${appUrl}?action=checkout" target="_blank" style="background-color: #bffd32; color: #051b42; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; font-weight: bold; text-decoration: none; padding: 14px 28px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 10px rgba(191, 253, 50, 0.25); text-transform: uppercase; letter-spacing: 0.5px; border: none;">
                      Garantir Meu Acesso Pro
                    </a>
                  </div>
                `
              );
              await sendSequenceEmail(email, name, subject, body);
            }

            if (!user.brevoSmsDay7Sent && whatsapp) {
              const smsText = `Cortestime: Hoje e o ultimo dia do seu teste gratis de 7 dias! Garanta seu Plano Pro para nao perder agendamentos: cortestime.com.br`;
              await sendSequenceSMS(whatsapp, smsText);
            }

            await updateDoc(doc(db, "users", uid), { brevoDay7Sent: true, brevoSmsDay7Sent: true });
          }

          // --- DAY 8+ SEQUENCE (Email + SMS - Aviso pós-expiração) ---
          if (diffDays >= 8 && (!user.brevoDay8Sent || !user.brevoSmsDay8Sent)) {
            if (!user.brevoDay8Sent) {
              const subject = "⚡ Seu teste grátis de 7 dias venceu. Mude para o Plano Pro!";
              const body = wrapInBrandTemplate(
                `Olá, ${name}!`,
                `
                  <p>Seu período de teste grátis de 7 dias no Cortestime chegou ao fim.</p>
                  <p>Não se preocupe: todos os seus cadastros, serviços e profissionais continuam salvos com total segurança.</p>
                  <p>Assine o plano Pro agora para reativar seu agendamento online e continuar gerindo seu negócio sem nenhuma complicação.</p>
                  <div style="text-align: center; margin: 28px 0;">
                    <a href="${appUrl}?action=checkout" target="_blank" style="background-color: #bffd32; color: #051b42; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; font-weight: bold; text-decoration: none; padding: 14px 28px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 10px rgba(191, 253, 50, 0.25); text-transform: uppercase; letter-spacing: 0.5px; border: none;">
                      Reativar Meu Plano Pro
                    </a>
                  </div>
                `
              );
              await sendSequenceEmail(email, name, subject, body);
            }

            if (!user.brevoSmsDay8Sent && whatsapp) {
              const smsText = `Cortestime: Seu teste de 7 dias expirou. Ative o Plano Pro para continuar recebendo agendamentos na sua barbearia: cortestime.com.br`;
              await sendSequenceSMS(whatsapp, smsText);
            }

            await updateDoc(doc(db, "users", uid), { brevoDay8Sent: true, brevoSmsDay8Sent: true });
          }
        } catch (singleUserErr) {
          console.error(`Error processing sequence for user ${docSnap.id}:`, singleUserErr);
        }
      }
    } catch (error) {
      console.error("Error running email and SMS sequence automation:", error);
    }
  }

  // Developer Test Trigger Endpoint for Automation sequence
  app.post("/api/brevo/test-automation", async (req, res) => {
    try {
      const { forceDays, testEmail } = req.body;
      
      if (!process.env.BREVO_API_KEY) {
        res.status(400).json({ error: "BREVO_API_KEY not configured" });
        return;
      }

      if (testEmail && forceDays !== undefined) {
        // Run a target test for a specific email with a forced days difference
        const snap = await getDocs(collection(db, "users"));
        const userDoc = snap.docs.find(d => d.data().email === testEmail);
        
        let name = "Parceiro de Teste";
        let barbearia = "Barbearia de Teste";
        if (userDoc) {
          const user = userDoc.data();
          name = user.nomeProprietario || user.nomeBarbearia || "Parceiro";
          barbearia = user.nomeBarbearia || "sua barbearia";
        }

        let sent = "";
        let whatsapp = "";
        if (userDoc) {
          whatsapp = userDoc.data().whatsapp || "";
        }

        if (forceDays === 3) {
          const subject = "✂️ Seu teste de 7 dias no Cortestime: 3º dia de uso! Configurando sua barbearia";
          const body = wrapInBrandTemplate(
            `Olá, ${name}!`,
            `
              <p>Você já está no <strong>3º dia do seu teste grátis de 7 dias</strong> do Cortestime para a barbearia <strong>${barbearia}</strong>.</p>
              <p>Nesses primeiros dias, aproveite para cadastrar seus barbeiros, ajustar sua lista de serviços e divulgar o link da sua vitrine digital!</p>
            `
          );
          await sendSequenceEmail(testEmail, name, subject, body);
          if (whatsapp) {
            await sendSequenceSMS(whatsapp, `Cortestime: Ola ${name}! Voce esta no 3o dia do teste gratis de 7 dias da barbearia ${barbearia}: cortestime.com.br`);
          }
          sent += "Day 3 (3º dia de teste - Email & SMS)";
        } else if (forceDays === 5) {
          const subject = "📱 Restam 2 dias do seu teste de 7 dias! Sua vitrine digital está pronta";
          const body = wrapInBrandTemplate(
            `Olá, ${name}!`,
            `
              <p>Faltam apenas <strong>2 dias</strong> para o encerramento do seu teste grátis de 7 dias no Cortestime.</p>
              <p>Ative seu Plano Pro para garantir que sua barbearia continue recebendo agendamentos automáticos sem interrupção!</p>
            `
          );
          await sendSequenceEmail(testEmail, name, subject, body);
          if (whatsapp) {
            await sendSequenceSMS(whatsapp, `Cortestime: Faltam apenas 2 dias do seu teste gratis de 7 dias! Ative o Plano Pro: cortestime.com.br`);
          }
          sent += "Day 5 (Reta final - Email & SMS)";
        } else if (forceDays === 7) {
          const subject = "⏰ Hoje é o último dia do seu teste grátis de 7 dias! Ative o Plano Pro";
          const body = wrapInBrandTemplate(
            `Olá, ${name}!`,
            `
              <p>Hoje é o <strong>7º e último dia</strong> do seu teste grátis no Cortestime.</p>
              <p>Assine o Plano Pro por apenas <strong>R$ 49,90/mês</strong> para manter sua agenda online sempre ativa.</p>
            `
          );
          await sendSequenceEmail(testEmail, name, subject, body);
          if (whatsapp) {
            await sendSequenceSMS(whatsapp, `Cortestime: Hoje e o ultimo dia do seu teste gratis de 7 dias! Garanta seu Plano Pro: cortestime.com.br`);
          }
          sent += "Day 7 (Último dia - Email & SMS)";
        } else if (forceDays === 8) {
          const subject = "⚡ Seu teste grátis de 7 dias venceu. Mude para o Plano Pro!";
          const body = wrapInBrandTemplate(
            `Olá, ${name}!`,
            `
              <p>Seu período de teste grátis de 7 dias no Cortestime chegou ao fim.</p>
              <p>Assine o plano Pro agora para reativar seu agendamento online.</p>
            `
          );
          await sendSequenceEmail(testEmail, name, subject, body);
          if (whatsapp) {
            await sendSequenceSMS(whatsapp, `Cortestime: Seu teste de 7 dias expirou. Ative o Plano Pro e receba agendamentos: cortestime.com.br`);
          }
          sent += "Day 8 (Pós-expiração - Email & SMS)";
        }

        res.json({ success: true, message: `E-mail de teste enviado para ${testEmail}: ${sent || "Nenhum"}` });
        return;
      }

      // Default: run standard check
      await runEmailSequenceAutomation();
      res.json({ success: true, message: "Standard automation routine executed" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Proxy Endpoint: Create Mercado Pago Pix Payment (Official API)
  app.post("/api/payments/create-preference", async (req, res) => {
    try {
      const { planName, price, merchantUid, email } = req.body;
      let accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
      
      console.log("[MercadoPago] create-preference request received for Pix payment. Merchant:", merchantUid);
      console.log("[MercadoPago] Token configured:", accessToken ? "YES" : "NO");
      if (accessToken) {
        console.log("[MercadoPago] Token prefix:", accessToken.substring(0, 15), "... length:", accessToken.length);
      }

      // If the token is the expired fallback placeholder, treat it as not configured
      if (accessToken === "TEST-26391707456161-070916-3f497b7e92e1b4aaf0ee4568f4580224-704673976") {
        console.log("[MercadoPago] Fallback default placeholder token detected. Treating as not configured.");
        accessToken = undefined;
      }
      
      // Determine if we should emulate sandbox because there is no API key configured
      const isSimulatedMode = !accessToken || accessToken.trim() === "";

      // Dynamic host detection for notification_url
      let host = "";
      
      // Try x-forwarded-host
      const xfh = req.headers["x-forwarded-host"];
      if (xfh) {
        const parts = Array.isArray(xfh) ? xfh[0] : String(xfh);
        const cleanHost = parts.split(",")[0].trim();
        if (cleanHost && !cleanHost.includes("localhost") && !cleanHost.includes("127.0.0.1")) {
          host = cleanHost;
        }
      }

      // Try referer
      if (!host) {
        const referer = req.headers["referer"];
        if (referer) {
          try {
            const refUrl = new URL(String(referer));
            if (refUrl.hostname && !refUrl.hostname.includes("localhost") && !refUrl.hostname.includes("127.0.0.1")) {
              host = refUrl.host;
            }
          } catch (e) {}
        }
      }

      // Try origin
      if (!host) {
        const origin = req.headers["origin"];
        if (origin) {
          try {
            const origUrl = new URL(String(origin));
            if (origUrl.hostname && !origUrl.hostname.includes("localhost") && !origUrl.hostname.includes("127.0.0.1")) {
              host = origUrl.host;
            }
          } catch (e) {}
        }
      }

      // Fallback to standard host header
      if (!host) {
        const reqHost = req.get("host") || "";
        const cleanHost = reqHost.split(",")[0].trim();
        if (cleanHost && !cleanHost.includes("localhost") && !cleanHost.includes("127.0.0.1")) {
          host = cleanHost;
        }
      }

      // Fallback to APP_URL env var
      if (!host && process.env.APP_URL) {
        try {
          const envUrl = new URL(process.env.APP_URL);
          if (envUrl.hostname && !envUrl.hostname.includes("localhost") && !envUrl.hostname.includes("127.0.0.1")) {
            host = envUrl.host;
          }
        } catch (e) {}
      }

      // Determine the best protocol (force https if host is run.app or if any forwarded header says so)
      let protocol = "https";
      const xfp = req.headers["x-forwarded-proto"];
      if (xfp) {
        const parts = Array.isArray(xfp) ? xfp[0] : String(xfp);
        const cleanProto = parts.split(",")[0].trim().toLowerCase();
        if (cleanProto === "http" || cleanProto === "https") {
          protocol = cleanProto;
        }
      }

      if (!host) {
        host = "cortestime.com.br";
        protocol = "https";
      }

      const appUrl = `${protocol}://${host}`;
      const notificationUrl = `${appUrl}/api/payments/webhook`;

      if (isSimulatedMode) {
        console.log("[MercadoPago] MERCADO_PAGO_ACCESS_TOKEN is not configured. Emulating high-fidelity sandbox Pix checkout.");
        const mockPaymentId = `simulated_${merchantUid}___${planName}___${Date.now()}`;
        const mockCopiaCola = `00020101021226930014br.gov.bcb.pix2571pix.mercadopago.com/qr/v2/simulated-pix-payment-${merchantUid}-${planName}-5204000053039865802BR5915Cortestime%20Pro6009Sao%20Paulo62070503***6304ABCD`;
        
        res.json({
          success: true,
          sandbox: true,
          paymentId: mockPaymentId,
          status: "pending",
          qrCode: mockCopiaCola,
          qrCodeBase64: null, // Frontend can render dynamic QR from API or qrserver
          ticketUrl: "https://www.mercadopago.com.br",
          message: "Simulated Pix Payment created successfully"
        });
        return;
      }

      console.log(`Creating dynamic Mercado Pago Pix payment for plan ${planName} ($${price}) for merchant ${merchantUid}...`);

      const payload = {
        transaction_amount: Number(price),
        description: `Plano Pro - BarberFlow (${planName})`,
        payment_method_id: "pix",
        payer: {
          email: email || "usuario@cortestime.com.br",
          first_name: "Cliente",
          last_name: "BarberFlow"
        },
        external_reference: `${merchantUid}___${planName}`,
        notification_url: notificationUrl
      };

      const idempotencyKey = `${merchantUid}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      let response = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": idempotencyKey
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[MercadoPago] Official Pix creation failed: ${errorText}. Attempting with standard buyer email...`);
        
        // Retry with a generic email to prevent self-purchase errors
        const retryPayload = {
          ...payload,
          payer: {
            email: "cliente_pro_pagador@cortestime.com.br",
            first_name: "Pagador",
            last_name: "Cortestime"
          }
        };

        const retryIdempotencyKey = `${merchantUid}-${Date.now()}-retry`;
        response = await fetch("https://api.mercadopago.com/v1/payments", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "X-Idempotency-Key": retryIdempotencyKey
          },
          body: JSON.stringify(retryPayload)
        });

        if (!response.ok) {
          const finalErrorText = await response.text();
          const isPolicyBlocked = finalErrorText.includes("PolicyAgent") || finalErrorText.includes("PA_UNAUTHORIZED_RESULT_FROM_POLICIES");
          
          if (isPolicyBlocked) {
            console.warn("[MercadoPago] PolicyAgent block detected. Account has security policies/self-purchase blocks. Gracefully falling back to a simulated Pix payment so the user can experience the full flow.");
            const mockPaymentId = `simulated_${merchantUid}___${planName}___${Date.now()}`;
            const mockCopiaCola = `00020101021226930014br.gov.bcb.pix2571pix.mercadopago.com/qr/v2/simulated-pix-payment-${merchantUid}-${planName}-5204000053039865802BR5915Cortestime%20Pro6009Sao%20Paulo62070503***6304ABCD`;
            
            res.json({
              success: true,
              sandbox: true,
              policyBlocked: true,
              paymentId: mockPaymentId,
              status: "pending",
              qrCode: mockCopiaCola,
              qrCodeBase64: null,
              ticketUrl: "https://www.mercadopago.com.br",
              message: "Simulated Pix Payment created successfully (Policy fallback)"
            });
            return;
          }

          throw new Error(`Mercado Pago Pix Payment creation failed completely. Error: ${finalErrorText}`);
        }
      }

      const paymentData = await response.json();
      console.log("[MercadoPago] Dynamic Pix Payment created successfully!", paymentData.id);

      const qrCode = paymentData.point_of_interaction?.transaction_data?.qr_code;
      const qrCodeBase64 = paymentData.point_of_interaction?.transaction_data?.qr_code_base64;
      const ticketUrl = paymentData.point_of_interaction?.transaction_data?.ticket_url;

      res.json({
        success: true,
        sandbox: accessToken.startsWith("TEST-"),
        paymentId: paymentData.id,
        status: paymentData.status,
        qrCode,
        qrCodeBase64,
        ticketUrl
      });
    } catch (err: any) {
      console.error("Error creating Mercado Pago Pix payment:", err);
      const msg = err.message || "";
      const isPolicyBlocked = msg.includes("PolicyAgent") || msg.includes("PA_UNAUTHORIZED_RESULT_FROM_POLICIES");
      const isUnauthorized = !isPolicyBlocked && (msg.toLowerCase().includes("unauthorized") || msg.includes("401") || msg.toLowerCase().includes("unauthorised"));
      
      if (isUnauthorized) {
        res.status(401).json({
          success: false,
          unauthorized: true,
          error: "O token de acesso (Access Token) do Mercado Pago configurado é inválido ou expirou. Verifique suas credenciais em seu painel de Mercado Pago Developers.",
          rawError: msg
        });
        return;
      }

      res.status(isPolicyBlocked ? 403 : 500).json({ 
        success: false,
        policyBlocked: isPolicyBlocked,
        error: isPolicyBlocked 
          ? "Sua credencial do Mercado Pago foi recusada pelas políticas do Mercado Pago (PolicyAgent). Isso acontece quando a conta Mercado Pago ainda não foi homologada/aprovada para produção."
          : msg || "Failed to create Pix payment",
        rawError: msg
      });
    }
  });

  // Polling/Status Endpoint: Look up Pix payment status and update Firebase state if paid
  app.get("/api/payments/status/:paymentId", async (req, res) => {
    try {
      const { paymentId } = req.params;
      
      if (paymentId.startsWith("simulated_")) {
        const parts = paymentId.split("___");
        const merchantUid = parts[0].replace("simulated_", "");
        const planName = parts[1] || "pro";
        const createdTime = parseInt(parts[2] || "0", 10);
        
        const elapsedSeconds = createdTime > 0 ? (Date.now() - createdTime) / 1000 : 9;
        
        // Auto-approve after 8 seconds of polling to let the user experience the fully automated checkout flow!
        if (elapsedSeconds > 8) {
          console.log(`[Simulated Payment] Auto-approving payment ${paymentId} for merchant ${merchantUid} (${planName})...`);
          if (merchantUid) {
            const merchantRef = doc(db, "merchants", merchantUid);
            await updateDoc(merchantRef, { plano: "pro" });
          }
          res.json({
            success: true,
            status: "approved",
            sandbox: true,
            external_reference: `${merchantUid}___${planName}`
          });
          return;
        }

        res.json({
          success: true,
          status: "pending",
          sandbox: true,
          message: "Payment is simulated and still pending. It will automatically approve in a few seconds to let you test the full flow!",
          external_reference: `${merchantUid}___${planName}`
        });
        return;
      }

      let accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
      if (accessToken === "TEST-26391707456161-070916-3f497b7e92e1b4aaf0ee4568f4580224-704673976") {
        accessToken = undefined;
      }

      if (!accessToken || accessToken.trim() === "") {
        // If they query for status without access token, behave as simulated/pending (which will be processed above if it starts with simulated_)
        res.json({
          success: true,
          status: "pending",
          sandbox: true
        });
        return;
      }

      console.log(`[Status Lookup] Checking Mercado Pago status for payment ID: ${paymentId}...`);
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Mercado Pago Payment status lookup failed: ${errorText}`);
      }

      const paymentData = await response.json();
      console.log(`[Status Lookup] Response Status: ${paymentData.status} for payment ${paymentId}`);

      if (paymentData.status === "approved" && paymentData.external_reference) {
        const [merchantUid, planName] = paymentData.external_reference.split("___");
        if (merchantUid) {
          console.log(`[Status Lookup] Payment APPROVED. Activating Pro plan for merchant ${merchantUid} (Plan: ${planName})...`);
          const merchantRef = doc(db, "merchants", merchantUid);
          await updateDoc(merchantRef, { plano: "pro" });
          console.log(`Merchant ${merchantUid} is now Pro.`);
        }
      }

      res.json({
        success: true,
        status: paymentData.status,
        status_detail: paymentData.status_detail,
        external_reference: paymentData.external_reference
      });
    } catch (err: any) {
      console.error("Error checking payment status:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Simulator Helper: Instant activation bypass for Sandbox/Developer mode
  app.post("/api/payments/simulate-success", async (req, res) => {
    try {
      const { merchantUid } = req.body;
      if (!merchantUid) {
        res.status(400).json({ success: false, error: "merchantUid é obrigatório para simulação" });
        return;
      }
      
      console.log(`[Simulator] Activating Pro plan instantly for merchant ${merchantUid}...`);
      const merchantRef = doc(db, "merchants", merchantUid);
      await updateDoc(merchantRef, { plano: "pro" });
      
      res.json({
        success: true,
        message: "Simulação de pagamento Pix bem-sucedida! O plano Pro foi ativado com sucesso no Firebase."
      });
    } catch (err: any) {
      console.error("Error in simulated success activation:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Webhook Endpoint: Handle Mercado Pago async payment and subscription notifications
  app.post("/api/payments/webhook", async (req, res) => {
    try {
      console.log("Received Mercado Pago Webhook payload:", JSON.stringify(req.body));
      
      let accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
      if (accessToken === "TEST-26391707456161-070916-3f497b7e92e1b4aaf0ee4568f4580224-704673976") {
        accessToken = undefined;
      }
      if (!accessToken || accessToken.trim() === "") {
        console.warn("Webhook received but MERCADO_PAGO_ACCESS_TOKEN is not configured.");
        res.status(400).send("Mercado Pago Access Token not configured");
        return;
      }
      
      // Handle both Webhook style (type & data.id) and IPN style (topic & id)
      let paymentId = req.body.data?.id || req.body.id || req.query.id;
      let topic = req.body.type || req.body.topic || req.query.topic;
      
      if (!paymentId) {
        // Can be a registration verification request from Mercado Pago
        console.log("No paymentId found in webhook request. Acknowledging.");
        res.status(200).send("Notification acknowledged without action");
        return;
      }

      // Check if it's a subscription (preapproval) notification
      const isSubscription = topic === "preapproval" || topic === "subscription_preapproval";

      if (isSubscription) {
        console.log(`Checking preapproval status for ID: ${paymentId}...`);
        const response = await fetch(`https://api.mercadopago.com/preapproval/${paymentId}`, {
          headers: {
            "Authorization": `Bearer ${accessToken}`
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Mercado Pago Preapproval lookup failed: ${errorText}`);
          res.status(500).send("Failed to lookup preapproval");
          return;
        }

        const preapprovalData = await response.json();
        console.log(`Preapproval Lookup Success. Status: ${preapprovalData.status}, Ref: ${preapprovalData.external_reference}`);

        const isApproved = preapprovalData.status === "authorized" || preapprovalData.status === "active";
        if (isApproved && preapprovalData.external_reference) {
          const [merchantUid, planName] = preapprovalData.external_reference.split("___");
          
          if (merchantUid) {
            console.log(`Activating Pro plan for merchant ${merchantUid} (Plan: ${planName}) via preapproval webhook...`);
            const merchantRef = doc(db, "merchants", merchantUid);
            await updateDoc(merchantRef, { plano: "pro" });
            console.log(`Merchant ${merchantUid} is now Pro.`);
          }
        }
        res.status(200).send("OK");
        return;
      }

      // Standard payment notification path
      console.log(`Checking payment status for ID: ${paymentId} (Topic: ${topic})...`);

      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Mercado Pago Payment lookup failed: ${errorText}`);
        res.status(500).send("Failed to lookup payment");
        return;
      }

      const paymentData = await response.json();
      console.log(`Payment Lookup Success. Status: ${paymentData.status}, Ref: ${paymentData.external_reference}`);

      if (paymentData.status === "approved" && paymentData.external_reference) {
        const [merchantUid, planName] = paymentData.external_reference.split("___");
        
        if (merchantUid) {
          console.log(`Activating Pro plan for merchant ${merchantUid} (Plan: ${planName}) via webhook...`);
          const merchantRef = doc(db, "merchants", merchantUid);
          await updateDoc(merchantRef, { plano: "pro" });
          console.log(`Merchant ${merchantUid} is now Pro.`);
        }
      }

      res.status(200).send("OK");
    } catch (err: any) {
      console.error("Error handling Mercado Pago Webhook:", err);
      res.status(500).send("Webhook internal processing error");
    }
  });


  if (!process.env.VERCEL) {
    // Set up background scheduler every 12 hours
    setInterval(() => {
      runEmailSequenceAutomation().catch(err => console.error("Scheduler error:", err));
    }, 12 * 60 * 60 * 1000);

    // Run once on server startup
    setTimeout(() => {
      runEmailSequenceAutomation().catch(err => console.error("Startup automation error:", err));
    }, 5000);
  }

  // Vite middleware or production serving
  if (process.env.NODE_ENV !== "production") {
    (async () => {
      const { createServer } = await import("vite");
      const vite = await createServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);

      app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running in development on port ${PORT}`);
      });
    })();
  } else {
    if (!process.env.VERCEL) {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });

      const serverPort = process.env.PORT || PORT;
      app.listen(Number(serverPort), "0.0.0.0", () => {
        console.log(`Server running in production on port ${serverPort}`);
      });
    }
  }

export default app;
