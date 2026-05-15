-- MySQL database architecture for a student course management system (FULL)

CREATE TABLE IF NOT EXISTS `department` (
  `department_id` INT(3) NOT NULL,
  `department_name` VARCHAR(20) NOT NULL,
  PRIMARY KEY (`department_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `graduation_requirements` (
    `department_id` INT(3) NOT NULL,
    `admit_year` INT NOT NULL,
    `required_major_credits` INT NOT NULL,
    `required_optional_credits` INT NOT NULL,
    `total_credits_threshold` INT NOT NULL,
    PRIMARY KEY (`department_id`, `admit_year`),
    FOREIGN KEY (`department_id`) REFERENCES `department` (`department_id`)
);

CREATE TABLE IF NOT EXISTS `student_account` (
  `student_id` INT(9) NOT NULL,
  `password` VARCHAR(20) NOT NULL,
  `username` VARCHAR(20) NOT NULL,
  `department_major1` INT(3) NOT NULL,
  `department_major2` INT(3),
  `department_auxiliary` INT(3),
  PRIMARY KEY (`student_id`),
  CONSTRAINT `fk_student_account_department_major1` FOREIGN KEY (`department_major1`) REFERENCES `department`(`department_id`),
  CONSTRAINT `fk_student_account_department_major2` FOREIGN KEY (`department_major2`) REFERENCES `department`(`department_id`),
  CONSTRAINT `fk_student_account_department_auxiliary` FOREIGN KEY (`department_auxiliary`) REFERENCES `department`(`department_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `teacher_account` (
  `teacher_id` VARCHAR(20) NOT NULL,
  `password` VARCHAR(20) NOT NULL,
  `username` VARCHAR(20) NOT NULL,
  `department_id` INT(3) NOT NULL,
  PRIMARY KEY (`teacher_id`),
  CONSTRAINT `fk_teacher_account_department_id` FOREIGN KEY (`department_id`) REFERENCES `department`(`department_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `course_information` (
  `course_id` INT(9) NOT NULL,
  `course_name` VARCHAR(20) NOT NULL,
  `course_type` VARCHAR(10) NOT NULL,
  `teacher_name` VARCHAR(100) NOT NULL,
  `department_id` INT(3) NOT NULL,
  `credits` INT(3) NOT NULL,
  PRIMARY KEY (`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `course_record` (
  `student_id` INT(9) NOT NULL,
  `course_id` INT(9) NOT NULL,
  `semester` VARCHAR(5) NOT NULL,
  `grade` INT(3) NOT NULL,
  `passed_state` VARCHAR(1) NOT NULL,
  PRIMARY KEY (`student_id`, `course_id`),
  CONSTRAINT `fk_course_record_student_id` FOREIGN KEY (`student_id`) REFERENCES `student_account`(`student_id`),
  CONSTRAINT `fk_course_record_course_id` FOREIGN KEY (`course_id`) REFERENCES `course_information`(`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
