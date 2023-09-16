
CREATE DATABASE recipeBuddy;
USE myBookshop;

-- CREATE USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'ILoveBread';
GRANT ALL PRIVILEGES ON recipeBuddy.* TO 'root'@'localhost';

CREATE TABLE accounts (id INT AUTO_INCREMENT,firstName VARCHAR(30),lastName VARCHAR(30),
email VARCHAR(60),username VARCHAR(50),password VARCHAR(200),PRIMARY KEY(id));

CREATE TABLE food (id INT AUTO_INCREMENT,name VARCHAR(60),value INT(30),
unit VARCHAR(60),carbs DECIMAL(5, 2),fat DECIMAL(5, 2), protein DECIMAL(5,2), salt DECIMAL(5, 2), 
sugar DECIMAL(5, 2), PRIMARY KEY(id));

-- Fields to add for food
-- Name: flour
-- Typical values per:100
-- Unit of the typical value: gram
-- Carbs: 81 g
-- Fat: 1.4 g
-- Protein: 9.1 g
-- Salt: 0.01 g
-- Sugar: 0.6 g