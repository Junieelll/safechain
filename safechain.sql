-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 29, 2025 at 07:43 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `safechain`
--

-- --------------------------------------------------------

--
-- Table structure for table `emergency_responders`
--

CREATE TABLE `emergency_responders` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `type` enum('fire','police','medical','rescue') NOT NULL,
  `contact` varchar(20) NOT NULL,
  `station_address` varchar(255) NOT NULL,
  `available` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `emergency_responders`
--

INSERT INTO `emergency_responders` (`id`, `name`, `type`, `contact`, `station_address`, `available`, `created_at`) VALUES
(1, 'Bureau of Fire Protection (BFP)', 'fire', '(02) 8426-0219', 'BFP Station, Quezon City', 1, '2025-12-13 14:11:41'),
(2, 'Philippine National Police (PNP)', 'police', '(02) 8722-0650', 'Police Station, Quezon City', 1, '2025-12-13 14:11:41'),
(3, 'Philippine Red Cross', 'medical', '143', 'Red Cross Office, Quezon City', 1, '2025-12-13 14:11:41'),
(4, 'NDRRMC', 'rescue', '(02) 8911-1406', 'NDRRMC Office, Quezon City', 1, '2025-12-13 14:11:41');

-- --------------------------------------------------------

--
-- Table structure for table `incidents`
--

