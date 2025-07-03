DROP DATABASE IF EXISTS najdisoigralca;
CREATE DATABASE najdisoigralca;
USE najdisoigralca;

DROP USER IF EXISTS 'guest'@'%';
CREATE USER 'guest'@'%' IDENTIFIED BY 'guest';
GRANT ALL PRIVILEGES ON *.* TO 'guest'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;

DROP TABLE IF EXISTS spremembe;
DROP TABLE IF EXISTS komentar;
DROP TABLE IF EXISTS indexkomentarji;
DROP TABLE IF EXISTS prijava;
DROP TABLE IF EXISTS sportnaaktivnost;
DROP TABLE IF EXISTS sport;
DROP TABLE IF EXISTS administrator;
DROP TABLE IF EXISTS uporabnik;

-- Ustvarjanje tabel
CREATE TABLE uporabnik (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    ime VARCHAR(50) NOT NULL,
    priimek VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    geslo VARCHAR(400) NOT NULL,
    telefonskaSt VARCHAR(15) NOT NULL,
    datumPrijave DATETIME NOT NULL,
    vloga VARCHAR(50) NOT NULL,
    stOdjav INT,
    slika VARCHAR(255)
    );

CREATE TABLE administrator (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    ime VARCHAR(50) NOT NULL,
    priimek VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    geslo VARCHAR(100) NOT NULL,
    telefonskaSt VARCHAR(15) NOT NULL,
    datumPrijave DATETIME NOT NULL
);

