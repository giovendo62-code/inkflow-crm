import { supabase } from './supabase';
import { type Appointment, type Client, type Tenant, type User, type ChatMessage, type Course, type Student, type Attendance, type CoursePayment, type TeachingMaterial, type WaitlistEntry } from '../types';

// Data Mappers (DB <-> App)
const mapClientFromDB = (data: any): Client => ({
    id: data.id,
    tenantId: data.tenant_id,
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email,
    phone: data.phone,
    fiscalCode: data.fiscal_code,
    birthDate: data.birth_date,
    address: data.address, // JSONB
    preferences: data.preferences || { styles: [] }, // JSONB
    preferredStyle: data.preferred_style,
    inBroadcast: data.in_broadcast,
    consents: data.consents, // JSONB
    // Map flattened fields if needed, or rely on address object
    street: data.address?.street,
    city: data.address?.city,
    zip: data.address?.zip,

    privacyPolicyAccepted: data.consents?.privacy,
    privacyPolicyDate: data.consents?.privacyDate,
    informedConsentAccepted: data.consents?.informedConsent,
    informedConsentDate: data.consents?.informedConsentDate,
    tattooCareAccepted: data.consents?.tattooCare,
    tattooCareDate: data.consents?.tattooCareDate,

    // FALLBACK: Read from column OR from preferences JSON
    attachments: data.attachments || data.preferences?.attachments || [],
    createdAt: data.created_at,
    updatedAt: data.updated_at
});

const mapClientToDB = (client: Client) => ({
    id: client.id,
    tenant_id: client.tenantId || 'd290f1ee-6c54-4b01-90e6-d701748f0851', // Default if missing
    first_name: client.firstName,
    last_name: client.lastName,
    email: client.email,
    phone: client.phone,
    fiscal_code: client.fiscalCode,
    birth_date: client.birthDate ? client.birthDate : null, // Fix: Empty string -> NULL
    address: client.address || {
        street: client.street,
        city: client.city,
        zip: client.zip
    },
    // SAVE ATTACHMENTS INSIDE PREFERENCES TO BE SAFE
    preferences: {
        ...(client.preferences || { styles: [], notes: '' }),
        attachments: client.attachments || []
    },
    preferred_style: client.preferredStyle || null,
    in_broadcast: client.inBroadcast || false,
    consents: {
        privacy: client.privacyPolicyAccepted || false,
        informendConsent: client.informedConsentAccepted || false,
        tattooCare: client.tattooCareAccepted || false,
        privacyDate: client.privacyPolicyDate || null,
        informedConsentDate: client.informedConsentDate || null,
        tattooCareDate: client.tattooCareDate || null,
        ...client.consents
    },
    // We still try to save to column if it exists, but preferences is our Golden Copy
    attachments: client.attachments || [],
    updated_at: new Date().toISOString()
});

const mapAppointmentFromDB = (data: any): Appointment => ({
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
    financials: data.financials || { depositPaid: false },
    reminders: data.reminders,
    notes: data.notes,
    attachments: data.attachments || [],
    createdAt: data.created_at,
    updatedAt: data.updated_at
});

const mapAppointmentToDB = (apt: Appointment) => ({
    id: apt.id,
    tenant_id: apt.tenantId,
    client_id: apt.clientId,
    artist_id: apt.artistId,
    title: apt.title,
    description: apt.description,
    start_time: apt.startTime,
    end_time: apt.endTime,
    service_type: apt.serviceType,
    tattoo_style: apt.tattooStyle,
    status: apt.status,
    financials: apt.financials,
    reminders: apt.reminders,
    notes: apt.notes,
    attachments: apt.attachments || [],
    updated_at: new Date().toISOString()
});

const mapCourseFromDB = (data: any): Course => ({
    id: data.id,
    tenantId: data.tenant_id,
    name: data.name,
    description: data.description,
    startDate: data.start_date || undefined,
    endDate: data.end_date || undefined,
    totalHours: data.total_hours || 0,
    totalLessons: data.total_lessons || 0,
    schedule: data.schedule,
    program: data.program,
    price: data.price || 0,
    attachments: data.attachments || [],
    instructorId: 'user-manager', // Default or fetch
    status: 'ACTIVE', // Default or fetch
    createdAt: data.created_at,
    updatedAt: data.updated_at || data.created_at
});

const mapCourseToDB = (course: Course) => ({
    id: course.id,
    tenant_id: course.tenantId,
    name: course.name,
    description: course.description,
    start_date: course.startDate,
    end_date: course.endDate,
    total_hours: course.totalHours,
    total_lessons: course.totalLessons,
    schedule: course.schedule,
    program: course.program,
    price: course.price,
    attachments: course.attachments
});

