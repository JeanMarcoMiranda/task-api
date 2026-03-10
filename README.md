# task-api 📋

Una API REST de gestión de tareas construida con **NestJS** como proyecto de aprendizaje de los conceptos fundamentales del framework. La API permite crear, consultar, actualizar el estado y eliminar tareas, con datos almacenados en memoria (sin base de datos).

---

## Propósito del proyecto

Este proyecto fue creado con el objetivo de aprender y practicar los conceptos básicos del desarrollo de APIs con **NestJS**, incluyendo:

- Creación y organización de **Módulos**, **Controladores** y **Servicios**
- Uso de **Decoradores** de NestJS para definir rutas HTTP
- Implementación de **DTOs** (Data Transfer Objects) con validación
- Manejo de **excepciones HTTP** (`NotFoundException`)
- Aplicación de **Pipes de validación globales**
- Tipado fuerte con **TypeScript** (interfaces y enums)
- Principio de **inyección de dependencias**

---

## Stack tecnológico

| Tecnología                                                          | Versión | Rol                             |
| ------------------------------------------------------------------- | ------- | ------------------------------- |
| [NestJS](https://nestjs.com/)                                       | ^11.0.1 | Framework principal del backend |
| [TypeScript](https://www.typescriptlang.org/)                       | ^5.7.3  | Lenguaje de programación        |
| [class-validator](https://github.com/typestack/class-validator)     | ^0.15.1 | Validación de DTOs              |
| [class-transformer](https://github.com/typestack/class-transformer) | ^0.5.1  | Transformación de objetos       |
| [uuid](https://github.com/uuidjs/uuid)                              | ^13.0.0 | Generación de IDs únicos        |
| [pnpm](https://pnpm.io/)                                            | -       | Gestor de paquetes              |
| [Jest](https://jestjs.io/)                                          | ^30.0.0 | Framework de testing            |

---

## Estructura del proyecto

```
task-api/
├── src/
│   ├── app.module.ts          # Módulo raíz de la aplicación
│   ├── app.controller.ts      # Controlador raíz
│   ├── app.service.ts         # Servicio raíz
│   ├── main.ts                # Punto de entrada (bootstrap)
│   └── task/                  # Módulo de tareas (feature module)
│       ├── dto/
│       │   └── create-task.dto.ts   # DTO para crear una tarea
│       ├── task.controller.ts       # Controlador de tareas (rutas HTTP)
│       ├── task.controller.spec.ts  # Tests del controlador
│       ├── task.model.ts            # Modelo (interfaz + enum de estado)
│       ├── task.module.ts           # Módulo de tareas
│       ├── task.service.ts          # Lógica de negocio
│       └── task.service.spec.ts     # Tests del servicio
├── test/
│   └── app.e2e-spec.ts        # Tests end-to-end
├── nest-cli.json
├── package.json
├── tsconfig.json
└── .prettierrc
```

---

## Conceptos aprendidos paso a paso

### 1. Módulos (`@Module`)

En NestJS, la aplicación se organiza en **módulos**. El módulo raíz es `AppModule` y cada feature (funcionalidad) tiene su propio módulo.

```typescript
// src/app.module.ts
@Module({
  imports: [TaskModule], // Se importan los módulos de feature
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

```typescript
// src/task/task.module.ts
@Module({
  controllers: [TaskController],
  providers: [TaskService],
})
export class TaskModule {}
```

> Los **módulos** agrupan lógica relacionada. `TaskModule` encapsula todo lo relacionado con las tareas: su controlador y su servicio.

---

### 2. El punto de entrada (`main.ts`)

El archivo `main.ts` es el **bootstrap** de la aplicación. Aquí se crea la instancia de NestJS y se configuran los **pipes globales**.

```typescript
// src/main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe()); // Activa validación global
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

> `ValidationPipe` es un pipe global que intercepta todas las peticiones entrantes y valida los datos del cuerpo (`@Body`) según las reglas definidas en los DTOs. Sin esto, los decoradores de `class-validator` no tendrían efecto.

---

### 3. El Modelo de datos (`task.model.ts`)

El modelo define la **estructura** de una tarea usando una **interfaz** de TypeScript y los **estados** posibles usando un **enum**.

```typescript
// src/task/task.model.ts
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
}

export enum TaskStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}
```

> La **interfaz** `Task` garantiza que cualquier objeto de tarea en el código siempre tenga `id`, `title`, `description` y `status`. El **enum** `TaskStatus` evita usar strings "mágicos" como `'OPEN'` directamente y centraliza los valores válidos.

---

### 4. DTOs y Validación (`create-task.dto.ts`)

Un **DTO** (Data Transfer Object) es un objeto que define la forma de los datos que se esperan recibir en una petición. Se usa `class-validator` para agregar reglas de validación con decoradores.

```typescript
// src/task/dto/create-task.dto.ts
import { IsNotEmpty } from 'class-validator';

export class CreateTaskDto {
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  description: string;
}
```

> Si una petición llega con `title` o `description` vacíos, NestJS automáticamente rechaza la petición y devuelve un error `400 Bad Request` gracias a `ValidationPipe` + `@IsNotEmpty()`. Sin el DTO, habría que validar manualmente en el controlador o servicio.

---

### 5. El Servicio (`task.service.ts`)

El **servicio** contiene toda la **lógica de negocio**. En este proyecto, las tareas se almacenan en un arreglo en memoria (sin base de datos).

```typescript
// src/task/task.service.ts
@Injectable()
export class TaskService {
  private tasks: Task[] = []; // "Base de datos" en memoria

  getAllTasks(): Task[] {
    return this.tasks;
  }

  createTask(createTaskDto: CreateTaskDto): Task {
    const task: Task = {
      id: randomUUID(), // Se genera un ID único automáticamente
      title: createTaskDto.title,
      description: createTaskDto.description,
      status: TaskStatus.OPEN, // Toda tarea nueva comienza en OPEN
    };
    this.tasks.push(task);
    return task;
  }

  getTaskById(id: string): Task {
    const found = this.tasks.find((task) => task.id === id);
    if (!found) {
      throw new NotFoundException(`Tarea con ID "${id}" no encontrada.`);
    }
    return found;
  }

  deleteTask(id: string): void {
    this.getTaskById(id); // Primero verifica que existe
    this.tasks = this.tasks.filter((task) => task.id !== id);
  }

  updateTaskStatus(id: string, status: TaskStatus): Task {
    const task = this.getTaskById(id);
    task.status = status;
    return task;
  }
}
```

> El decorador `@Injectable()` marca la clase para que NestJS pueda **inyectarla** como dependencia en otros lugares (como el controlador). `NotFoundException` es una excepción HTTP de NestJS que automáticamente devuelve un `404 Not Found` al cliente.

---

### 6. El Controlador (`task.controller.ts`)

El **controlador** maneja las **peticiones HTTP** entrantes y delega el trabajo al servicio. Nunca contiene lógica de negocio.

```typescript
// src/task/task.controller.ts
@Controller('tasks') // Prefijo de ruta: /tasks
export class TaskController {
  constructor(private readonly taskService: TaskService) {} // Inyección de dependencias

  @Get()
  getAllTasks(): Task[] {
    return this.taskService.getAllTasks();
  }

  @Post()
  createTask(@Body() createTaskDto: CreateTaskDto): Task {
    return this.taskService.createTask(createTaskDto);
  }

  @Delete('/:id')
  deleteTask(@Param('id') id: string): void {
    this.taskService.deleteTask(id);
  }

  @Patch('/:id/status')
  updateTaskStatus(
    @Param('id') id: string,
    @Body('status') status: TaskStatus,
  ) {
    return this.taskService.updateTaskStatus(id, status);
  }
}
```

> La **inyección de dependencias** ocurre en el constructor: NestJS crea automáticamente una instancia de `TaskService` y la proporciona al controlador. `@Body()` extrae el cuerpo de la petición, `@Param('id')` extrae el parámetro de la URL, y `@Body('status')` extrae solo el campo `status` del cuerpo.

---

## Endpoints de la API

| Método   | Endpoint            | Descripción                      | Cuerpo (Body)                              |
| -------- | ------------------- | -------------------------------- | ------------------------------------------ |
| `GET`    | `/tasks`            | Obtiene todas las tareas         | -                                          |
| `POST`   | `/tasks`            | Crea una nueva tarea             | `{ "title": "...", "description": "..." }` |
| `DELETE` | `/tasks/:id`        | Elimina una tarea por ID         | -                                          |
| `PATCH`  | `/tasks/:id/status` | Actualiza el estado de una tarea | `{ "status": "IN_PROGRESS" }`              |

### Estados válidos para una tarea

| Estado        | Descripción                              |
| ------------- | ---------------------------------------- |
| `OPEN`        | Estado inicial. La tarea está pendiente. |
| `IN_PROGRESS` | La tarea está en progreso.               |
| `DONE`        | La tarea ha sido completada.             |

---

## Cómo ejecutar el proyecto

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Ejecutar en modo desarrollo (con hot-reload)

```bash
pnpm run start:dev
```

La API estará disponible en: `http://localhost:3000`

### 3. Otros modos de ejecución

```bash
# Modo normal
pnpm run start

# Modo producción (requiere build previo)
pnpm run build
pnpm run start:prod
```

---

## Pruebas

```bash
# Ejecutar tests unitarios
pnpm run test

# Ejecutar tests en modo watch (re-ejecuta al detectar cambios)
pnpm run test:watch

# Ejecutar tests con reporte de cobertura
pnpm run test:cov

# Ejecutar tests end-to-end
pnpm run test:e2e
```

---

## Ejemplos de uso con `curl`

**Crear una tarea:**

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Aprender NestJS", "description": "Completar el tutorial de NestJS"}'
```

**Obtener todas las tareas:**

```bash
curl http://localhost:3000/tasks
```

**Actualizar el estado de una tarea:**

```bash
curl -X PATCH http://localhost:3000/tasks/<ID>/status \
  -H "Content-Type: application/json" \
  -d '{"status": "IN_PROGRESS"}'
```

**Eliminar una tarea:**

```bash
curl -X DELETE http://localhost:3000/tasks/<ID>
```

---

## Notas importantes

- **Los datos no persisten**: Al reiniciar el servidor, todas las tareas se pierden porque se almacenan en memoria (arreglo en `TaskService`). Un siguiente paso natural sería integrar una base de datos como PostgreSQL con TypeORM o Prisma.
- **Sin autenticación**: La API es completamente pública. Un siguiente paso sería agregar autenticación con JWT usando `@nestjs/passport`.

---

## Recursos de aprendizaje utilizados

- [Documentación oficial de NestJS](https://docs.nestjs.com)
- [class-validator](https://github.com/typestack/class-validator) — validación de DTOs
- [NestJS Pipes](https://docs.nestjs.com/pipes) — transformación y validación de datos
- [NestJS Exception Filters](https://docs.nestjs.com/exception-filters) — manejo de errores HTTP
