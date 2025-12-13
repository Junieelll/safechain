-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 13, 2025 at 09:16 AM
-- Server version: 10.4.25-MariaDB
-- PHP Version: 8.1.10

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
-- Table structure for table `incidents`
--

CREATE TABLE `incidents` (
  `id` varchar(20) NOT NULL,
  `type` enum('fire','flood','crime') NOT NULL,
  `location` varchar(255) NOT NULL,
  `reporter` varchar(100) NOT NULL,
  `date_time` datetime NOT NULL,
  `status` enum('pending','responding','resolved') NOT NULL,
  `is_archived` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `incidents`
--

INSERT INTO `incidents` (`id`, `type`, `location`, `reporter`, `date_time`, `status`, `is_archived`, `created_at`, `updated_at`) VALUES
('EMG-2025-1001', 'fire', 'Quirino Highway near Gulod Bridge, Novaliches, QC', 'Juan Dela Cruz', '2025-11-20 10:15:00', 'resolved', 1, '2025-12-13 00:22:06', '2025-12-13 00:56:51'),
('EMG-2025-1002', 'flood', 'Regalado Avenue, Gulod, Novaliches, QC', 'Maria Garcia', '2025-11-19 14:30:00', 'responding', 0, '2025-12-13 00:22:06', '2025-12-13 00:22:06'),
('EMG-2025-1003', 'crime', 'Gulod Elementary School Area, Novaliches, QC', 'Pedro Santos', '2025-11-18 20:45:00', 'pending', 0, '2025-12-13 00:22:06', '2025-12-13 00:22:06'),
('EMG-2025-1004', 'fire', 'San Bartolome Street, Gulod, Novaliches, QC', 'Ana Reyes', '2025-11-17 11:20:00', 'resolved', 0, '2025-12-13 00:22:06', '2025-12-13 00:22:06'),
('EMG-2025-1005', 'flood', 'Gulod Barangay Hall, Novaliches, QC', 'Carlos Mendoza', '2025-11-16 16:15:00', 'responding', 0, '2025-12-13 00:22:06', '2025-12-13 00:22:06'),
('EMG-2025-1006', 'crime', 'Mindanao Avenue Extension, Gulod, Novaliches, QC', 'Rosa Martinez', '2025-11-15 09:30:00', 'pending', 0, '2025-12-13 00:22:06', '2025-12-13 00:22:06'),
('EMG-2025-1007', 'fire', 'Novaliches-Bayan Road, Gulod Area, QC', 'Miguel Torres', '2025-11-14 13:45:00', 'resolved', 0, '2025-12-13 00:22:06', '2025-12-13 00:22:06'),
('EMG-2025-1008', 'flood', 'Susano Road near Gulod Market, Novaliches, QC', 'Linda Cruz', '2025-11-13 19:00:00', 'responding', 0, '2025-12-13 00:22:06', '2025-12-13 00:22:06'),
('EMG-2025-1009', 'crime', 'Dahlia Avenue, Gulod, Novaliches, QC', 'Ramon Silva', '2025-11-12 15:25:00', 'pending', 0, '2025-12-13 00:22:06', '2025-12-13 00:22:06'),
('EMG-2025-1010', 'fire', 'General Luis Street, Gulod, Novaliches, QC', 'Elena Ramos', '2025-11-11 12:10:00', 'resolved', 0, '2025-12-13 00:22:06', '2025-12-13 00:22:06'),
('EMG-2025-1011', 'flood', 'Camarin Road near Gulod Chapel, Novaliches, QC', 'Jose Lopez', '2025-11-10 05:40:00', 'responding', 0, '2025-12-13 00:22:06', '2025-12-13 00:22:06'),
('EMG-2025-1012', 'crime', 'Sto. Cristo Street, Gulod, Novaliches, QC', 'Sofia Flores', '2025-11-09 22:55:00', 'pending', 0, '2025-12-13 00:22:06', '2025-12-13 00:22:06'),
('EMG-2025-1013', 'fire', 'Bagong Silang Avenue, Gulod Area, Novaliches, QC', 'Diego Morales', '2025-11-08 08:20:00', 'resolved', 0, '2025-12-13 00:22:06', '2025-12-13 00:22:06'),
('EMG-2025-1014', 'flood', 'Tungko Street, Gulod, Novaliches, QC', 'Carmen Aquino', '2025-11-07 14:15:00', 'responding', 0, '2025-12-13 00:22:06', '2025-12-13 00:22:06'),
('EMG-2025-1015', 'crime', 'Maligaya Drive, Gulod, Novaliches, QC', 'Ricardo Villanueva', '2025-11-06 18:30:00', 'pending', 0, '2025-12-13 00:22:06', '2025-12-13 00:22:06'),
('EMG-2025-1016', 'fire', 'San Agustin Street, Gulod, Novaliches, QC', 'Isabella Castro', '2025-11-05 11:45:00', 'resolved', 0, '2025-12-13 00:22:06', '2025-12-13 00:22:06'),
('EMG-2025-1017', 'flood', 'Quirino Highway near Gulod Flyover, Novaliches, QC', 'Antonio Valdez', '2025-11-04 16:00:00', 'responding', 0, '2025-12-13 00:22:06', '2025-12-13 00:22:06'),
('EMG-2025-1018', 'crime', 'Sangandaan Street, Gulod, Novaliches, QC', 'Patricia Fernandez', '2025-11-03 09:25:00', 'pending', 0, '2025-12-13 00:22:06', '2025-12-13 00:22:06'),
('EMG-2025-1019', 'fire', 'Violago Street near Gulod Health Center, Novaliches, QC', 'Gabriel Santos', '2025-11-02 13:50:00', 'resolved', 0, '2025-12-13 00:22:06', '2025-12-13 00:22:06'),
('EMG-2025-1020', 'flood', 'Regalado Highway, Gulod Proper, Novaliches, QC', 'Victoria Reyes', '2025-11-01 19:35:00', 'responding', 0, '2025-12-13 00:22:06', '2025-12-13 00:22:06');

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
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `residents`
--

INSERT INTO `residents` (`resident_id`, `name`, `address`, `contact`, `device_id`, `registered_date`, `is_archived`, `created_at`, `updated_at`) VALUES
('USR-2025-001', 'Maria Santos', '123 Rizal Street, Gulod, Novaliches, QC', '+63 910 123 4567', 'SC-KC-001', '2025-09-15', 0, '2025-12-13 03:55:24', '2025-12-13 03:55:24'),
('USR-2025-002', 'Juan Dela Cruz', '456 Bonifacio Avenue, Gulod, Novaliches, QC', '+63 920 234 5678', 'SC-KC-002', '2025-09-20', 0, '2025-12-13 03:55:24', '2025-12-13 03:55:24'),
('USR-2025-003', 'Anna Reyes', '789 Mabini Road, Gulod, Novaliches, QC', '+63 930 345 6789', 'SC-KC-003', '2025-10-05', 0, '2025-12-13 03:55:24', '2025-12-13 03:55:24'),
('USR-2025-004', 'Pedro Garcia', '321 Luna Street, Gulod, Novaliches, QC', '+63 940 456 7890', 'SC-KC-004', '2025-10-12', 0, '2025-12-13 03:55:24', '2025-12-13 03:55:24'),
('USR-2025-005', 'Rosa Martinez', '654 Del Pilar Avenue, Gulod, Novaliches, QC', '+63 950 567 8901', 'SC-KC-005', '2025-10-18', 0, '2025-12-13 03:55:24', '2025-12-13 03:55:24'),
('USR-2025-006', 'Carlos Lopez', '987 Aguinaldo Road, Gulod, Novaliches, QC', '+63 960 678 9012', 'SC-KC-006', '2025-10-25', 0, '2025-12-13 03:55:24', '2025-12-13 03:55:24'),
('USR-2025-007', 'Elena Torres', '147 Quezon Boulevard, Gulod, Novaliches, QC', '+63 970 789 0123', 'SC-KC-007', '2025-11-01', 0, '2025-12-13 03:55:24', '2025-12-13 03:55:24'),
('USR-2025-008', 'Miguel Fernandez', '258 Magsaysay Street, Gulod, Novaliches, QC', '+63 980 890 1234', 'SC-KC-008', '2025-11-08', 0, '2025-12-13 03:55:24', '2025-12-13 03:55:24'),
('USR-2025-009', 'Sofia Ramirez', '369 Osmena Avenue, Gulod, Novaliches, QC', '+63 990 901 2345', 'SC-KC-009', '2025-11-15', 0, '2025-12-13 03:55:24', '2025-12-13 03:55:24'),
('USR-2025-010', 'Diego Mendoza', '741 Roxas Road, Gulod, Novaliches, QC', '+63 915 012 3456', 'SC-KC-010', '2025-11-20', 0, '2025-12-13 03:55:24', '2025-12-13 03:55:24'),
('USR-2025-011', 'Isabel Cruz', '852 Marcos Boulevard, Gulod, Novaliches, QC', '+63 925 123 4568', 'SC-KC-011', '2025-11-23', 1, '2025-12-13 03:55:24', '2025-12-13 04:45:35');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` varchar(20) NOT NULL,
  `name` varchar(100) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','operator') NOT NULL DEFAULT 'operator',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_login` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `name`, `username`, `password`, `role`, `created_at`, `updated_at`, `last_login`) VALUES
('USR-2025-001', 'Juniel Cardenas', 'junieelll', '$2y$12$lt51yuFoBB2N1qtrpvAY9.aojxSE0er3AnICbX2mlqh0QJwNudD7y', 'admin', '2025-12-12 08:02:20', '2025-12-13 00:34:40', '2025-12-13 00:34:40'),
('USR-2025-002', 'Admin', '@admin', '$2y$12$lt51yuFoBB2N1qtrpvAY9.aojxSE0er3AnICbX2mlqh0QJwNudD7y', 'admin', '2025-12-13 06:12:53', '2025-12-13 06:13:11', '2025-12-13 06:13:11');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `incidents`
--
ALTER TABLE `incidents`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `residents`
--
ALTER TABLE `residents`
  ADD PRIMARY KEY (`resident_id`),
  ADD KEY `idx_is_archived` (`is_archived`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`username`),
  ADD KEY `idx_email` (`username`),
  ADD KEY `idx_role` (`role`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
