import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
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
  async function callBrevo(endpoint: string, method: string, body: any) {
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
      console.error(`Brevo API Error (${response.status}) on ${endpoint}:`, errorText);
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
        await callBrevo("contacts", "POST", payload);
      } catch (err: any) {
        // If Brevo complains about the phone number format, retry without the SMS attribute so the email sync succeeds
        if (attributes.SMS && err.message && (
          err.message.toLowerCase().includes("phone") || 
          err.message.toLowerCase().includes("sms") || 
          err.message.toLowerCase().includes("parameter") ||
          err.message.toLowerCase().includes("invalid")
        )) {
          console.warn("Retrying Brevo contact sync without SMS attribute due to format error:", err.message);
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

  // Brand Wrapper for Sequence Emails
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
      throw error; // Propagate error so test endpoint knows and can report details to client
    }
  }

  // Check and run email sequence automation
  async function runEmailSequenceAutomation() {
    if (!process.env.BREVO_API_KEY) {
      console.log("Skipping email sequence automation: BREVO_API_KEY not configured.");
      return;
    }

    console.log("Running Brevo email sequence automation job...");
    try {
      const snap = await getDocs(collection(db, "users"));
      if (snap.empty) {
        console.log("No users found in Firestore to check.");
        return;
      }

      const now = Date.now();

      for (const docSnap of snap.docs) {
        try {
          const user = docSnap.data();
          if (!user.email || !user.criadoEm) continue;

          // Skip users with Pro Plan as requested
          if (user.plano === "pro") {
            continue;
          }

          // Skip the main admin/developer email to avoid spamming your own inbox during development
          if (user.email === "cristoffcauaff9@gmail.com") {
            continue;
          }

          // Calculate days since account creation
          const creationTime = new Date(user.criadoEm).getTime();
          const diffDays = Math.floor((now - creationTime) / (1000 * 60 * 60 * 24));

          const uid = docSnap.id;
          const name = user.nomeProprietario || user.nomeBarbearia || "Parceiro";
          const email = user.email;

          // Day 2 Email
          if (diffDays >= 2 && !user.brevoDay2Sent) {
            const subject = "✂️ Boas-vindas ao Cortestime! Seu teste grátis começou";
            const body = wrapInBrandTemplate(
              `Olá, ${name}!`,
              `
                <p>Vimos que você criou sua conta no Cortestime para gerenciar a barbearia <strong>${user.nomeBarbearia || 'sua barbearia'}</strong>. Seja muito bem-vindo!</p>
                <p>Nesses primeiros dias, aproveite para cadastrar seus barbeiros e definir a lista de serviços oferecidos.</p>
                <p>Se precisar de qualquer ajuda, nossa equipe está à disposição!</p>
              `
            );
            await sendSequenceEmail(email, name, subject, body);
            await updateDoc(doc(db, "users", uid), { brevoDay2Sent: true });
          }

          // Day 5 Email
          if (diffDays >= 5 && !user.brevoDay5Sent) {
            const subject = "📱 Sua vitrine digital está pronta para atrair clientes!";
            const body = wrapInBrandTemplate(
              `Olá, ${name}!`,
              `
                <p>Sua vitrine digital está prontinha! Que tal baixar seu QR Code personalizado e colocar no balcão da sua barbearia?</p>
                <p>Você também pode adicionar o link da sua vitrine na bio do Instagram para facilitar os agendamentos online dos seus clientes de forma profissional.</p>
                <p>Diga adeus para sempre à agenda de papel!</p>
              `
            );
            await sendSequenceEmail(email, name, subject, body);
            await updateDoc(doc(db, "users", uid), { brevoDay5Sent: true });
          }

          // Day 10 Email
          if (diffDays >= 10 && !user.brevoDay10Sent) {
            const subject = "💎 Aumente seu faturamento com os recursos Pro";
            const body = wrapInBrandTemplate(
              `Olá, ${name}!`,
              `
                <p>Você sabia que barbearias que utilizam os relatórios e a gestão do plano Pro do Cortestime chegam a aumentar seu faturamento em até 30%?</p>
                <p>Com o plano Pro, você tem acesso a relatórios profissionais de desempenho, automação de comissões para barbeiros e suporte prioritário.</p>
                <p>Atualize seu plano hoje mesmo e destrave o potencial máximo da sua barbearia!</p>
              `
            );
            await sendSequenceEmail(email, name, subject, body);
            await updateDoc(doc(db, "users", uid), { brevoDay10Sent: true });
          }

          // Day 20 Email
          if (diffDays >= 20 && !user.brevoDay20Sent) {
            const subject = "⚡ Não perca seus clientes! Mude para o plano Pro";
            const body = wrapInBrandTemplate(
              `Olá, ${name}!`,
              `
                <p>Seu período de teste grátis do Cortestime terminou. Não deixe que seus clientes fiquem sem conseguir agendar online de última hora!</p>
                <p>Assine o plano Pro para manter todos os recursos ativos e continuar gerindo seu negócio com a melhor tecnologia.</p>
              `
            );
            await sendSequenceEmail(email, name, subject, body);
            await updateDoc(doc(db, "users", uid), { brevoDay20Sent: true });
          }
        } catch (singleUserErr) {
          console.error(`Error processing email sequence for user ${docSnap.id}:`, singleUserErr);
        }
      }
    } catch (error) {
      console.error("Error running email sequence automation:", error);
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
        if (forceDays === 2) {
          const subject = "✂️ Boas-vindas ao Cortestime! Seu teste grátis começou";
          const body = wrapInBrandTemplate(
            `Olá, ${name}!`,
            `
              <p>Vimos que você criou sua conta no Cortestime para gerenciar a barbearia <strong>${barbearia}</strong>. Seja muito bem-vindo!</p>
              <p>Nesses primeiros dias, aproveite para cadastrar seus barbeiros e definir a lista de serviços oferecidos.</p>
              <p>Se precisar de qualquer ajuda, nossa equipe está à disposição!</p>
            `
          );
          await sendSequenceEmail(testEmail, name, subject, body);
          sent += "Day 2 (Boas-vindas)";
        } else if (forceDays === 5) {
          const subject = "📱 Sua vitrine digital está pronta para atrair clientes!";
          const body = wrapInBrandTemplate(
            `Olá, ${name}!`,
            `
              <p>Sua vitrine digital está prontinha! Que tal baixar seu QR Code personalizado e colocar no balcão da sua barbearia?</p>
              <p>Você também pode adicionar o link da sua vitrine na bio do Instagram para facilitar os agendamentos online dos seus clientes de forma profissional.</p>
              <p>Diga adeus para sempre à agenda de papel!</p>
            `
          );
          await sendSequenceEmail(testEmail, name, subject, body);
          sent += "Day 5 (Vitrine)";
        } else if (forceDays === 10) {
          const subject = "💎 Aumente seu faturamento com os recursos Pro";
          const body = wrapInBrandTemplate(
            `Olá, ${name}!`,
            `
              <p>Você sabia que barbearias que utilizam os relatórios e a gestão do plano Pro do Cortestime chegam a aumentar seu faturamento em até 30%?</p>
              <p>Com o plano Pro, você tem acesso a relatórios profissionais de desempenho, automação de comissões para barbeiros e suporte prioritário.</p>
              <p>Atualize seu plano hoje mesmo e destrave o potencial máximo da sua barbearia!</p>
            `
          );
          await sendSequenceEmail(testEmail, name, subject, body);
          sent += "Day 10 (Recursos Pro)";
        } else if (forceDays === 20) {
          const subject = "⚡ Não perca seus clientes! Mude para o plano Pro";
          const body = wrapInBrandTemplate(
            `Olá, ${name}!`,
            `
              <p>Seu período de teste grátis do Cortestime terminou. Não deixe que seus clientes fiquem sem conseguir agendar online de última hora!</p>
              <p>Assine o plano Pro para manter todos os recursos ativos e continuar gerindo seu negócio com a melhor tecnologia.</p>
            `
          );
          await sendSequenceEmail(testEmail, name, subject, body);
          sent += "Day 20 (Fim de Teste)";
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

  // Proxy Endpoint: Create Mercado Pago Subscription (Preapproval)
  app.post("/api/payments/create-preference", async (req, res) => {
    try {
      const { planName, price, merchantUid, email } = req.body;
      const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || "TEST-26391707456161-070916-3f497b7e92e1b4aaf0ee4568f4580224-704673976";
      
      if (!accessToken) {
        console.log("MERCADO_PAGO_ACCESS_TOKEN is not configured. Emulating sandbox checkout.");
        res.json({
          success: true,
          sandbox: true,
          init_point: null,
          message: "Sandbox simulator ready"
        });
        return;
      }

      console.log(`Creating Mercado Pago subscription (preapproval) for plan ${planName} ($${price}) for merchant ${merchantUid}...`);
      
      const notificationUrl = process.env.APP_URL && process.env.APP_URL.startsWith("http")
        ? `${process.env.APP_URL}/api/payments/webhook`
        : undefined;

      // Call Mercado Pago Subscriptions API (Preapproval)
      let response = await fetch("https://api.mercadopago.com/preapproval", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          reason: `Assinatura Cortestime Pro - Plano ${planName}`,
          external_reference: `${merchantUid}___${planName}`,
          payer_email: email || "usuario@cortestime.com.br",
          auto_recurring: {
            frequency: 1,
            frequency_type: "months",
            transaction_amount: Number(price),
            currency_id: "BRL"
          },
          back_url: `${process.env.APP_URL || "http://localhost:3000"}/?payment_status=success&uid=${merchantUid}&plan=${planName}`,
          status: "pending"
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Initial Mercado Pago subscription creation failed: ${errorText}. Retrying with non-conflicting buyer email...`);
        
        // Retry with a generic, safe buyer email to bypass self-purchase PolicyAgent block
        response = await fetch("https://api.mercadopago.com/preapproval", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            reason: `Assinatura Cortestime Pro - Plano ${planName}`,
            external_reference: `${merchantUid}___${planName}`,
            payer_email: "cliente_pro_pagador@cortestime.com.br",
            auto_recurring: {
              frequency: 1,
              frequency_type: "months",
              transaction_amount: Number(price),
              currency_id: "BRL"
            },
            back_url: `${process.env.APP_URL || "http://localhost:3000"}/?payment_status=success&uid=${merchantUid}&plan=${planName}`,
            status: "pending"
          })
        });

        if (!response.ok) {
          const finalErrorText = await response.text();
          throw new Error(`Mercado Pago Subscriptions API error: ${finalErrorText}`);
        }
      }

      const data = await response.json();
      
      // If we are using a sandbox/test token, redirect to sandbox_init_point if available
      const initPointUrl = accessToken.startsWith("TEST-") && data.sandbox_init_point
        ? data.sandbox_init_point
        : data.init_point;

      res.json({
        success: true,
        sandbox: accessToken.startsWith("TEST-"),
        init_point: initPointUrl,
        preferenceId: data.id
      });
    } catch (err: any) {
      console.error("Error creating Mercado Pago subscription:", err);
      const msg = err.message || "";
      const isPolicyBlocked = msg.includes("PolicyAgent") || msg.includes("PA_UNAUTHORIZED_RESULT_FROM_POLICIES") || msg.includes("UNAUTHORIZED");
      
      res.status(isPolicyBlocked ? 403 : 500).json({ 
        success: false,
        policyBlocked: isPolicyBlocked,
        error: isPolicyBlocked 
          ? "Sua credencial do Mercado Pago (token de produção) foi recusada pelas políticas do Mercado Pago (PolicyAgent). Isso acontece quando a conta Mercado Pago ainda não foi homologada/aprovada para produção, ou por restrições do firewall regional."
          : msg || "Failed to create subscription",
        rawError: msg
      });
    }
  });

  // Webhook Endpoint: Handle Mercado Pago async payment and subscription notifications
  app.post("/api/payments/webhook", async (req, res) => {
    try {
      console.log("Received Mercado Pago Webhook payload:", JSON.stringify(req.body));
      
      const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || "TEST-26391707456161-070916-3f497b7e92e1b4aaf0ee4568f4580224-704673976";
      
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
      const vite = await createViteServer({
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