const mapStudentFromDB = (data: any): Student => ({
    id: data.id,
    tenantId: data.tenant_id,
    courseId: data.course_id,
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email,
    phone: data.phone,
    totalPaid: data.total_paid,
    enrollmentDate: data.created_at, // Use created_at as enrollment
    status: 'ACTIVE',
    createdAt: data.created_at,
    updatedAt: data.created_at
});

const mapStudentToDB = (student: Student) => ({
    id: student.id,
    tenant_id: student.tenantId,
    course_id: student.courseId,
    first_name: student.firstName,
    last_name: student.lastName,
    email: student.email,
    phone: student.phone,
    total_paid: student.totalPaid
});

const mapMessageFromDB = (data: any): ChatMessage => ({
    id: data.id,
    tenantId: data.tenant_id,
    senderId: data.sender_id,
    receiverId: '',
    message: data.content,
    content: data.content,
    timestamp: data.timestamp,
    read: data.read || false,
    senderName: data.sender_name,
    senderAvatar: data.sender_avatar,
    type: data.type as any
});

const mapMessageToDB = (msg: ChatMessage) => ({
    id: msg.id,
    tenant_id: msg.tenantId || 'd290f1ee-6c54-4b01-90e6-d701748f0851',
    sender_id: msg.senderId,
    sender_name: msg.senderName,
    sender_avatar: msg.senderAvatar,
    content: msg.content || msg.message,
    timestamp: msg.timestamp,
    type: msg.type || 'chat',
    read: msg.read || false
});

const mapWaitlistFromDB = (data: any): WaitlistEntry => ({
    id: data.id,
    tenantId: data.tenant_id,
    clientId: data.client_id,
    firstName: data.first_name,
    lastName: data.last_name,
    phone: data.phone,
    email: data.email,
    projectDescription: data.project_description,
    requestDate: data.request_date,
    assignedArtistId: data.assigned_artist_id,
    notes: data.notes,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at
});

const mapWaitlistToDB = (entry: WaitlistEntry) => ({
    id: entry.id,
    tenant_id: entry.tenantId,
    client_id: entry.clientId,
    first_name: entry.firstName,
    last_name: entry.lastName,
    phone: entry.phone,
    email: entry.email,
    project_description: entry.projectDescription,
    request_date: entry.requestDate,
    assigned_artist_id: entry.assignedArtistId,
    notes: entry.notes,
    status: entry.status,
    updated_at: new Date().toISOString()
});