CREATE TABLE `incidents` (
  `id` varchar(20) NOT NULL,
  `type` enum('fire','flood','crime') NOT NULL,
  `location` varchar(255) NOT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `device_id` varchar(20) DEFAULT NULL,
  `reporter` varchar(100) NOT NULL,
  `reporter_id` varchar(20) DEFAULT NULL,
  `date_time` datetime NOT NULL,
  `status` enum('pending','responding','resolved') NOT NULL,
  `dispatched_to` varchar(100) DEFAULT NULL,
  `dispatched_at` timestamp NULL DEFAULT NULL,
  `dispatched_by` varchar(100) DEFAULT NULL,
  `is_archived` tinyint(1) DEFAULT 0,
  `archived_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `incidents`
--

INSERT INTO `incidents` (`id`, `type`, `location`, `latitude`, `longitude`, `device_id`, `reporter`, `reporter_id`, `date_time`, `status`, `dispatched_to`, `dispatched_at`, `dispatched_by`, `is_archived`, `archived_at`, `created_at`, `updated_at`) VALUES
('EMG-2025-1001', 'fire', '321 Luna Street, Gulod, Novaliches, QC', 14.71398522, 121.04178874, 'SC-KC-004', 'Pedro Garcia', 'USR-2025-004', '2025-12-14 11:56:10', 'pending', NULL, NULL, NULL, 0, NULL, '2025-12-14 03:56:10', '2025-12-14 03:56:10'),
('EMG-2025-1002', 'crime', '789 Mabini Road, Gulod, Novaliches, QC', 14.71740575, 121.04158684, 'SC-KC-003', 'Anna Reyes', 'USR-2025-003', '2025-12-14 11:59:42', 'pending', NULL, NULL, NULL, 0, NULL, '2025-12-14 03:59:42', '2025-12-14 03:59:42');

-- --------------------------------------------------------

--
-- Table structure for table `incident_evidence`
--

CREATE TABLE `incident_evidence` (
  `id` int(11) NOT NULL,
  `incident_id` varchar(20) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_type` varchar(50) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `uploaded_by` varchar(100) NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `incident_notes`
--

CREATE TABLE `incident_notes` (
  `id` int(11) NOT NULL,
  `incident_id` varchar(20) NOT NULL,
  `admin_name` varchar(100) NOT NULL,
  `note` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `incident_timeline`
--

CREATE TABLE `incident_timeline` (
  `id` int(11) NOT NULL,
  `incident_id` varchar(20) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `actor` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `residents`
--

CREATE TABLE `residents` (
  `resident_id` varchar(20) NOT NULL,
  `name` varchar(100) NOT NULL,
  `address` varchar(255) NOT NULL,
  `contact` varchar(20) NOT NULL,
  `device_id` varchar(20) NOT NULL,
  `registered_date` date NOT NULL,
  `is_archived` tinyint(1) DEFAULT 0,
  `archived_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `residents`
--

INSERT INTO `residents` (`resident_id`, `name`, `address`, `contact`, `device_id`, `registered_date`, `is_archived`, `archived_at`, `created_at`, `updated_at`) VALUES
('USR-2025-001', 'Maria Santos', '123 Rizal Street, Gulod, Novaliches, QC', '+63 910 123 4567', 'SC-KC-001', '2025-09-15', 0, NULL, '2025-12-13 03:55:24', '2025-12-13 03:55:24'),
('USR-2025-002', 'Juan Dela Cruz', '456 Bonifacio Avenue, Gulod, Novaliches, QC', '+63 920 234 5678', 'SC-KC-002', '2025-09-20', 0, NULL, '2025-12-13 03:55:24', '2025-12-13 03:55:24'),
('USR-2025-003', 'Anna Reyes', '789 Mabini Road, Gulod, Novaliches, QC', '+63 930 345 6789', 'SC-KC-003', '2025-10-05', 0, NULL, '2025-12-13 03:55:24', '2025-12-13 03:55:24'),
('USR-2025-004', 'Pedro Garcia', '321 Luna Street, Gulod, Novaliches, QC', '+63 940 456 7890', 'SC-KC-004', '2025-10-12', 0, NULL, '2025-12-13 03:55:24', '2025-12-13 03:55:24'),
('USR-2025-005', 'Rosa Martinez', '654 Del Pilar Avenue, Gulod, Novaliches, QC', '+63 950 567 8901', 'SC-KC-005', '2025-10-18', 0, NULL, '2025-12-13 03:55:24', '2025-12-13 03:55:24'),
('USR-2025-006', 'Carlos Lopez', '987 Aguinaldo Road, Gulod, Novaliches, QC', '+63 960 678 9012', 'SC-KC-006', '2025-10-25', 0, NULL, '2025-12-13 03:55:24', '2025-12-13 03:55:24'),
('USR-2025-007', 'Elena Torres', '147 Quezon Boulevard, Gulod, Novaliches, QC', '+63 970 789 0123', 'SC-KC-007', '2025-11-01', 0, NULL, '2025-12-13 03:55:24', '2025-12-13 03:55:24'),
('USR-2025-008', 'Miguel Fernandez', '258 Magsaysay Street, Gulod, Novaliches, QC', '+63 980 890 1234', 'SC-KC-008', '2025-11-08', 0, NULL, '2025-12-13 03:55:24', '2025-12-13 13:37:08'),
('USR-2025-009', 'Sofia Ramirez', '369 Osmena Avenue, Gulod, Novaliches, QC', '+63 990 901 2345', 'SC-KC-009', '2025-11-15', 0, NULL, '2025-12-13 03:55:24', '2025-12-13 13:37:08');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` varchar(20) NOT NULL,
  `name` varchar(100) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','bpso','bhert','firefighter') NOT NULL DEFAULT 'bpso',
  `status` enum('active','suspended') DEFAULT 'active',
  `suspended_until` datetime DEFAULT NULL,
  `suspension_reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_login` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `name`, `username`, `password`, `role`, `status`, `suspended_until`, `suspension_reason`, `created_at`, `updated_at`, `last_login`) VALUES
('USR-2025-001', 'Juniel Cardenas', 'junieelll', '$2y$12$lt51yuFoBB2N1qtrpvAY9.aojxSE0er3AnICbX2mlqh0QJwNudD7y', 'admin', 'active', NULL, NULL, '2025-12-12 08:02:20', '2025-12-29 06:39:58', '2025-12-29 06:39:58'),
('USR-2025-002', 'Admin', '@admin', '$2y$12$lt51yuFoBB2N1qtrpvAY9.aojxSE0er3AnICbX2mlqh0QJwNudD7y', 'admin', 'active', NULL, NULL, '2025-12-13 06:12:53', '2025-12-13 06:13:11', '2025-12-13 06:13:11'),
('USR-2025-003', 'Juniel Cardenas', '@juniel.cardenas', '$2y$10$XgvOiHqTM7a/oPi.FnMVZumORaOdC4VWBSoGEWXkGSdk5IlbkMm/S', 'bpso', 'suspended', '2026-01-01 07:42:15', 'hahaha', '2025-12-29 06:40:37', '2025-12-29 06:42:15', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `emergency_responders`
--
ALTER TABLE `emergency_responders`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `incidents`
--
ALTER TABLE `incidents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_reporter_id` (`reporter_id`),
  ADD KEY `idx_device_id` (`device_id`),
  ADD KEY `idx_coordinates` (`latitude`,`longitude`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_active_incidents` (`is_archived`,`status`,`created_at`);

--
-- Indexes for table `incident_evidence`
--
ALTER TABLE `incident_evidence`
  ADD PRIMARY KEY (`id`),
  ADD KEY `incident_id` (`incident_id`);

--
-- Indexes for table `incident_notes`
--
ALTER TABLE `incident_notes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `incident_id` (`incident_id`);

--
-- Indexes for table `incident_timeline`
--
ALTER TABLE `incident_timeline`
  ADD PRIMARY KEY (`id`),
  ADD KEY `incident_id` (`incident_id`);

--
-- Indexes for table `residents`
--
ALTER TABLE `residents`
  ADD PRIMARY KEY (`resident_id`),
  ADD KEY `idx_is_archived` (`is_archived`),
  ADD KEY `idx_device_lookup` (`device_id`,`is_archived`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`username`),
  ADD KEY `idx_email` (`username`),
  ADD KEY `idx_role` (`role`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `emergency_responders`
--
ALTER TABLE `emergency_responders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `incident_evidence`
--
ALTER TABLE `incident_evidence`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `incident_notes`
--
ALTER TABLE `incident_notes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `incident_timeline`
--
ALTER TABLE `incident_timeline`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `incident_evidence`
--
ALTER TABLE `incident_evidence`
  ADD CONSTRAINT `incident_evidence_ibfk_1` FOREIGN KEY (`incident_id`) REFERENCES `incidents` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `incident_notes`
--
ALTER TABLE `incident_notes`
  ADD CONSTRAINT `incident_notes_ibfk_1` FOREIGN KEY (`incident_id`) REFERENCES `incidents` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `incident_timeline`
--
ALTER TABLE `incident_timeline`
  ADD CONSTRAINT `incident_timeline_ibfk_1` FOREIGN KEY (`incident_id`) REFERENCES `incidents` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
