INSERT INTO "Settings" (key, value, description) 
VALUES 
  ('backgroundImageUrl', '/kpi-bg.jpg', 'URL ของรูปภาพพื้นหลังหน้า Homepage')
ON CONFLICT (key) DO NOTHING;
