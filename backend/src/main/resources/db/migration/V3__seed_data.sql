INSERT INTO retailers (business_name, owner_name, email, password_hash, phone_number, address, gst_number, business_type)
VALUES ('Sharma General Store', 'Rajesh Sharma', 'rajesh@example.com', '$2b$10$DOYiV3EAiQxH0HQsYQI4XO3SMTXo4IIdis5lyl2tvupObv0liwwwu', '9876543210', 'Shop 12, MG Road, Mumbai', '27AABCU9603R1ZM', 'kirana')
ON CONFLICT (email) DO NOTHING;
