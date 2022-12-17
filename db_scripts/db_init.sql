
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
) ENGINE=MyISAM AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


INSERT INTO `sgfs` (`id`, `recordtime`, `tags`, `milestone`, `SGF`) VALUES
--(1, 20210207232424, 'joseki', 'init', ''),
--(2, 20210207232425, 'alphago', NULL, '');
(3, 20210207232425, 'joseki', NULL, '(;GM[1]FF[4]CA[UTF-8]AP[Sabaki:0.51.1]KM[7.5]SZ[19]DT[2022-12-17];B[pd];W[qc];B[qd];W[pc];B[od];W[nb];B[];W[mc])');

(2, 20210207232425, 'alphago', NULL, '');
COMMIT;