export const storage = {
    getTenants: async (): Promise<Tenant[]> => {
        const { data, error } = await supabase.from('tenants').select('*');
        if (error) {
            console.error('Error fetching tenants:', error);
            return [];
        }
        return data.map((t: any) => ({
            id: t.id,
            name: t.name,
            logo: t.logo,
            address: t.theme?.studioAddress,
            whatsapp: t.theme?.studioWhatsapp,
            theme: t.theme
        }));
    },

    saveTenant: async (tenant: Tenant) => {
        const dbTenant = {
            id: tenant.id,
            name: tenant.name,
            logo: tenant.logo,
            // Save extra fields directly into the theme JSONB column
            theme: {
                ...tenant.theme,
                studioAddress: tenant.address,
                studioWhatsapp: tenant.whatsapp
            }
        };
        const { error } = await supabase.from('tenants').upsert(dbTenant);
        if (error) throw error;
    },

    getUsers: async (tenantId?: string): Promise<User[]> => {
        let query = supabase.from('users').select('*');
        if (tenantId) query = query.eq('tenant_id', tenantId);

        const { data, error } = await query;
        if (error) {
            console.error('Error fetching users:', error);
            return [];
        }
        return data.map((u: any) => ({
            id: u.id,
            tenantId: u.tenant_id,
            email: u.email,
            name: u.name,
            role: u.role,
            avatarUrl: u.avatar_url,
            profile: u.profile
        }));
    },

    saveUser: async (user: User) => {
        const dbUser = {
            id: user.id,
            tenant_id: user.tenantId,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar_url: user.avatarUrl,
            profile: user.profile
        };
        const { error } = await supabase.from('users').upsert(dbUser);
        if (error) throw error;
    },

    deleteUser: async (userId: string) => {
        const { error } = await supabase.from('users').delete().eq('id', userId);
        if (error) throw error;
    },

    getClients: async (tenantId?: string): Promise<Client[]> => {
        let query = supabase.from('clients').select('*').order('created_at', { ascending: false });
        if (tenantId) query = query.eq('tenant_id', tenantId);

        const { data, error } = await query;
        if (error) throw error;
        return data.map(mapClientFromDB);
    },

    getAppointments: async (tenantId?: string): Promise<Appointment[]> => {
        let query = supabase.from('appointments').select('*');
        if (tenantId) query = query.eq('tenant_id', tenantId);

        const { data, error } = await query;
        if (error) throw error;
        return data.map(mapAppointmentFromDB);
    },

    getMessages: async (tenantId?: string): Promise<ChatMessage[]> => {
        let query = supabase.from('messages').select('*').order('timestamp', { ascending: true });
        if (tenantId) query = query.eq('tenant_id', tenantId);

        const { data, error } = await query;
        if (error) {
            console.error('Error fetching messages:', error);
            return [];
        }
        return data.map(mapMessageFromDB);
    },

    getUnreadMessagesCount: async (tenantId?: string, currentUserId?: string): Promise<number> => {
        let query = supabase.from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('read', false);

        if (tenantId) query = query.eq('tenant_id', tenantId);
        if (currentUserId) query = query.neq('sender_id', currentUserId); // Don't count own messages

        const { count, error } = await query;
        if (error) {
            console.error('Error counting unread messages:', error);
            return 0;
        }
        return count || 0;
    },

    markMessagesAsRead: async (tenantId: string, currentUserId: string) => {
        // Mark unread messages as read ONLY IF they were NOT sent by the current user
        // This prevents the sender from marking their own message as read immediately,
        // allowing the recipient to see the notification.
        let query = supabase.from('messages')
            .update({ read: true })
            .eq('read', false)
            .eq('tenant_id', tenantId)
            .neq('sender_id', currentUserId);

        const { error } = await query;
        if (error) console.error('Error marking messages as read:', error);
    },

    saveClient: async (client: Client) => {
        const dbClient = mapClientToDB(client);
        const { data, error } = await supabase.from('clients').upsert(dbClient).select();
        if (error) throw error;
        return mapClientFromDB(data[0]);
    },

    saveAppointment: async (apt: Appointment) => {
        const dbApt = mapAppointmentToDB(apt);
        const { data, error } = await supabase.from('appointments').upsert(dbApt).select();
        if (error) throw error;
        return mapAppointmentFromDB(data[0]);
    },

    deleteAppointment: async (appointmentId: string) => {
        const { error } = await supabase.from('appointments').delete().eq('id', appointmentId);
        if (error) throw error;
    },

    saveMessage: async (msg: ChatMessage) => {
        const dbMsg = mapMessageToDB(msg);
        const { error } = await supabase.from('messages').upsert(dbMsg);
        if (error) throw error;
    },

    deleteMessage: async (messageId: string) => {
        const { error } = await supabase.from('messages').delete().eq('id', messageId);
        if (error) throw error;
    },

    // Academy
    getCourses: async (tenantId?: string): Promise<Course[]> => {
        let query = supabase.from('courses').select('*');
        if (tenantId) query = query.eq('tenant_id', tenantId);

        const { data, error } = await query;
        if (error) throw error;
        return data.map(mapCourseFromDB);
    },

    saveCourse: async (course: Course) => {
        const dbCourse = mapCourseToDB(course);
        const { data, error } = await supabase.from('courses').upsert(dbCourse).select();
        if (error) throw error;
        return mapCourseFromDB(data[0]);
    },

    deleteCourse: async (courseId: string) => {
        const { error } = await supabase.from('courses').delete().eq('id', courseId);
        if (error) throw error;
    },

    getStudents: async (tenantId?: string): Promise<Student[]> => {
        let query = supabase.from('students').select('*');
        if (tenantId) query = query.eq('tenant_id', tenantId);

        const { data, error } = await query;
        if (error) throw error;
        return data.map(mapStudentFromDB);
    },

    saveStudent: async (student: Student) => {
        const dbStudent = mapStudentToDB(student);
        const { data, error } = await supabase.from('students').upsert(dbStudent).select();
        if (error) throw error;
        return mapStudentFromDB(data[0]);
    },

    deleteStudent: async (studentId: string) => {
        const { error } = await supabase.from('students').delete().eq('id', studentId);
        if (error) throw error;
    },

    getAttendances: async (tenantId?: string): Promise<Attendance[]> => {
        let query = supabase.from('attendances').select('*');
        // If tenant-aware, enable this:
        // if (tenantId) query = query.eq('tenant_id', tenantId);
        // Note: Attendances table previously didn't have explicit filtering in mock, 
        // but now it should probably have it. Assuming the DB table has tenant_id.
        // Based on map above, tenantId is hardcoded 'studio-1' in response, but let's check input params.

        const { data, error } = await query;
        if (error) throw error;
        return data.map((a: any) => ({
            id: a.id,
            tenantId: a.tenant_id || 'd290f1ee-6c54-4b01-90e6-d701748f0851', // Use DB Val or Fallback
            studentId: a.student_id,
            courseId: a.course_id,
            date: a.date,
            hours: a.hours,
            present: a.present,
            notes: a.notes,
            createdAt: a.created_at
        }));
    },

    saveAttendance: async (attendance: Attendance) => {
        const dbAtt = {
            id: attendance.id,
            tenant_id: attendance.tenantId || 'd290f1ee-6c54-4b01-90e6-d701748f0851', // Ensure tenant_id is saved
            student_id: attendance.studentId,
            course_id: attendance.courseId,
            date: attendance.date,
            hours: attendance.hours,
            present: attendance.present,
            notes: attendance.notes
        };
        const { error } = await supabase.from('attendances').upsert(dbAtt);
        if (error) throw error;
    },

    getCoursePayments: async (tenantId?: string): Promise<CoursePayment[]> => {
        let query = supabase.from('course_payments').select('*');
        if (tenantId) query = query.eq('tenant_id', tenantId); // Assuming column exists
        const { data, error } = await query;
        if (error) throw error;
        return data.map((p: any) => ({
            id: p.id,
            tenantId: p.tenant_id || 'd290f1ee-6c54-4b01-90e6-d701748f0851',
            studentId: p.student_id,
            courseId: p.course_id,
            amount: p.amount,
            paymentDate: p.payment_date,
            paymentMethod: p.payment_method,
            notes: p.notes,
            createdAt: p.created_at
        }));
    },

    saveCoursePayment: async (payment: CoursePayment) => {
        const dbPay = {
            id: payment.id,
            tenant_id: payment.tenantId || 'd290f1ee-6c54-4b01-90e6-d701748f0851',
            student_id: payment.studentId,
            course_id: payment.courseId,
            amount: payment.amount,
            payment_date: payment.paymentDate,
            payment_method: payment.paymentMethod,
            notes: payment.notes
        };
        const { error } = await supabase.from('course_payments').upsert(dbPay);
        if (error) throw error;
    },

    getMaterials: async (tenantId?: string): Promise<TeachingMaterial[]> => {
        let query = supabase.from('teaching_materials').select('*');
        if (tenantId) query = query.eq('tenant_id', tenantId);

        const { data, error } = await query;
        if (error) throw error;
        return data.map((m: any) => ({
            id: m.id,
            tenantId: m.tenant_id,
            studentId: m.student_id,
            courseId: m.course_id,
            title: m.title,
            description: m.description,
            url: m.url,
            type: m.type,
            unlockThresholdDays: m.unlock_threshold_days,
            createdAt: m.created_at
        }));
    },

    saveMaterial: async (material: TeachingMaterial) => {
        const dbMat = {
            id: material.id,
            tenant_id: material.tenantId,
            student_id: material.studentId,
            course_id: material.courseId,
            title: material.title,
            description: material.description,
            url: material.url,
            type: material.type,
            unlock_threshold_days: material.unlockThresholdDays
        };
        const { error } = await supabase.from('teaching_materials').upsert(dbMat);
        if (error) throw error;
    },

    deleteMaterial: async (materialId: string) => {
        const { error } = await supabase.from('teaching_materials').delete().eq('id', materialId);
        if (error) throw error;
    },

    uploadFile: async (file: File, path: string): Promise<string> => {
        // 1. Upload
        const { error: uploadError } = await supabase.storage
            .from('client-attachments')
            .upload(path, file, { upsert: true });

        if (uploadError) throw uploadError;

        // 2. Get URL
        const { data } = supabase.storage
            .from('client-attachments')
            .getPublicUrl(path);

        return data.publicUrl;
    },

    // Waitlist
    getWaitlist: async (tenantId?: string): Promise<WaitlistEntry[]> => {
        let query = supabase.from('waitlist').select('*').order('request_date', { ascending: false });
        if (tenantId) query = query.eq('tenant_id', tenantId);
        const { data, error } = await query;
        if (error) throw error;
        return data.map(mapWaitlistFromDB);
    },

    saveWaitlistEntry: async (entry: WaitlistEntry) => {
        const dbEntry = mapWaitlistToDB(entry);
        const { error } = await supabase.from('waitlist').upsert(dbEntry);
        if (error) throw error;
    },

    deleteWaitlistEntry: async (id: string) => {
        const { error } = await supabase.from('waitlist').delete().eq('id', id);
        if (error) throw error;
    },

    initialize: async () => {
        // No local init needed anymore
    }
};