CREATE TABLE sport (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    naziv VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE sportnaaktivnost (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    organizator VARCHAR(50) NOT NULL,
    tipIgrisca VARCHAR(50) NOT NULL,
    lokacija VARCHAR(100) NOT NULL,
    datumAktivnosti DATE NOT NULL,
    casAktivnosti TIME NOT NULL,
    minIgralcev INT NOT NULL,
    maxIgralcev INT NOT NULL,
    opis TEXT,
    FKuporabnik INT,        /*misljen kot administrator - samo eden*/
    FKsport INT NOT NULL,
    FOREIGN KEY (FKuporabnik) REFERENCES uporabnik(ID),
    FOREIGN KEY (FKsport) REFERENCES sport(ID)
);

CREATE TABLE prijava (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    datumPrijave DATETIME NOT NULL,
    datumOdjave DATETIME,
    FKuporabnik INT NOT NULL,       /*vsi PRIJAVLJENI uporabniki*/
    FKaktivnost INT NOT NULL,
    FOREIGN KEY (FKuporabnik) REFERENCES uporabnik(ID),
    FOREIGN KEY (FKaktivnost) REFERENCES sportnaaktivnost(ID) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE komentar (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    vsebina TEXT NOT NULL,
    potDoSlike VARCHAR(255),
    datumObjave DATETIME NOT NULL, 
    FKuporabnik INT NOT NULL,     
    FKaktivnost INT NOT NULL,
    slikaOdobrena BOOLEAN DEFAULT NULL,
    FOREIGN KEY (FKuporabnik) REFERENCES uporabnik(ID),
    FOREIGN KEY (FKaktivnost) REFERENCES sportnaaktivnost(ID) ON DELETE CASCADE ON UPDATE CASCADE
);
ALTER TABLE komentar MODIFY potDoSlike TEXT;

CREATE TABLE spremembe (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    opis TEXT,
    FKaktivnost INT NOT NULL,
    FKuporabnik INT NOT NULL,
    FKkomentar INT NOT NULL,
    FOREIGN KEY (FKaktivnost) REFERENCES sportnaaktivnost(ID),
    FOREIGN KEY (FKuporabnik) REFERENCES uporabnik(ID) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (FKkomentar) REFERENCES komentar(ID) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE indexkomentarji (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    vsebina TEXT NOT NULL,
    datumObjave DATETIME NOT NULL,
    FKuporabnik INT NOT NULL,
    FOREIGN KEY (FKuporabnik) REFERENCES uporabnik(ID) ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO sport (naziv) VALUES 
('Nogomet'), ('Badminton'), ('Kosarka'), ('Odbojka'), ('Tenis'), 
('Kegljanje'), ('NamizniTenis'), ('PikaadministratorPRIMARYdo'), ('Biljard'), ('Golf'), 
('Boks'), ('Judo'), ('Hokej');

INSERT INTO uporabnik (ime, priimek, email, geslo, telefonskaSt, datumPrijave, vloga, slika, stOdjav) VALUES
('Ana', 'Novak', 'ana@example.com', '$2b$10$Jht5GuDYqpzUBYeMG4zqiOBCwJ743kKKf732r7jdDvWzg6we0wsPi', '040123456', NOW(), 'igralec',null, 0),
('Bojan', 'Kovac', 'bojan@example.com', '$2b$10$Jht5GuDYqpzUBYeMG4zqiOBCwJ743kKKf732r7jdDvWzg6we0wsPi', '041234567', NOW(), 'organizator',null, 0),
('Cene', 'Hribar', 'cene@example.com', '$2b$10$Jht5GuDYqpzUBYeMG4zqiOBCwJ743kKKf732r7jdDvWzg6we0wsPi', '042345678', NOW(), 'igralec',null, 0),
('Dora', 'Bizjak', 'dora@example.com', '$2b$10$Jht5GuDYqpzUBYeMG4zqiOBCwJ743kKKf732r7jdDvWzg6we0wsPi', '043456789', NOW(), 'organizator',null, 0),
('Eva', 'Kralj', 'eva@example.com', '$2b$10$Jht5GuDYqpzUBYeMG4zqiOBCwJ743kKKf732r7jdDvWzg6we0wsPi', '044567890', NOW(), 'igralec',null, 0),
('Filip', 'Rozman', 'filip@example.com', '$2b$10$Jht5GuDYqpzUBYeMG4zqiOBCwJ743kKKf732r7jdDvWzg6we0wsPi', '045000001', NOW(), 'igralec',null, 0),
('Gaja', 'Vidmar', 'gaja@example.com', '$2b$10$Jht5GuDYqpzUBYeMG4zqiOBCwJ743kKKf732r7jdDvWzg6we0wsPi', '045000002', NOW(), 'igralec',null, 0),
('Hrvoje', 'Petek', 'hrvoje@example.com', '$2b$10$Jht5GuDYqpzUBYeMG4zqiOBCwJ743kKKf732r7jdDvWzg6we0wsPi', '045000003', NOW(), 'organizator',null, 0),
('Iris', 'Medved', 'iris@example.com', '$2b$10$Jht5GuDYqpzUBYeMG4zqiOBCwJ743kKKf732r7jdDvWzg6we0wsPi', '045000004', NOW(), 'igralec',null, 0),
('Jernej', 'Breznik', 'jernej@example.com', '$2b$10$Jht5GuDYqpzUBYeMG4zqiOBCwJ743kKKf732r7jdDvWzg6we0wsPi', '045000005', NOW(), 'organizator',null, 0),
('Katja', 'Zagar', 'katja@example.com', '$2b$10$Jht5GuDYqpzUBYeMG4zqiOBCwJ743kKKf732r7jdDvWzg6we0wsPi', '045000006', NOW(), 'igralec',null, 0),
('Lovro', 'Hocevar', 'lovro@example.com', '$2b$10$Jht5GuDYqpzUBYeMG4zqiOBCwJ743kKKf732r7jdDvWzg6we0wsPi', '045000007', NOW(), 'organizator',null, 0),
('Maja', 'Cebulj', 'maja@example.com', '$2b$10$Jht5GuDYqpzUBYeMG4zqiOBCwJ743kKKf732r7jdDvWzg6we0wsPi', '045000008', NOW(), 'igralec',null, 0);

INSERT INTO administrator (ime, priimek, email, geslo, telefonskaSt, datumPrijave) VALUES
('Admin1', 'Adminic', 'admin1@example.com', 'adminpass', '051111111', NOW()),
('Admin2', 'Super', 'admin2@example.com', 'adminpass', '052222222', NOW()),
('Admin3', 'Root', 'admin3@example.com', 'adminpass', '053333333', NOW()),
('Admin4', 'Ctrl', 'admin4@example.com', 'adminpass', '054444444', NOW()),
('Admin5', 'Power', 'admin5@example.com', 'adminpass', '055555555', NOW());

INSERT INTO sportnaaktivnost (organizator, tipIgrisca, lokacija, datumAktivnosti, casAktivnosti, minIgralcev, maxIgralcev, opis, FKuporabnik, FKsport) VALUES
-- Nogomet (ID=1)
('Bojan Kovac', 'Mestno travnato igrišče', 'Tržaška cesta 132, Ljubljana', '2025-06-01', '17:00:00', 4, 10, 'Popoldanski trening s poudarkom na obrambi', 1, 1),
('Bojan Kovac', 'Stadion z reflektorji', 'Vojkova cesta 100, Ljubljana', '2025-06-02', '18:00:00', 10, 20, 'Večerna tekma izzivalcev', 2, 1),
('Bojan Kovac', 'Otroško travnato igrišče', 'Dunajska cesta 48, Ljubljana', '2025-06-03', '15:00:00', 4, 10, 'Nogometni poligon za najmlajše', 3, 1),

-- Badminton (ID=2)
('Dora Bizjak', 'Športna dvorana z visokim stropom', 'Tyrševa ulica 1, Maribor', '2025-06-01', '19:00:00', 2, 4, 'Badminton turnir dvojic', 4, 2),
('Dora Bizjak', 'Dvorana za rekreativce', 'Koroška cesta 18, Maribor', '2025-06-02', '17:00:00', 2, 4, 'Popoldanski individualni trening', 5, 2),
('Dora Bizjak', 'Otroška športna dvorana', 'Pobreška cesta 23, Maribor', '2025-06-03', '16:00:00', 2, 4, 'Badminton delavnica za otroke', 6, 2),

-- Košarka (ID=3)
('Bojan Kovac', 'Velika šolska telovadnica', 'Levstikova ulica 1, Celje', '2025-06-01', '18:00:00', 5, 10, 'Polfinale ulične košarke', 7, 3),
('Bojan Kovac', 'Telovadnica z lesenim podom', 'Gregorčičeva ulica 15, Celje', '2025-06-02', '17:00:00', 5, 10, 'Trening natančnosti metov', 8, 3),
('Bojan Kovac', 'Otroška košarkarska telovadnica', 'Gubčeva ulica 10, Celje', '2025-06-03', '16:00:00', 5, 10, 'Delavnica za mlade talente', 9, 3),

-- Odbojka (ID=4)
('Dora Bizjak', 'Večnamenska odbojkarska dvorana', 'Tržaška cesta 2, Ljubljana', '2025-06-01', '18:00:00', 6, 12, 'Ekipni turnir z nagradami', 10, 4),
('Dora Bizjak', 'Dvorana z mehko podlago', 'Partizanska cesta 12, Maribor', '2025-06-02', '19:00:00', 6, 12, 'Trening komunikacije na igrišču', 11, 4),
('Dora Bizjak', 'Otroška športna dvorana', 'Kidričeva cesta 5, Kranj', '2025-06-03', '16:00:00', 6, 12, 'Igriva odbojka za otroke', 12, 4),

-- Tenis (ID=5)	
('Bojan Kovac', 'Centralno igrišče z rdečo mivko', 'Viška cesta 3, Ljubljana', '2025-06-01', '16:00:00', 1, 2, 'Turnir posameznikov', 13, 5),
('Bojan Kovac', 'Igrišče s trdo podlago', 'Bratov Učakar 22, Ljubljana', '2025-06-02', '17:00:00', 1, 2, 'Jutranji trening za natančnost', 1, 5),
('Bojan Kovac', 'Otroško teniško igrišče', 'Rožna dolina cesta IX 16, Ljubljana', '2025-06-03', '18:00:00', 1, 2, 'Mini tenis za otroke', 2, 5),

-- Kegljanje (ID=6)
('Hrvoje Petek', 'Notranja kegljaška steza', 'Glavni trg 2, Novo mesto', '2025-06-01', '17:00:00', 2, 6, 'Turnir v klasičnem kegljanju', 3, 6),
('Hrvoje Petek', 'Športni center za kegljanje', 'Šmihelska cesta 33, Novo mesto', '2025-06-02', '18:00:00', 2, 6, 'Sproščeno kegljanje ob petkih', 4, 6),
('Hrvoje Petek', 'Otroška kegljaška steza', 'Ulica Slavka Gruma 12, Novo mesto', '2025-06-03', '16:00:00', 2, 6, 'Družinsko kegljanje', 5, 6),

-- Namizni tenis (ID=7)
('Jernej Breznik', 'Namiznoteniška dvorana', 'Prešernova ulica 15, Ptuj', '2025-06-01', '16:00:00', 1, 2, 'Posamični turnir', 6, 7),
('Jernej Breznik', 'Trening center', 'Osojnikova cesta 10, Ptuj', '2025-06-02', '17:00:00', 1, 2, 'Trening z mentorjem', 7, 7),
('Jernej Breznik', 'Otroška dvorana', 'Potrčeva cesta 6, Ptuj', '2025-06-03', '15:00:00', 1, 2, 'Delavnica za otroke', 8, 7),

-- Pikado (ID=8)
('Katja Zagar', 'Pub s pikado kotičkom', 'Ulica 1. junija 14, Trbovlje', '2025-06-01', '20:00:00', 2, 4, 'Večer pikada', 9, 8),
('Katja Zagar', 'Društveni dom', 'Trg revolucije 6, Trbovlje', '2025-06-02', '18:00:00', 2, 4, 'Turnir veteranov', 10, 8),
('Katja Zagar', 'Otroški pikado kotiček', 'Dom družbenih dejavnosti, Ulica Ivana Cankarja 2, Trbovlje', '2025-06-03', '16:00:00', 2, 4, 'Delavnica za začetnike', 11, 8),

-- Biljard (ID=9)
('Lovro Hocevar', 'Biljard klub', 'Kardeljev trg 5, Velenje', '2025-06-01', '17:00:00', 2, 4, 'Turnir v osmici', 12, 9),
('Lovro Hocevar', 'Lounge z biljard mizami', 'Rudarska cesta 1, Velenje', '2025-06-02', '19:00:00', 2, 4, 'Večer za pare', 13, 9),
('Lovro Hocevar', 'Dvorana za mladino', 'Šaleška cesta 3, Velenje', '2025-06-03', '16:00:00', 2, 4, 'Biljard za začetnike', 1, 9),

-- Golf (ID=10)
('Maja Cebulj', 'Igrišče z 18 luknjami', 'Kidričeva cesta 10, Bled', '2025-06-01', '08:00:00', 2, 4, 'Jutranji tee time', 2, 10),
('Maja Cebulj', 'Trening center', 'Partizanska cesta 4, Bled', '2025-06-02', '09:00:00', 2, 4, 'Vadba dolgih udarcev', 3, 10),
('Maja Cebulj', 'Otroško golf igrišče', 'Grajska cesta 21, Bled', '2025-06-03', '10:00:00', 2, 4, 'Mini golf za otroke', 4, 10),

-- Boks (ID=11)
('Ana Novak', 'Boksarska dvorana', 'Šmartinska cesta 152, Ljubljana', '2025-06-01', '18:00:00', 2, 2, 'Trening sparinga', 5, 11),
('Ana Novak', 'Trening center', 'Dunajska cesta 190, Ljubljana', '2025-06-02', '19:00:00', 2, 2, 'Tehnike obrambe', 6, 11),
('Ana Novak', 'Otroška dvorana', 'Zaloška cesta 65, Ljubljana', '2025-06-03', '17:00:00', 2, 2, 'Boks za otroke', 7, 11),

-- Judo (ID=12)
('Bojan Kovac', 'Judo dvorana', 'Gubčeva ulica 3a, Celje', '2025-06-01', '17:00:00', 2, 4, 'Osnove juda', 8, 12),
('Bojan Kovac', 'Trening center', 'Dečkova cesta 1, Celje', '2025-06-02', '18:00:00', 2, 4, 'Napredne tehnike', 9, 12),
('Bojan Kovac', 'Otroški center', 'Mariborska cesta 10, Celje', '2025-06-03', '16:00:00', 2, 4, 'Judo za najmlajše', 10, 12),

-- Hokej (ID=13)
('Dora Bizjak', 'Hokejska dvorana', 'Ledena dvorana Podmežakla, Jesenice', '2025-06-01', '18:00:00', 6, 12, 'Večerni trening', 11, 13),
('Dora Bizjak', 'Zunanje drsališče', 'Park Jesenice, Cesta maršala Tita', '2025-06-02', '17:00:00', 6, 12, 'Hokej za začetnike', 12, 13),
('Dora Bizjak', 'Otroško drsališče', 'Otroški center Jesenice, Ulica Viktorja Kejžarja', '2025-06-03', '16:00:00', 6, 12, 'Hokej za otroke', 13, 13);

-- Prijave za aktivnost 1
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 1, 1);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 2, 1);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 3, 1);

-- Prijave za aktivnost 2
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 4, 2);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 5, 2);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 6, 2);

