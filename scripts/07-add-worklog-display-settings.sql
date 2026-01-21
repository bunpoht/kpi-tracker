-- Add settings for controlling work log display in KPI detail page
INSERT INTO "Settings" (key, value, description) 
VALUES 
  ('showWorkLogTitle', 'true', 'แสดงหัวเรื่องของบันทึกการทำงานในหน้า KPI'),
  ('showWorkLogImages', 'true', 'แสดงรูปภาพของบันทึกการทำงานในหน้า KPI'),
  ('showWorkLogDescription', 'true', 'แสดงรายละเอียดของบันทึกการทำงานในหน้า KPI')
ON CONFLICT (key) DO NOTHING;
