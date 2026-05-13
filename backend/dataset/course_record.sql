SET SQL_SAFE_UPDATES = 0;
DELETE FROM course_record;
SET SQL_SAFE_UPDATES = 1;

INSERT INTO `course_record` (`student_id`, `course_id`, `semester`, `grade`, `passed_state`)
VALUES
(112703060, '703002001', '112-1', 82, 'Y'),
(112703060, '703009001', '112-2', 88, 'Y'),
(112703060, '703025001', '113-1', 75, 'Y'),
(112703060, '703811001', '113-1', 92, 'Y');

INSERT INTO `course_record` (`student_id`, `course_id`, `semester`, `grade`, `passed_state`)
VALUES
(113703060, '703002001', '112-1', 87, 'Y'),
(113703060, '703009001', '112-1', 78, 'Y'),
(113703060, '703025001', '113-1', 70, 'Y'),
(113703060, '703811001', '113-1', 62, 'Y');