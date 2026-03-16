/**
 * GET /api/public/customer — получить клиента по tenantId + платформа + platformUserId или phone
 * POST /api/public/customer — получить или создать клиента (при первом заходе)
 * PATCH /api/public/customer — обновить имя и телефон
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function getPlatformUserIdField(platform: string): "telegramUserId" | "vkUserId" | "maxUserId" | null {
  if (platform === "telegram") return "telegramUserId";
  if (platform === "vk") return "vkUserId";
  if (platform === "max") return "maxUserId";
  return null;
}

function toCustomerResponse(c: {
  id: string;
  name: string | null;
  phone: string;
  points: unknown;
  stamps: number;
  telegramUserId: string | null;
  vkUserId: string | null;
  maxUserId: string | null;
  lastName?: string | null;
  patronymic?: string | null;
  dateOfBirth?: Date | null;
  email?: string | null;
  city?: string | null;
  consentToMailing?: boolean;
}) {
  const dob = c.dateOfBirth;
  return {
    id: c.id,
    name: c.name ?? undefined,
    phone: c.phone,
    points: Number(c.points),
    stamps: c.stamps,
    telegramUserId: c.telegramUserId ?? undefined,
    vkUserId: c.vkUserId ?? undefined,
    maxUserId: c.maxUserId ?? undefined,
    lastName: c.lastName ?? undefined,
    patronymic: c.patronymic ?? undefined,
    dateOfBirth: dob ? (dob instanceof Date ? dob.toISOString().slice(0, 10) : String(dob).slice(0, 10)) : undefined,
    email: c.email ?? undefined,
    city: c.city ?? undefined,
    consentToMailing: c.consentToMailing ?? false,
  };
}

/** GET — найти клиента по platformUserId (текущая платформа) или по phone */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenantId");
  const platform = searchParams.get("platform") ?? "";
  const platformUserId = searchParams.get("platformUserId") ?? "";
  const phone = searchParams.get("phone")?.trim() ?? "";

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId обязателен" }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId, isActive: true } });
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const field = getPlatformUserIdField(platform);
  let customer = null;

  if (field && platformUserId) {
    customer = await prisma.customer.findFirst({
      where: { tenantId, [field]: platformUserId },
    });
  }
  if (!customer && phone) {
    customer = await prisma.customer.findUnique({
      where: { tenantId_phone: { tenantId, phone } },
    });
  }

  if (!customer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(toCustomerResponse(customer));
}

/** POST — получить или создать клиента при заходе в приложение */
export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    tenantId?: string;
    platform?: string;
    platformUserId?: string;
    phone?: string;
    name?: string;
    lastName?: string;
    patronymic?: string;
    dateOfBirth?: string;
    email?: string;
    city?: string;
    consentToMailing?: boolean;
  };
  const tenantId = body.tenantId;
  const platform = body.platform ?? "";
  const platformUserId = (body.platformUserId ?? "").trim();
  const phone = (body.phone ?? "").trim();
  const name = (body.name ?? "").trim();
  const lastName = (body.lastName ?? "").trim();
  const patronymic = (body.patronymic ?? "").trim();
  const dateOfBirthRaw = (body.dateOfBirth ?? "").trim();
  const email = (body.email ?? "").trim();
  const city = (body.city ?? "").trim();
  const consentToMailing = body.consentToMailing ?? false;

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId обязателен" }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId, isActive: true } });
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const field = getPlatformUserIdField(platform);
  let customer = null;

  if (field && platformUserId) {
    customer = await prisma.customer.findFirst({
      where: { tenantId, [field]: platformUserId },
    });
  }
  if (!customer && phone) {
    customer = await prisma.customer.findUnique({
      where: { tenantId_phone: { tenantId, phone } },
    });
    if (customer && field && platformUserId) {
      const linkData: { telegramUserId?: string; vkUserId?: string; maxUserId?: string } = {};
      if (field === "telegramUserId") linkData.telegramUserId = platformUserId;
      if (field === "vkUserId") linkData.vkUserId = platformUserId;
      if (field === "maxUserId") linkData.maxUserId = platformUserId;
      await prisma.customer.update({
        where: { id: customer.id },
        data: linkData,
      });
      customer = await prisma.customer.findUnique({
        where: { id: customer.id },
      });
    }
  }

  if (!customer) {
    if (!phone) {
      return NextResponse.json(
        { error: "Для создания нужен phone или существующий platformUserId" },
        { status: 400 }
      );
    }
    const createData: {
      tenantId: string;
      phone: string;
      name: string | null;
      platform: string | null;
      platformUserId: string | null;
      telegramUserId?: string;
      vkUserId?: string;
      maxUserId?: string;
      lastName?: string | null;
      patronymic?: string | null;
      dateOfBirth?: Date | null;
      email?: string | null;
      city?: string | null;
      consentToMailing: boolean;
      invitedByCustomerId?: string | null;
    } = {
      tenantId,
      phone,
      name: name || null,
      platform: platform || null,
      platformUserId: platformUserId || null,
      consentToMailing,
    };
    if (field === "telegramUserId" && platformUserId) createData.telegramUserId = platformUserId;
    if (field === "vkUserId" && platformUserId) createData.vkUserId = platformUserId;
    if (field === "maxUserId" && platformUserId) createData.maxUserId = platformUserId;
    if (lastName) createData.lastName = lastName;
    if (patronymic) createData.patronymic = patronymic;
    if (dateOfBirthRaw) createData.dateOfBirth = new Date(dateOfBirthRaw);
    if (email) createData.email = email;
    if (city) createData.city = city;
    customer = await prisma.customer.create({
      data: createData,
    });
  }

  return NextResponse.json(toCustomerResponse(customer));
}