-- Prijave za aktivnost 3
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 7, 3);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 8, 3);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 9, 3);

-- Prijave za aktivnost 4
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 10, 4);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 11, 4);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 12, 4);

-- Prijave za aktivnost 5
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 13, 5);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 1, 5);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 2, 5);

-- Prijave za aktivnost 6
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 3, 6);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 4, 6);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 5, 6);

-- Prijave za aktivnost 7
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 6, 7);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 7, 7);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 8, 7);

-- Prijave za aktivnost 8
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 12, 8);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 13, 8);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 1, 8);

-- Prijave za aktivnost 9
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 2, 9);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 3, 9);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 4, 9);

-- Prijave za aktivnost 10
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 5, 10);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 6, 10);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 7, 10);

-- Prijave za aktivnost 11
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 8, 11);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 9, 11);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 10, 11);

-- Prijave za aktivnost 12
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 11, 12);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 12, 12);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 13, 12);

-- Prijave za aktivnost 13
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 1, 13);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 2, 13);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 3, 13);

-- Prijave za aktivnost 14
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 4, 14);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 5, 14);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 6, 14);

-- Prijave za aktivnost 15
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 7, 15);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 8, 15);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 9, 15);

-- Prijave za aktivnost 16
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 10, 16);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 11, 16);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 12, 16);

