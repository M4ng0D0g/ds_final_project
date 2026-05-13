SET SQL_SAFE_UPDATES = 0;
DELETE FROM student_account;
SET SQL_SAFE_UPDATES = 1;

INSERT IGNORE INTO `student_account` (`student_id`, `password`, `username`, `department_major1`, `department_major2`, `department_auxiliary`) VALUES
(112703060, 'pwd1121', '陳一明', 703, NULL, NULL),
(112703061, 'pwd1122', '陳二明', 703, 702, NULL),
(112703062, 'pwd1123', '陳三明', 703, NULL, NULL),
(113703060, 'pwd1131', '林一華', 703, NULL, 101),
(113703061, 'pwd1132', '林二華', 703, 701, 702),
(113703062, 'pwd1133', '林三華', 703, NULL, NULL);