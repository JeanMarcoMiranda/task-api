import { Injectable } from '@nestjs/common';
import { Task, TaskStatus } from './task.model';
import { randomUUID } from 'crypto';
import { CreateTaskDto } from './dto/create-task.dto';

@Injectable()
export class TaskService {
  private tasks: Task[] = [];

  getAllTasks(): Task[] {
    return this.tasks;
  }

  createTask(createTaskDto: CreateTaskDto): Task {
    const task: Task = {
      id: randomUUID(),
      title: createTaskDto.title,
      description: createTaskDto.description,
      status: TaskStatus.OPEN,
    };

    this.tasks.push(task);
    return task;
  }
}