-- Prijave za aktivnost 17
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 13, 17);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 1, 17);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 2, 17);

-- Prijave za aktivnost 18
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 3, 18);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 4, 18);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 5, 18);

-- Prijave za aktivnost 19
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 6, 19);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 7, 19);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 8, 19);

-- Prijave za aktivnost 20
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 9, 20);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 10, 20);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 11, 20);

-- Prijave za aktivnost 21
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 12, 21);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 13, 21);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 1, 21);

-- Prijave za aktivnost 22
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 2, 22);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 3, 22);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 4, 22);

-- Prijave za aktivnost 23
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 5, 23);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 6, 23);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 7, 23);

-- Prijave za aktivnost 24
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 8, 24);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 9, 24);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 10, 24);

-- Prijave za aktivnost 25
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 11, 25);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 12, 25);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 13, 25);

-- Prijave za aktivnost 26
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 1, 26);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 2, 26);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 3, 26);

-- Prijave za aktivnost 27
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 4, 27);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 5, 27);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 6, 27);

-- Prijave za aktivnost 28
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 7, 28);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 8, 28);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 9, 28);

-- Prijave za aktivnost 29
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 10, 29);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 11, 29);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 12, 29);

-- Prijave za aktivnost 30
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 13, 30);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 1, 30);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 2, 30);

