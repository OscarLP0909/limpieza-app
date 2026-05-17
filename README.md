# 🧹 Limpieza Pro

Aplicación web fullstack para la gestión integral de una empresa de servicios de limpieza. Desarrollada con React y TypeScript en el frontend y Node.js con Express en el backend, incorpora autenticación con JWT, sistema de roles y permisos, flujo completo de presupuestación y notificaciones automáticas por email.

---

## 🛠️ Stack tecnológico

**Frontend**

- React
- TypeScript
- TailwindCSS

**Backend**

- Node.js
- Express.js
- TypeScript
- MySQL

**Otras herramientas**

- JWT + cookies httpOnly
- Nodemailer
- node-cron
- Swagger
- bcrypt

---

## 📋 Funcionalidades

### Autenticación y roles

- Login con JWT almacenado en cookie httpOnly
- Sistema de roles: `admin`, `gestor`, `empleado`, `cliente`
- Middleware de autenticación y autorización por rol
- Registro de nuevos clientes

### Gestión de trabajos

- Los clientes pueden solicitar trabajos especificando tipo de servicio, frecuencia, dirección y fecha
- El admin/gestor asigna empleados y genera el presupuesto automáticamente
- El precio se calcula en base al tipo de servicio y el número de empleados asignados
- El cliente recibe el presupuesto por email y puede aceptarlo, rechazarlo o cancelarlo

### Flujo de estados de un trabajo

```
creado → revisando → presupuestado → aceptado → en_curso → finalizado
                           ↓               ↓
                        rechazado       cancelado
```

### Notificaciones por email

- Email al admin/gestor cuando un cliente solicita un nuevo trabajo
- Email al cliente cuando el presupuesto está listo
- Email recordatorio cuando el presupuesto está próximo a expirar
- Email al cliente cuando su trabajo es cancelado

### Cron job automático

- Cada día a las 9:00 comprueba presupuestos próximos a expirar y envía recordatorio
- Cancela automáticamente los presupuestos que llevan más de 2 días sin respuesta tras su fecha de expiración

### Gestión de empleados, clientes y servicios

- CRUD completo de empleados, clientes, tipos de servicio y frecuencias
- Gestión de usuarios internos (admin y gestor)
- Paginación en todos los endpoints que devuelven listas

### API documentada

- Documentación completa con Swagger disponible en `/api-docs`

---

## 🗄️ Esquema de base de datos

| Tabla              | Descripción                                         |
| ------------------ | --------------------------------------------------- |
| `Users`            | Tabla central de autenticación                      |
| `Clients`          | Datos de los clientes                               |
| `Employees`        | Datos de los empleados                              |
| `Roles`            | Roles del sistema                                   |
| `Trabajos`         | Tabla central de trabajos                           |
| `trabajo_empleado` | Relación muchos a muchos entre trabajos y empleados |
| `tipo_servicio`    | Tipos de servicio disponibles con su precio base    |
| `frecuencia`       | frecuencias de servicio disponibles                 |

---

## 🚀 Instalación y uso

### Requisitos

- Node.js 18+
- MySQL 8+

### Backend

```bash
cd backend
npm install
```

Crea un fichero `.env` basándote en `.env.example`:

```
PORT=3000
JWT_SECRET=tu_secreto
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=limpieza_db
ORIGIN=http://localhost:5173
MAIL_USER=tu@gmail.com
MAIL_PASS=tu_app_password
NODE_ENV=development
```

Importa el schema de base de datos:

```bash
mysql -u root -p < schema_limpieza.sql
```

Arranca el servidor:

```bash
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 📄 Endpoints principales

| Método | Ruta                | Descripción                  | Roles         |
| ------ | ------------------- | ---------------------------- | ------------- |
| POST   | `/auth/login`       | Login                        | Todos         |
| POST   | `/auth/register`    | Registro de cliente          | Público       |
| POST   | `/auth/logout`      | Logout                       | Autenticado   |
| GET    | `/works`            | Listar trabajos              | Admin, Gestor |
| POST   | `/works`            | Crear trabajo                | Cliente       |
| PATCH  | `/works/:id`        | Presupuestar trabajo         | Admin, Gestor |
| PATCH  | `/works/:id/status` | Aceptar/rechazar presupuesto | Cliente       |
| GET    | `/employees`        | Listar empleados             | Admin, Gestor |
| POST   | `/employees`        | Crear empleado               | Admin         |
| GET    | `/clients`          | Listar clientes              | Admin, Gestor |
| GET    | `/services`         | Listar servicios             | Admin         |

Documentación completa disponible en `http://localhost:3000/api-docs`

---

## 👤 Autor

**Óscar Luque Porca**

- GitHub: [@OscarLP0909](https://github.com/OscarLP0909)
- LinkedIn: [Óscar Luque Porca](https://www.linkedin.com/in/%C3%B3scar-luque-porca-052686347/)
