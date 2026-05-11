CREATE DATABASE IF NOT EXISTS `limpieza_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `limpieza_db`;

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- --------------------------------------------------------
-- Tabla: roles
-- --------------------------------------------------------
CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `rol` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `roles` (`id`, `rol`) VALUES
(1, 'admin'),
(2, 'gestor'),
(3, 'empleado'),
(4, 'cliente');

ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `rol` (`rol`);

ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

-- --------------------------------------------------------
-- Tabla: users
-- Scripts de ejemplo:
--   admin@example.com   -> password: admin123
--   employee@example.com -> password: employee123
--   employee1@example.com -> password: employee123
--   client@example.com  -> password: client456
--   client1@example.com -> password: client456
-- --------------------------------------------------------
CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(250) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role_id` int(11) DEFAULT NULL,
  `type` enum('client','employee') DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `users` (`id`, `email`, `password`, `role_id`, `type`, `created_at`) VALUES
(1,  'employee@example.com',  '$2b$10$UXYcK0j4KYC.pzg/iUEdnuoJ4xPdJWbCiVhvQGHYNFgDAo30aCGIC', 3, 'employee', '2026-04-01 22:32:48'),
(2,  'client@example.com',    '$2b$10$9lq/G3NdJHIUvRMrWL9W4u3vwYL2zKyh4A/ogFikSkhmpDbYOMXE6', 4, 'client',   '2026-04-06 13:08:45'),
(3,  'admin@example.com',     '$2b$10$7IS4aUXw9NJ4c9dPMpEIG.1LHGHgoDz.YVs/Z5k1D/wi5D/pZS1ha', 1, 'employee', '2026-04-06 13:22:37'),
(4,  'client1@example.com',   '$2b$10$cYKK7q5rYffp7hSvQ6bGc.aVOMC1Ugf9MDY.ge5W5vfyC3qz2hzw2', 4, 'client',   '2026-04-06 13:29:31'),
(5,  'employee1@example.com', '$2b$10$.Vu/jYWXUsMc9cIuN7l7S.i0VGurG4H1T2dfNmfumbYnjzjqy1P4m', 3, 'employee', '2026-04-07 17:15:53'),
(13, 'gestor@example.com',    '$2b$10$VPa2WdSeEZeCM5Yb8fR0LO9qyw23vdgW7OhjjyPxBFnPCtc5jjyk2', 2, 'employee', '2026-04-10 16:49:44');

ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `role_id` (`role_id`);

ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- --------------------------------------------------------
-- Tabla: clients
-- --------------------------------------------------------
CREATE TABLE `clients` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellidos` varchar(150) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `role_id` int(11) NOT NULL DEFAULT 4,
  `created_at` datetime DEFAULT current_timestamp(),
  `user_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `clients` (`id`, `nombre`, `apellidos`, `direccion`, `telefono`, `role_id`, `created_at`, `user_id`) VALUES
(1, 'Juan',  'García',   'Calle Mayor 1',  '600000000', 4, '2026-04-06 13:09:25', 2),
(2, 'Pablo', 'Álvarez',  'Calle Mayor 4',  '622222222', 4, '2026-04-06 13:30:11', 4),
(3, 'María', 'López',    'Calle Gran Via 5', '611222333', 4, '2026-04-08 12:15:20', 2),
(4, 'Ana',   'Martínez', 'Calle Larios 3', '655444333', 4, '2026-04-10 00:02:29', 4);

ALTER TABLE `clients`
  ADD PRIMARY KEY (`id`),
  ADD KEY `role_id` (`role_id`),
  ADD KEY `fk_clients_user` (`user_id`);

ALTER TABLE `clients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

ALTER TABLE `clients`
  ADD CONSTRAINT `clients_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`),
  ADD CONSTRAINT `fk_clients_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

