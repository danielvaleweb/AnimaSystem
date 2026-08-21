import { collection, query, where, getDocs, getDoc, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

export async function processConfirmedAsaasPayment(db: any, orderData: any, paymentDetails?: any) {
  try {
    const ownerId = orderData.ownerId || "6rbybX9mBAMp8B6gS3zQ8rT0hW32";
    const amount = Number(orderData.amount || paymentDetails?.value || 0);
    const clientName = orderData.customerName || "Cliente Asaas";
    const planRaw = (orderData.planId || "profissional").toLowerCase();
    const planName: "Starter" | "Profissional" | "Enterprise" = 
      planRaw.includes("starter") ? "Starter" : planRaw.includes("enterprise") ? "Enterprise" : "Profissional";
    const todayStr = new Date().toISOString().split("T")[0];
    const paymentRefId = orderData.asaasPaymentId || paymentDetails?.id || orderData.orderId;

    // 1. Register 'entrada' in Transactions collection
    const transQ = query(
      collection(db, "transactions"),
      where("paymentId", "==", paymentRefId)
    );
    const transSnap = await getDocs(transQ);

    if (transSnap.empty) {
      await addDoc(collection(db, "transactions"), {
        ownerId,
        title: `Assinatura Plano ${planName} - Asaas`,
        type: "entrada",
        clientName,
        amount,
        date: todayStr,
        status: "paid",
        method: (paymentDetails?.billingType || orderData.billingType || "pix").toLowerCase(),
        gateway: "asaas",
        paymentId: paymentRefId,
        orderId: orderData.orderId,
        createdAt: serverTimestamp()
      });
      console.log(`[Asaas] Registered entrada in transactions: R$ ${amount} from ${clientName}`);
    }

    // 2. Create or Update Client in 'clients' collection
    let existingClientId: string | null = null;
    let existingClientData: any = null;

    if (orderData.clientId) {
      try {
        const directSnap = await getDoc(doc(db, "clients", orderData.clientId));
        if (directSnap.exists()) {
          existingClientId = directSnap.id;
          existingClientData = directSnap.data();
        }
      } catch (e) {}
    }

    if (!existingClientId && orderData.customerCpf) {
      const clientQ = query(
        collection(db, "clients"),
        where("cpf", "==", orderData.customerCpf)
      );
      const clientSnap = await getDocs(clientQ);
      if (!clientSnap.empty) {
        existingClientId = clientSnap.docs[0].id;
        existingClientData = clientSnap.docs[0].data();
      }
    }

    const renewalMonths = Number(orderData.renewalMonths || 1);
    const isRenewal = orderData.isRenewal === true || (orderData.productId && String(orderData.productId).includes('renov'));

    if (existingClientId) {
      let baseDate = new Date();
      if (existingClientData?.nextRenewalDate && /^\d{4}-\d{2}-\d{2}/.test(existingClientData.nextRenewalDate)) {
        const [y, m, d] = existingClientData.nextRenewalDate.split('-').map(Number);
        const parsed = new Date(y, m - 1, d);
        if (parsed > baseDate) {
          baseDate = parsed;
        }
      }
      baseDate.setMonth(baseDate.getMonth() + (isRenewal ? renewalMonths : 1));
      const newRenewalDateStr = `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}-${String(baseDate.getDate()).padStart(2, '0')}`;

      await updateDoc(doc(db, "clients", existingClientId), {
        status: "active",
        plan: planName,
        monthlyValue: amount,
        nextRenewalDate: newRenewalDateStr,
        lastRenewalPaidAt: new Date().toISOString(),
        renewalMonthsPaid: (existingClientData?.renewalMonthsPaid || 0) + (isRenewal ? renewalMonths : 1),
        updatedAt: new Date().toISOString()
      });
      console.log(`[Asaas] Updated existing client ${existingClientId} - Renewal extended to ${newRenewalDateStr}`);
    } else {
      const cleanDomain = clientName.toLowerCase().replace(/[^a-z0-9]/g, "");
      const baseDate = new Date();
      baseDate.setMonth(baseDate.getMonth() + renewalMonths);
      const newRenewalDateStr = `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}-${String(baseDate.getDate()).padStart(2, '0')}`;

      const newClientRef = await addDoc(collection(db, "clients"), {
        name: clientName,
        responsible: clientName,
        logoInitials: clientName.slice(0, 2).toUpperCase(),
        plan: planName,
        domain: `${cleanDomain || 'cliente'}.animasystem.com.br`,
        firebaseProjectId: "animasystem-client",
        monthlyValue: amount,
        dueDate: 10,
        status: "active",
        nextRenewalDate: newRenewalDateStr,
        lastRenewalPaidAt: new Date().toISOString(),
        renewalMonthsPaid: renewalMonths,
        cpf: orderData.customerCpf || "",
        phone: orderData.customerPhone || "",
        email: orderData.customerEmail || "",
        ownerId,
        hireDate: todayStr,
        createdAt: new Date().toISOString()
      });
      existingClientId = newClientRef.id;
    }

    // 3. Update Leads collection to converted
    if (orderData.customerCpf) {
      const leadQ = query(
        collection(db, "leads"),
        where("cpf", "==", orderData.customerCpf)
      );
      const leadSnap = await getDocs(leadQ);
      for (const leadDoc of leadSnap.docs) {
        await updateDoc(doc(db, "leads", leadDoc.id), {
          status: "converted",
          updatedAt: new Date().toISOString()
        });
      }
    }

    return existingClientId;
  } catch (err: any) {
    console.error("[Asaas] Error processing confirmed payment:", err);
    return null;
  }
}