-- Prijave za aktivnost 31
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 3, 31);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 4, 31);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 5, 31);

-- Prijave za aktivnost 32
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 6, 32);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 7, 32);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 8, 32);

-- Prijave za aktivnost 33
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 9, 33);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 10, 33);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 11, 33);

-- Prijave za aktivnost 34
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 12, 34);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 13, 34);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 1, 34);

-- Prijave za aktivnost 35
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 2, 35);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 3, 35);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 4, 35);

-- Prijave za aktivnost 36
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 5, 36);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 6, 36);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 7, 36);

-- Prijave za aktivnost 37
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 8, 37);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 9, 37);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 10, 37);

-- Prijave za aktivnost 38
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 11, 38);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 12, 38);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 13, 38);

-- Prijave za aktivnost 39
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 1, 39);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 2, 39);
INSERT INTO prijava (datumPrijave, FKuporabnik, FKaktivnost) VALUES (NOW(), 3, 39);

INSERT INTO komentar (vsebina, potDoSlike, datumObjave, FKuporabnik, FKaktivnost) VALUES
('Super aktivnost!', NULL, NOW(), 1, 1),
('Se veselim naslednje igre', NULL, NOW(), 2, 1),
('Dobra organizacija.', NULL, NOW(), 3, 1),
('Potrebno izboljšati pravila.', NULL, NOW(), 4, 2),
('Odlična ekipa!', NULL, NOW(), 5, 2),
('Še vedno je prostor za več igralcev.', NULL, NOW(), 6, 3),
('Hvala za povabilo.', NULL, NOW(), 7, 3),
('Zelo zabavno.', NULL, NOW(), 8, 4),
('Lokacija je odlična, ampak igrišče bi potrebovalo malo vzdrževanja.', NULL, NOW(), 9, 5),
('Organizator je bil zelo prijazen in profesionalen.', NULL, NOW(), 10, 6),
('Naslednjič priporočam malo daljši čas za aktivnost.', NULL, NOW(), 11, 7),
('Moja prva izkušnja in definitivno ne zadnja!', NULL, NOW(), 12, 8),
('Vreme nam je pokvarilo zabavo, ampak se že dogovarjamo za povratek.', NULL, NOW(), 13, 9),
('Popolnoma brezplačna aktivnost in tako dobra organizacija - čudovito!', NULL, NOW(), 1, 10),
('Udeležil sem se že večkrat in vedno je super.', NULL, NOW(), 2, 11),
('Za začetnike kot sem jaz je bilo malo prezahtevno.', NULL, NOW(), 3, 12),
('Prosim, organizirajte še več takih dogodkov!', NULL, NOW(), 4, 13),
('Čakal sem na to aktivnost že celo leto in ni me razočarala.', NULL, NOW(), 5, 14),
('Dobili smo celo majhne nagrade za udeležbo - super gesta!', NULL, NOW(), 6, 15),
('Moji otroci so bili navdušeni, hvala!', NULL, NOW(), 7, 16);

