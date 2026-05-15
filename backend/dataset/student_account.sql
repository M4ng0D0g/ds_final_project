SET SQL_SAFE_UPDATES = 0;
DELETE FROM student_account;
SET SQL_SAFE_UPDATES = 1;

INSERT IGNORE INTO `student_account` (`student_id`, `password`, `username`, `department_major1`, `department_major2`, `department_auxiliary`) VALUES
(112703060, 'pwd1121', '陳一明', 703, NULL, NULL),
(113703060, 'pwd1131', '林一華', 703, NULL, 101),
(111703010, 'pw111a', '張凱', 703, NULL, NULL),
(111703033, 'pw111b', '王雅其', 703, 702, NULL),
(112703004, 'pw112a', '李威和', 703, NULL, NULL),
(112703051, 'pw112b', '趙子晴', 703, NULL, 101),
(113703022, 'pw113a', '徐契合', 703, NULL, NULL),
(114703053, 'pw114a', '吳承左', 703, NULL, NULL);