/** PATCH — обновить профиль (имя, телефон, фамилия, отчество, день рождения, email, город, согласие на рассылку) */
export async function PATCH(req: NextRequest) {
  const body = (await req.json()) as {
    tenantId?: string;
    customerId?: string;
    platform?: string;
    platformUserId?: string;
    phone?: string;
    name?: string;
    lastName?: string;
    patronymic?: string;
    dateOfBirth?: string;
    email?: string;
    city?: string;
    consentToMailing?: boolean;
  };
  const tenantId = body.tenantId;
  const customerId = body.customerId;
  const platform = body.platform ?? "";
  const platformUserId = (body.platformUserId ?? "").trim();
  const phone = (body.phone ?? "").trim();
  const name = (body.name ?? "").trim();
  const lastName = (body.lastName ?? "").trim();
  const patronymic = (body.patronymic ?? "").trim();
  const dateOfBirthRaw = (body.dateOfBirth ?? "").trim();
  const dateOfBirth = dateOfBirthRaw ? new Date(dateOfBirthRaw) : undefined;
  const email = (body.email ?? "").trim();
  const city = (body.city ?? "").trim();
  const consentToMailing = body.consentToMailing;

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId обязателен" }, { status: 400 });
  }

  let customer = null;
  if (customerId) {
    customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId },
    });
  }
  if (!customer && getPlatformUserIdField(platform) && platformUserId) {
    const field = getPlatformUserIdField(platform)!;
    customer = await prisma.customer.findFirst({
      where: { tenantId, [field]: platformUserId },
    });
  }

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const updateData: {
    name?: string | null;
    phone?: string;
    lastName?: string | null;
    patronymic?: string | null;
    dateOfBirth?: Date | null;
    email?: string | null;
    city?: string | null;
    consentToMailing?: boolean;
  } = {};
  if (name !== undefined) updateData.name = name || null;
  if (phone) updateData.phone = phone;
  if (lastName !== undefined) updateData.lastName = lastName || null;
  if (patronymic !== undefined) updateData.patronymic = patronymic || null;
  if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth ?? null;
  if (email !== undefined) updateData.email = email || null;
  if (city !== undefined) updateData.city = city || null;
  if (consentToMailing !== undefined) updateData.consentToMailing = consentToMailing;

  if (Object.keys(updateData).length > 0) {
    customer = await prisma.customer.update({
      where: { id: customer.id },
      data: updateData,
    });
  }

  return NextResponse.json(toCustomerResponse(customer));
}
