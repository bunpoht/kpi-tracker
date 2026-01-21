-- Insert sample admin user (password: admin123)
INSERT INTO "Users" ("email", "password", "name", "role")
VALUES 
  ('admin@example.com', '$2a$10$rQZ9vXqZ9vXqZ9vXqZ9vXuK8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y', 'Admin User', 'ADMIN'),
  ('user@example.com', '$2a$10$rQZ9vXqZ9vXqZ9vXqZ9vXuK8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y', 'Regular User', 'USER')
ON CONFLICT ("email") DO NOTHING;

-- Insert sample goals
INSERT INTO "Goals" ("title", "description", "target", "startDate", "endDate", "createdById")
VALUES 
  ('Sales Target Q1', 'Achieve 1 million baht in sales for Q1 2025', 1000000, '2025-01-01', '2025-03-31', 1),
  ('Customer Satisfaction', 'Maintain customer satisfaction score above 90%', 90, '2025-01-01', '2025-12-31', 1),
  ('Product Development', 'Launch 5 new features', 5, '2025-01-01', '2025-06-30', 1)
ON CONFLICT DO NOTHING;

-- Insert sample goal assignments
INSERT INTO "GoalAssignments" ("goalId", "userId", "assignedTarget")
VALUES 
  (1, 2, 500000),
  (2, 2, 90),
  (3, 2, 3)
ON CONFLICT ("goalId", "userId") DO NOTHING;
