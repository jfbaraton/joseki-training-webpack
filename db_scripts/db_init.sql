
DROP TABLE IF EXISTS `player`;
CREATE TABLE IF NOT EXISTS `player` (
  `id` int NOT NULL AUTO_INCREMENT,
  `recordtime` bigint NOT NULL,
  `nickname` varchar(100) NOT NULL,
  `avatar` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nickname` (`nickname`,`avatar`),
  KEY `player_nickname` (`nickname`),
  KEY `player_avatar` (`avatar`)
) ENGINE=MyISAM AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `player` (`id`, `recordtime`, `nickname`, `avatar`) VALUES
(1, 20210207232424, 'ira', 'cat'),
(2, 20210207232425, 'jeff', 'blob'),
(3, 20210207232425, 'jouko', 'cat'),
(4, 20210207232425, 'anu', 'cat'),
(5, 20210207232425, 'random', 'cat'),
(0, 20210207232425, 'game master', 'blob');
COMMIT;

DROP TABLE IF EXISTS `sgfs`;
CREATE TABLE IF NOT EXISTS `sgfs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `recordtime` bigint NOT NULL,
  `tags` varchar(100) NOT NULL,
  `milestone` varchar(100),
  `SGF` LONGBLOB NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `tags_idx` (`tags`),
  INDEX `milestone_idx` (`milestone`)
) ENGINE=MyISAM AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--UPDATE `TableName` SET `ColumnName`=LOAD_FILE('FilePath/FileName.bin') WHERE `YourCondition`
--UPDATE `TableName` SET `ColumnName`=LOAD_FILE('FilePath/FileName.bin') WHERE `YourCondition`
INSERT INTO `sgfs` ( id, `recordtime`, `tags`, `milestone`, `SGF`) VALUES (5,320210207232426, 'hoshi', 'init', LOAD_FILE('/Users/jeff/Documents/POCs/joseki-training-webpack/client/src/test/1_hoshi_KGD_WR_clean.sgf'));
-- 4_komoku_KGD_WR_clean
-- 5_rest_KGD_WR_clean
-- eidogo_joseki.sgf
-- eidogo_joseki_WR.sgf
-- requires my.ini to have
--
-- secure_file_priv="c:/Users/yamak/Documents/joseki-training-webpack/client/src/test"
---
UPDATE `sgfs` SET `SGF`=LOAD_FILE('C:/Users/yamak/Documents/joseki-training-webpack/client/src/test/1_hoshi_KGD_WR_katrain4.sgf') WHERE id = 5;
UPDATE `sgfs` SET `SGF` = LOAD_FILE('C:/Users/yamak/Documents/joseki-training-webpack/client/src/test/eidogo_joseki.sgf') WHERE `sgfs`.`id` = 5;


INSERT INTO `sgfs` (`id`, `recordtime`, `tags`, `milestone`, `SGF`) VALUES
(3, '20210207232425', 'joseki', NULL, '(;GM[1]FF[4]CA[UTF-8]AP[Sabaki:0.51.1]KM[7.5]SZ[19]DT[2022-12-17];B[pd];W[qc];B[qd];W[pc];B[od];W[nb];B[];W[mc])'),
(4, '20210207232425', 'joseki', NULL, 0x283b474d5b315d46465b345d43415b5554462d385d41505b536162616b693a302e35312e315d4b4d5b372e355d535a5b31395d44545b323032322d31322d31375d3b425b70645d3b575b5d3b425b6e635d3b575b71635d3b425b71645d3b575b70635d424d5b315d29);

INSERT INTO `sgfs` (`id`, `recordtime`, `tags`, `milestone`, `SGF`) VALUES ('1', '20210207232424', 'joseki', 'init', LOAD_FILE('C:/Users/yamak/Documents/joseki-training-webpack/client/src/test/eidogo_joseki.sgf')),
(2, 20210207232425, 'alphago', NULL, '');



DROP TABLE IF EXISTS `OGS`;
CREATE TABLE IF NOT EXISTS `OGS` (
    `id` int NOT NULL AUTO_INCREMENT,
    `joseki_id` int NOT NULL,
    `endpoint` varchar(100) NOT NULL,
    `SGF` LONGBLOB NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `OGS_cache` (`joseki_id`,`endpoint`),
    KEY `OGS_joseki_id` (`joseki_id`),
    KEY `OGS_endpoint` (`endpoint`)
) ENGINE=MyISAM AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

COMMIT;