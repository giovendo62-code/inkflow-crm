import { Appointment, Client, Course, Student, TeachingMaterial, Tenant, User } from '../types';

export const toClientDB = (c: Client) => ({
    id: c.id,
    tenant_id: c.tenantId,
    first_name: c.firstName,
    last_name: c.lastName,
    email: c.email,
    phone: c.phone,
    fiscal_code: c.fiscalCode || null,
    birth_date: c.birthDate || null,
    address: c.address,
    preferences: c.preferences,
    preferred_style: c.preferredStyle,
    in_broadcast: c.inBroadcast || false,
    consents: c.consents,
    notes: c.notes,
    attachments: c.attachments || [],
    created_at: c.createdAt,
    updated_at: c.updatedAt || new Date().toISOString()
});

export const fromClientDB = (data: any): Client => ({
    id: data.id,
    tenantId: data.tenant_id,
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email,
    phone: data.phone,
    fiscalCode: data.fiscal_code,
    birthDate: data.birth_date,
    address: data.address,
    preferences: data.preferences,
    preferredStyle: data.preferred_style,
    inBroadcast: data.in_broadcast,
    consents: data.consents,
    notes: data.notes,
    attachments: data.attachments,
    privacyPolicyAccepted: data.privacy_policy_accepted,
    informedConsentAccepted: data.informed_consent_accepted,
    createdAt: data.created_at,
    updatedAt: data.updated_at
});

export const toAppointmentDB = (a: Appointment) => ({
    id: a.id,
    tenant_id: a.tenantId,
    client_id: a.clientId,
    artist_id: a.artistId,
    title: a.title,
    description: a.description,
    start_time: a.startTime,
    end_time: a.endTime,
    service_type: a.serviceType,
    tattoo_style: a.tattooStyle,
    status: a.status,
    financials: a.financials,
    reminders: a.reminders,
    notes: a.notes,
    created_at: a.createdAt,
    updated_at: a.updatedAt || new Date().toISOString()
});

export const fromAppointmentDB = (data: any): Appointment => ({
    id: data.id,
    tenantId: data.tenant_id,
    clientId: data.client_id,
    artistId: data.artist_id,
    title: data.title,
    description: data.description,
    startTime: data.start_time,
    endTime: data.end_time,
    serviceType: data.service_type,
    tattooStyle: data.tattoo_style,
    status: data.status,
    financials: data.financials,
    reminders: data.reminders,
    notes: data.notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at
});

export const toCourseDB = (c: Course) => ({
    id: c.id,
    tenant_id: c.tenantId,
    name: c.name,
    description: c.description,
    start_date: c.startDate,
    end_date: c.endDate,
    total_hours: c.totalHours,
    total_lessons: c.totalLessons,
    price: c.price,
    schedule: c.schedule,
    program: c.program,
    attachments: c.attachments || [],
    created_at: c.createdAt
});

export const fromCourseDB = (data: any): Course => ({
    id: data.id,
    tenantId: data.tenant_id,
    name: data.name,
    description: data.description,
    startDate: data.start_date,
    endDate: data.end_date,
    totalHours: data.total_hours,
    totalLessons: data.total_lessons,
    price: data.price,
    schedule: data.schedule,
    program: data.program,
    attachments: data.attachments,
    createdAt: data.created_at
});

export const toStudentDB = (s: Student) => ({
    id: s.id,
    tenant_id: s.tenantId,
    course_id: s.courseId,
    first_name: s.firstName,
    last_name: s.lastName,
    email: s.email,
    phone: s.phone,
    total_paid: s.totalPaid || 0,
    created_at: s.createdAt
});

export const fromStudentDB = (data: any): Student => ({
    id: data.id,
    tenantId: data.tenant_id,
    courseId: data.course_id,
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email,
    phone: data.phone,
    totalPaid: data.total_paid,
    createdAt: data.created_at
});

export const toMaterialDB = (m: TeachingMaterial) => ({
    id: m.id,
    tenant_id: m.tenantId,
    student_id: m.studentId,
    course_id: m.courseId,
    title: m.title,
    description: m.description,
    url: m.url,
    type: m.type,
    unlock_threshold_days: m.unlockThresholdDays,
    created_at: m.createdAt
});

export const fromMaterialDB = (data: any): TeachingMaterial => ({
    id: data.id,
    tenantId: data.tenant_id,
    studentId: data.student_id,
    courseId: data.course_id,
    title: data.title,
    description: data.description,
    url: data.url,
    type: data.type,
    unlockThresholdDays: data.unlock_threshold_days,
    createdAt: data.created_at
});
