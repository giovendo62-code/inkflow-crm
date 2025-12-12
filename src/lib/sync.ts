import { supabase } from './supabase';
import * as mappers from './mappers';

const STORAGE_KEYS = {
    TENANTS: 'inkflow_tenants',
    USERS: 'inkflow_users',
    CLIENTS: 'inkflow_clients',
    APPOINTMENTS: 'inkflow_appointments',
    COURSES: 'inkflow_courses',
    STUDENTS: 'inkflow_students',
    ATTENDANCES: 'inkflow_attendances',
    MATERIALS: 'inkflow_materials',
    PAYMENTS: 'inkflow_course_payments'
};

export const syncFromCloud = async () => {
    console.log('🔄 Init Cloud Sync...');
    try {
        // 1. Tenants
        const { data: tenants } = await supabase.from('tenants').select('*');
        if (tenants) localStorage.setItem(STORAGE_KEYS.TENANTS, JSON.stringify(tenants));

        // 2. Users (mappatura semplice per ora)
        const { data: users } = await supabase.from('users').select('*');
        if (users) {
            const mappedUsers = users.map(u => ({
                ...u,
                tenantId: u.tenant_id,
                avatarUrl: u.avatar_url,
                // altri campi user se necessario
            }));
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(mappedUsers));
        }

        // 3. Clients
        const { data: clients } = await supabase.from('clients').select('*');
        if (clients) {
            const mapped = clients.map(mappers.fromClientDB);
            localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(mapped));
        }

        // 4. Appointments
        const { data: appts } = await supabase.from('appointments').select('*');
        if (appts) {
            const mapped = appts.map(mappers.fromAppointmentDB);
            localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(mapped));
        }

        // 5. Courses
        const { data: courses } = await supabase.from('courses').select('*');
        if (courses) {
            const mapped = courses.map(mappers.fromCourseDB);
            localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(mapped));
        }

        // 6. Students
        const { data: students } = await supabase.from('students').select('*');
        if (students) {
            const mapped = students.map(mappers.fromStudentDB);
            localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(mapped));
        }

        // 7. Attendances (semplice, campi quasi identici tranne date/foreign keys)
        const { data: atts } = await supabase.from('attendances').select('*');
        if (atts) {
            const mapped = atts.map(a => ({
                ...a,
                studentId: a.student_id,
                courseId: a.course_id
            }));
            localStorage.setItem(STORAGE_KEYS.ATTENDANCES, JSON.stringify(mapped));
        }

        // 8. Materials
        const { data: mats } = await supabase.from('teaching_materials').select('*');
        if (mats) {
            const mapped = mats.map(mappers.fromMaterialDB);
            localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(mapped));
        }

        console.log('✅ Sync Completed!');
        return true;
    } catch (error) {
        console.error('❌ Sync Error:', error);
        return false;
    }
};

export const pushToCloud = async (entity: 'CLIENT' | 'APPOINTMENT' | 'COURSE' | 'STUDENT' | 'MATERIAL' | 'ATTENDANCE', data: any) => {
    try {
        let table = '';
        let mappedData = null;

        switch (entity) {
            case 'CLIENT':
                table = 'clients';
                mappedData = mappers.toClientDB(data);
                break;
            case 'APPOINTMENT':
                table = 'appointments';
                mappedData = mappers.toAppointmentDB(data);
                break;
            case 'COURSE':
                table = 'courses';
                mappedData = mappers.toCourseDB(data);
                break;
            case 'STUDENT':
                table = 'students';
                mappedData = mappers.toStudentDB(data);
                break;
            case 'MATERIAL':
                table = 'teaching_materials';
                mappedData = mappers.toMaterialDB(data);
                break;
            case 'ATTENDANCE':
                table = 'attendances';
                mappedData = {
                    ...data,
                    student_id: data.studentId,
                    course_id: data.courseId
                };
                break;
        }

        if (table && mappedData) {
            const { error } = await supabase.from(table).upsert(mappedData);
            if (error) console.error(`❌ Cloud Save Error (${table}):`, error);
            else console.log(`☁️ Saved to ${table}`);
        }
    } catch (error) {
        console.error('❌ Critical Cloud Error:', error);
    }
};

export const deleteFromCloud = async (table: string, id: string) => {
    try {
        await supabase.from(table).delete().eq('id', id);
    } catch (error) {
        console.error('Delete Error:', error);
    }
};