-- --------------------------------------------------------
-- Tabla: employees
-- --------------------------------------------------------
CREATE TABLE `employees` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellidos` varchar(150) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `iban` varchar(34) DEFAULT NULL,
  `nif` varchar(20) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `status` enum('activo','inactivo','vacaciones') DEFAULT 'activo',
  `created_at` datetime DEFAULT current_timestamp(),
  `user_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `employees` (`id`, `nombre`, `apellidos`, `telefono`, `iban`, `nif`, `direccion`, `status`, `created_at`, `user_id`) VALUES
(1, 'Paco',  'García Ruiz',  '899999999', 'ES9121000418450200051332', '56768765T', 'Calle Ejemplo, 1',    'activo',   '2026-04-06 17:31:50', 1),
(2, 'Oscar', 'Luque Porca',  '789767898', 'ES7620770024003102575766', '78654534R', 'Calle 24 Asesinato',  'activo',   '2026-04-07 17:22:32', 5),
(3, 'John',  'Doe',          '654895623', 'ES1567898765432100000000', '41526354L', 'Avenida América, 24', 'activo',   '2026-04-10 17:44:47', 5),
(4, 'María', 'Gestora',      '956878987', 'ES1245785698000000000000', '52654869P', 'Calle Ejemplo, 30',   'inactivo', '2026-04-15 13:02:18', 13);

ALTER TABLE `employees`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_employees_user` (`user_id`);

ALTER TABLE `employees`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

ALTER TABLE `employees`
  ADD CONSTRAINT `fk_employees_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