INSERT INTO spremembe (opis, FKaktivnost, FKuporabnik, FKkomentar) VALUES
('Spremenjen čas aktivnosti', 1, 2, 1),
('Dodana nova lokacija', 2, 4, 2),
('Spremenjen opis aktivnosti', 3, 2, 3);

INSERT INTO indexkomentarji (vsebina, datumObjave, FKuporabnik) VALUES
('Odlična platforma za iskanje soigralcev!', NOW(), 1),
('Super ideja, že dolgo sem iskal nekaj podobnega.', NOW(), 2),
('Zelo uporabna aplikacija za športne navdušence.', NOW(), 3),
('Hvala za to platformo, zdaj je lažje najti soigralce.', NOW(), 4),
('Odlična organizacija in preprosta uporaba.', NOW(), 5),
('Priporočam vsem, ki iščejo soigralce za športne aktivnosti.', NOW(), 6),
('Super izkušnja z uporabo platforme.', NOW(), 7),
('Zelo prijazna skupnost uporabnikov.', NOW(), 8),
('Odlična ideja za povezovanje športnih navdušencev.', NOW(), 9),
('Hvala za to platformo, zdaj je lažje najti soigralce.', NOW(), 10);

SELECT * FROM uporabnik;
SELECT * FROM administrator;
SELECT * FROM sport;
SELECT * FROM sportnaaktivnost;
SELECT * FROM prijava;
SELECT * FROM komentar;
SELECT * FROM spremembe;
SELECT * FROM indexkomentarji;