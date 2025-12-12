import { type Appointment, type Client, type Tenant, type User, type ChatMessage, type Course, type Student, type Attendance, type CoursePayment, type TeachingMaterial } from '../types';

const STORAGE_KEYS = {
    TENANTS: 'inkflow_tenants',
    USERS: 'inkflow_users',
    CLIENTS: 'inkflow_clients',
    APPOINTMENTS: 'inkflow_appointments',
    MESSAGES: 'inkflow_messages',
    COURSES: 'inkflow_courses',
    STUDENTS: 'inkflow_students',
    ATTENDANCES: 'inkflow_attendances',
    COURSE_PAYMENTS: 'inkflow_course_payments',
    MATERIALS: 'inkflow_materials',
};

// Seed Data
const MOCK_TENANTS: Tenant[] = [
    { id: 'studio-1', name: 'InkFlow Main Studio', logo: '/logo-mock.png' },
];

const MOCK_USERS: User[] = [
    {
        id: 'user-manager',
        tenantId: 'studio-1',
        email: 'manager@inkflow.com',
        name: 'Marco Rossi',
        role: 'MANAGER',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marco',
        profile: {
            bio: 'Studio Manager & Lead Artist',
            color: '#FF6B35',
            phone: '+39 333 1234567',
            taxId: 'RSSMRC85M01H501U'
        }
    },
    {
        id: 'user-2',
        tenantId: 'studio-1',
        email: 'artist@inkflow.com', // Updated
        name: 'Alex Bianchi',
        role: 'ARTIST',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
        profile: {
            bio: 'Specializzato in Realistico e Micro-realistico',
            color: '#00CC66',
            phone: '+39 333 7654321',
            taxId: 'BNCLXA90A01F205Z',
            commissionRate: 50,
            googleCalendarConnected: true,
            googleCalendarId: 'alex@inkflow.com',
            googleCalendarLastSync: new Date().toISOString()
        }
    },
    {
        id: 'user-student-1',
        tenantId: 'studio-1',
        email: 'student@inkflow.com',
        name: 'Luca Neri',
        role: 'STUDENT',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luca',
        profile: {
            bio: 'Corsista Corso Base Tatuaggio',
            color: '#4285F4',
            phone: '+39 333 5551234'
        }
    }
];

const MOCK_MESSAGES: ChatMessage[] = [
    {
        id: 'msg-1',
        senderId: 'user-manager',
        senderName: 'Marco Rossi',
        senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marco',
        content: 'Benvenuti nel nuovo CRM! 🚀 Qui potrete leggere le comunicazioni importanti.',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        type: 'info'
    },
];

export const storage = {
    getTenants: (): Tenant[] => {
        const data = localStorage.getItem(STORAGE_KEYS.TENANTS);
        return data ? JSON.parse(data) : MOCK_TENANTS;
    },

    getUsers: (): User[] => {
        const data = localStorage.getItem(STORAGE_KEYS.USERS);
        if (data) {
            const parsed = JSON.parse(data);
            if (parsed.length > 0) return parsed;
        }
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(MOCK_USERS));
        return MOCK_USERS;
    },

    getClients: (): Client[] => {
        const data = localStorage.getItem(STORAGE_KEYS.CLIENTS);
        return data ? JSON.parse(data) : [];
    },

    getAppointments: (): Appointment[] => {
        const data = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
        return data ? JSON.parse(data) : [];
    },

    getMessages: (): ChatMessage[] => {
        const data = localStorage.getItem(STORAGE_KEYS.MESSAGES);
        return data ? JSON.parse(data) : MOCK_MESSAGES;
    },

    // Setters
    saveClient: (client: Client) => {
        const clients = storage.getClients();
        const index = clients.findIndex(c => c.id === client.id);
        if (index >= 0) clients[index] = client;
        else clients.push(client);
        localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
    },

    saveAppointment: (apt: Appointment) => {
        const appts = storage.getAppointments();
        const index = appts.findIndex(a => a.id === apt.id);
        if (index >= 0) appts[index] = apt;
        else appts.push(apt);
        localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appts));
    },

    saveMessage: (msg: ChatMessage) => {
        const messages = storage.getMessages();
        messages.push(msg);
        localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
    },

    // Academy
    getCourses: (): Course[] => {
        const data = localStorage.getItem(STORAGE_KEYS.COURSES);
        return data ? JSON.parse(data) : [];
    },

    saveCourse: (course: Course) => {
        const courses = storage.getCourses();
        const index = courses.findIndex(c => c.id === course.id);
        if (index >= 0) courses[index] = course;
        else courses.push(course);
        localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
    },

    getStudents: (): Student[] => {
        const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
        return data ? JSON.parse(data) : [];
    },

    saveStudent: (student: Student) => {
        const students = storage.getStudents();
        const index = students.findIndex(s => s.id === student.id);
        if (index >= 0) students[index] = student;
        else students.push(student);
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    },

    deleteStudent: (studentId: string) => {
        const students = storage.getStudents();
        const updatedStudents = students.filter(s => s.id !== studentId);
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(updatedStudents));
    },

    getAttendances: (): Attendance[] => {
        const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCES);
        return data ? JSON.parse(data) : [];
    },

    saveAttendance: (attendance: Attendance) => {
        const attendances = storage.getAttendances();
        const index = attendances.findIndex(a => a.id === attendance.id);
        if (index >= 0) attendances[index] = attendance;
        else attendances.push(attendance);
        localStorage.setItem(STORAGE_KEYS.ATTENDANCES, JSON.stringify(attendances));
    },

    getCoursePayments: (): CoursePayment[] => {
        const data = localStorage.getItem(STORAGE_KEYS.COURSE_PAYMENTS);
        return data ? JSON.parse(data) : [];
    },

    saveCoursePayment: (payment: CoursePayment) => {
        const payments = storage.getCoursePayments();
        payments.push(payment);
        localStorage.setItem(STORAGE_KEYS.COURSE_PAYMENTS, JSON.stringify(payments));
    },

    getMaterials: (): TeachingMaterial[] => {
        const data = localStorage.getItem(STORAGE_KEYS.MATERIALS);
        return data ? JSON.parse(data) : [];
    },

    saveMaterial: (material: TeachingMaterial) => {
        const materials = storage.getMaterials();
        const index = materials.findIndex(m => m.id === material.id);
        if (index >= 0) materials[index] = material;
        else materials.push(material);
        localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));
    },

    deleteMaterial: (materialId: string) => {
        const materials = storage.getMaterials();
        const updatedMaterials = materials.filter(m => m.id !== materialId);
        localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(updatedMaterials));
    },

    initialize: () => {
        if (!localStorage.getItem(STORAGE_KEYS.TENANTS)) {
            localStorage.setItem(STORAGE_KEYS.TENANTS, JSON.stringify(MOCK_TENANTS));
        }
        if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(MOCK_USERS));
        }
    }
};