-- --------------------------------------------------------
-- Tabla: frecuencia
-- --------------------------------------------------------
CREATE TABLE `frecuencia` (
  `id` int(11) NOT NULL,
  `frecuencia` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `frecuencia` (`id`, `frecuencia`) VALUES
(1, 'Única'),
(2, 'Semanal'),
(3, 'Quincenal'),
(4, 'Mensual'),
(5, 'Anual'),
(6, 'Trimestral');

ALTER TABLE `frecuencia`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `frecuencia` (`frecuencia`);

ALTER TABLE `frecuencia`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

-- --------------------------------------------------------
-- Tabla: tipo_servicio
-- --------------------------------------------------------
CREATE TABLE `tipo_servicio` (
  `id` int(11) NOT NULL,
  `tipo_servicio` varchar(100) NOT NULL,
  `precio` decimal(8,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `tipo_servicio` (`id`, `tipo_servicio`, `precio`) VALUES
(1, 'Limpieza hogar',       20.00),
(2, 'Limpieza oficina',     50.00),
(3, 'Limpieza industrial', 100.00),
(4, 'Limpieza comunidad',   80.00);

ALTER TABLE `tipo_servicio`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `tipo_servicio` (`tipo_servicio`);

ALTER TABLE `tipo_servicio`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

-- --------------------------------------------------------
-- Tabla: permisos
-- --------------------------------------------------------
CREATE TABLE `permisos` (
  `id` int(11) NOT NULL,
  `tipo_permiso` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `permisos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `tipo_permiso` (`tipo_permiso`);

ALTER TABLE `permisos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

-- --------------------------------------------------------
-- Tabla: role_permisos
-- --------------------------------------------------------
CREATE TABLE `role_permisos` (
  `id_rol` int(11) NOT NULL,
  `id_permiso` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `role_permisos`
  ADD PRIMARY KEY (`id_rol`,`id_permiso`),
  ADD KEY `id_permiso` (`id_permiso`);

ALTER TABLE `role_permisos`
  ADD CONSTRAINT `role_permisos_ibfk_1` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id`),
  ADD CONSTRAINT `role_permisos_ibfk_2` FOREIGN KEY (`id_permiso`) REFERENCES `permisos` (`id`);

-- --------------------------------------------------------
-- Tabla: trabajos
-- --------------------------------------------------------
CREATE TABLE `trabajos` (
  `id` int(11) NOT NULL,
  `id_cliente` int(11) NOT NULL,
  `id_tipo_servicio` int(11) NOT NULL,
  `id_frecuencia` int(11) NOT NULL,
  `direccion_trabajo` varchar(255) NOT NULL,
  `estado` enum('creado','pendiente','presupuestado','aceptado','rechazado','cancelado','cancelacion_solicitada') NOT NULL DEFAULT 'pendiente',
  `precio` decimal(8,2) DEFAULT NULL,
  `duracion` int(11) DEFAULT NULL COMMENT 'Duración estimada en minutos',
  `fecha_hora` datetime NOT NULL COMMENT 'Cuándo se realiza el servicio',
  `created_at` datetime DEFAULT current_timestamp(),
  `presupuesto_expira_en` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `trabajos` (`id`, `id_cliente`, `id_tipo_servicio`, `id_frecuencia`, `direccion_trabajo`, `estado`, `precio`, `duracion`, `fecha_hora`, `created_at`, `presupuesto_expira_en`) VALUES
(1, 1, 1, 1, 'Calle Mayor 1',      'aceptado',  100.00, 80, '2026-04-15 10:00:00', '2026-04-06 13:18:58', '2026-04-22 15:27:00'),
(2, 2, 2, 2, 'Calle Mayor 4',      'aceptado',   80.00, 60, '2026-04-16 14:00:00', '2026-04-06 13:32:07', '2026-04-22 10:40:18'),
(3, 1, 3, 3, 'Calle Oficina, 0',   'cancelado', 300.00, 80, '2026-04-18 10:00:00', '2026-04-07 17:25:04', '2026-04-22 15:27:50'),
(4, 3, 1, 1, 'Calle Gran Via 5',   'pendiente',  NULL,  NULL,'2026-05-20 10:00:00', '2026-05-10 09:00:00', NULL),
(5, 4, 4, 4, 'Calle Larios 3',     'creado',     NULL,  NULL,'2026-05-25 11:00:00', '2026-05-10 09:30:00', NULL);

ALTER TABLE `trabajos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_cliente` (`id_cliente`),
  ADD KEY `id_tipo_servicio` (`id_tipo_servicio`),
  ADD KEY `id_frecuencia` (`id_frecuencia`);

ALTER TABLE `trabajos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

ALTER TABLE `trabajos`
  ADD CONSTRAINT `trabajos_ibfk_1` FOREIGN KEY (`id_cliente`) REFERENCES `clients` (`id`),
  ADD CONSTRAINT `trabajos_ibfk_2` FOREIGN KEY (`id_tipo_servicio`) REFERENCES `tipo_servicio` (`id`),
  ADD CONSTRAINT `trabajos_ibfk_3` FOREIGN KEY (`id_frecuencia`) REFERENCES `frecuencia` (`id`);

-- --------------------------------------------------------
-- Tabla: trabajo_empleado
-- --------------------------------------------------------
CREATE TABLE `trabajo_empleado` (
  `id_trabajo` int(11) NOT NULL,
  `id_empleado` int(11) NOT NULL,
  `fecha_asignacion` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `trabajo_empleado` (`id_trabajo`, `id_empleado`, `fecha_asignacion`) VALUES
(1, 1, '2026-04-07 12:26:29'),
(1, 2, '2026-04-07 17:26:42'),
(2, 1, '2026-04-07 12:40:18'),
(3, 2, '2026-04-07 17:27:50');

ALTER TABLE `trabajo_empleado`
  ADD PRIMARY KEY (`id_trabajo`,`id_empleado`),
  ADD KEY `id_empleado` (`id_empleado`);

ALTER TABLE `trabajo_empleado`
  ADD CONSTRAINT `trabajo_empleado_ibfk_1` FOREIGN KEY (`id_trabajo`) REFERENCES `trabajos` (`id`),
  ADD CONSTRAINT `trabajo_empleado_ibfk_2` FOREIGN KEY (`id_empleado`) REFERENCES `employees` (`id`);

-- --------------------------------------------------------
-- Tabla: migrations
-- --------------------------------------------------------
CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
