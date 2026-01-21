-- Enable Row Level Security (RLS) on all tables
ALTER TABLE "Users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Goals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GoalAssignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkLogs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Images" ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for the 'anon' role (used by the app currently)
-- NOTE: Since your app uses custom auth, removing these policies will break the app 
-- unless you switch backend to use SUPABASE_SERVICE_ROLE_KEY.

-- Users
CREATE POLICY "Enable access to all users" ON "Users" FOR ALL USING (true);

-- Goals
CREATE POLICY "Enable access to all goals" ON "Goals" FOR ALL USING (true);

-- GoalAssignments
CREATE POLICY "Enable access to all assignments" ON "GoalAssignments" FOR ALL USING (true);

-- WorkLogs
CREATE POLICY "Enable access to all worklogs" ON "WorkLogs" FOR ALL USING (true);

-- Images
CREATE POLICY "Enable access to all images" ON "Images" FOR ALL USING (true);

-- Settings (if exists)
DO $$ 
BEGIN 
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Settings') THEN
        ALTER TABLE "Settings" ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Enable access to settings" ON "Settings" FOR ALL USING (true);
    END IF;
END $$;

-- SubMetrics (if exists)
DO $$ 
BEGIN 
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'SubMetrics') THEN
        ALTER TABLE "SubMetrics" ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Enable access to submetrics" ON "SubMetrics" FOR ALL USING (true);
    END IF;
END $$;
