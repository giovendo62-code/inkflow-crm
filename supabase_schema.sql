-- ============================================
-- INKFLOW CRM - Schema Database Supabase
-- ============================================
-- Esegui questo script nel SQL Editor di Supabase
-- Dashboard > SQL Editor > New Query > Incolla e Run

-- Abilita estensione UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABELLA: tenants (Studi Tatuaggio)
-- ============================================
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  logo TEXT,
  theme JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELLA: users (Manager, Artist, Student)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('MANAGER', 'ARTIST', 'STUDENT')),
  avatar_url TEXT,
  profile JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELLA: clients (Clienti Tattoo)
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  fiscal_code TEXT,
  birth_date DATE,
  birth_place TEXT,
  address JSONB,
  preferences JSONB DEFAULT '{}'::jsonb,
  preferred_style TEXT,
  in_broadcast BOOLEAN DEFAULT false,
  consents JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  privacy_policy_accepted BOOLEAN DEFAULT false,
  privacy_policy_date TIMESTAMP WITH TIME ZONE,
  informed_consent_accepted BOOLEAN DEFAULT false,
  informed_consent_date TIMESTAMP WITH TIME ZONE,
  attachments TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELLA: appointments (Appuntamenti)
-- ============================================
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  artist_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  service_type TEXT,
  tattoo_style TEXT,
  status TEXT DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED')),
  financials JSONB DEFAULT '{}'::jsonb,
  reminders JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELLA: courses (Corsi Academy)
-- ============================================
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_hours INTEGER DEFAULT 0,
  total_lessons INTEGER,
  schedule TEXT,
  program TEXT,
  price DECIMAL(10,2) DEFAULT 0,
  attachments TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELLA: students (Studenti Academy)
-- ============================================
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  total_paid DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELLA: attendances (Presenze)
-- ============================================
CREATE TABLE IF NOT EXISTS attendances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hours INTEGER DEFAULT 0,
  present BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELLA: teaching_materials (Materiali Didattici)
-- ============================================
CREATE TABLE IF NOT EXISTS teaching_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  type TEXT CHECK (type IN ('PDF', 'VIDEO', 'LINK', 'IMAGE')),
  unlock_threshold_days INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELLA: course_payments (Pagamenti Corsi)
-- ============================================
CREATE TABLE IF NOT EXISTS course_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES per Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_clients_tenant ON clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_appointments_tenant ON appointments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_artist ON appointments(artist_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_students_course ON students(course_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_attendances_student ON attendances(student_id);
CREATE INDEX IF NOT EXISTS idx_attendances_date ON attendances(date);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
-- Abilita RLS su tutte le tabelle
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_payments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES - Accesso basato su tenant_id
-- ============================================

-- TENANTS: Tutti possono leggere, solo authenticated può modificare
CREATE POLICY "Allow read tenants" ON tenants FOR SELECT USING (true);
CREATE POLICY "Allow insert tenants" ON tenants FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- USERS: Vedere solo utenti del proprio tenant
CREATE POLICY "Users see own tenant" ON users FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users insert own tenant" ON users FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- CLIENTS: Vedere solo clienti del proprio tenant
CREATE POLICY "Clients see own tenant" ON clients FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Clients insert" ON clients FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Clients update" ON clients FOR UPDATE
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Clients delete" ON clients FOR DELETE
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- APPOINTMENTS: Vedere solo appuntamenti del proprio tenant
CREATE POLICY "Appointments see own tenant" ON appointments FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Appointments insert" ON appointments FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Appointments update" ON appointments FOR UPDATE
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Appointments delete" ON appointments FOR DELETE
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- COURSES: Vedere corsi del proprio tenant
CREATE POLICY "Courses see own tenant" ON courses FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Courses manage" ON courses FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- STUDENTS: Vedere studenti del proprio tenant
CREATE POLICY "Students see own tenant" ON students FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Students manage" ON students FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- ATTENDANCES: Vedere presenze degli studenti propri
CREATE POLICY "Attendances see" ON attendances FOR SELECT
  USING (student_id IN (SELECT id FROM students WHERE tenant_id IN 
    (SELECT tenant_id FROM users WHERE id = auth.uid())));

CREATE POLICY "Attendances manage" ON attendances FOR ALL
  USING (student_id IN (SELECT id FROM students WHERE tenant_id IN 
    (SELECT tenant_id FROM users WHERE id = auth.uid())));

-- TEACHING MATERIALS: Vedere materiali propri
CREATE POLICY "Materials see" ON teaching_materials FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Materials manage" ON teaching_materials FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- COURSE PAYMENTS: Vedere pagamenti propri
CREATE POLICY "Payments see" ON course_payments FOR SELECT
  USING (student_id IN (SELECT id FROM students WHERE tenant_id IN 
    (SELECT tenant_id FROM users WHERE id = auth.uid())));

CREATE POLICY "Payments manage" ON course_payments FOR ALL
  USING (student_id IN (SELECT id FROM students WHERE tenant_id IN 
    (SELECT tenant_id FROM users WHERE id = auth.uid())));

-- ============================================
-- TRIGGERS per updated_at automatico
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DATI INIZIALI (Opzionale - per testing)
-- ============================================

-- Inserisci tenant di esempio
INSERT INTO tenants (id, name, theme) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'InkFlow Demo Studio', 
   '{"primaryColor": "#FF6B35", "sidebarStyle": "dark", "colorMode": "dark", "menuPosition": "left"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- COMPLETE! ✅
-- ============================================
-- Prossimi passi:
-- 1. Torna su Supabase Dashboard
-- 2. Vai su Settings > API
-- 3. Copia URL e anon key
-- 4. Incollali nel file .env.local
